# Gallery integration contract · API v1

## Resource types and version identity

`type`: `skill | agent | mcp | workflow`.

Resource payload:

```json
{
  "type":"skill",
  "name":"Code review",
  "description":"Review a patch",
  "tags":["engineering"],
  "files":[{"path":"SKILL.md","encoding":"utf8","content":"# Review","bytes":8}],
  "metadata":{},
  "references":[{"id":"other-resource-uuid","version":1}]
}
```

The service normalizes file order/tags and computes a SHA-256 digest of the persisted JSON snapshot. `bytes` is computed by the server. Version numbers are positive monotonic integers scoped to a resource. Draft revision numbers are separate optimistic concurrency tokens.

Pin a node dependency as `{id, version, digest?}`. Never resolve `latest` implicitly during a running workflow. A newer publication doesn't alter existing snapshots or references. `references` contains exact resource/version dependencies, not an executable workflow format.

## Same-host Cordis service

Declare `inject = ['gallery']`. The trusted host service exposes:

```ts
listResources(query?: {type?: string; q?: string; scope?: 'all'|'mine'|'published'; limit?: number; offset?: number}, options?: {signal?: AbortSignal}): Promise<{items: Summary[]; total: number; limit: number; offset: number}>
listVersions(id: string): Promise<{items: VersionSummary[]}>
getResource(id: string, options?: {signal?: AbortSignal}): Promise<ResourceDetail>
getVersion(id: string, version: number, options?: {signal?: AbortSignal}): Promise<PublishedVersion>
resolveReference(ref: {id: string; version: number; digest?: string}, options?: {signal?: AbortSignal}): Promise<PublishedVersion>
```

`getResource` returns `draft` only to author/admin. For execution always use `getVersion` / `resolveReference`. Publication result: `{id,version,digest,note,actorId,createdAt,resource}`. Tool executors should forward their cancellation `signal`.

The orchestration node editor can query published skills, show name/description/author, fetch version history through HTTP SDK if required, and save a pinned reference in its own node configuration. Resolving a reference returns files; it does not copy files to disk or grant execution permissions. Path confinement, conversion to the target agent's skill format and lifecycle belong to the consumer.

## HTTP / independent process SDK

```js
import { GalleryClient } from 'dsh-plugin-gallery/sdk'
const gallery = new GalleryClient({url:process.env.GALLERY_URL,token:process.env.GALLERY_TOKEN})
const page = await gallery.listResources({type:'skill',scope:'published'})
const versions = await gallery.listVersions(page.items[0].id)
const snapshot = await gallery.resolveReference({id:page.items[0].id,version:versions.items[0].version})
```

All `/v1` endpoints require `Authorization: Bearer <member token>`. HTTP is permitted by the SDK only for loopback development; remote endpoints use HTTPS. Redirects are refused to keep credentials at the configured service. Default request timeout: 20 seconds.

| Method | Endpoint | Operation |
|---|---|---|
| GET | `/health` | Unauthenticated service/API identity |
| GET | `/v1/me` | Current member |
| GET | `/v1/resources` | Query `type,q,scope,limit,offset` (limit 1–100) |
| POST | `/v1/resources` | Create a draft; body is resource payload |
| GET | `/v1/resources/:id` | Detail, permitted draft and latest publication |
| PUT | `/v1/resources/:id/draft` | `{resource,expectedRevision}` |
| POST | `/v1/resources/:id/publish` | `{expectedRevision,note}` |
| GET | `/v1/resources/:id/versions` | Published version metadata |
| GET | `/v1/resources/:id/versions/:version` | Immutable full snapshot |
| POST | `/v1/resources/:id/rollback` | `{version,expectedRevision}` restores new draft |
| GET | `/v1/members` | Admin: members without tokens |
| POST | `/v1/members` | Admin: `{name,role:'member'|'admin'}`; returns one-time token |
| POST | `/v1/members/:id/access` | Admin: `{active:true}` rotates token; false revokes access |

Errors: `{error:{code,message}}`. `401` invalid/revoked credentials; `403` insufficient role/ownership; `404` missing or hidden resource/version; `409 CONFLICT` stale draft revision. On conflict, reload and reconcile changes; do not silently overwrite.

## Browser RPC

`src/descriptors.mjs` declares owner-only Gallery control methods. Shared service authorization is always enforced even when a client lies about button states, resource ownership or member IDs. The DSH browser uses host RPC so team credentials do not need browser localStorage and remote service doesn't need permissive CORS.
