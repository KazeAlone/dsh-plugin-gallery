# Storage adapter contract

The HTTP server receives a store instance (`createGalleryServer(store)`), rather than opening SQLite itself. Browser and DSH integration consume HTTP/SDK and have no SQL dependencies.

Required operations:

- Authentication/members: `authenticate(token)`, `bootstrap(name)`, `listMembers(actor)`, `addMember(actor,input)`, `rotateMember(actor,id,active)`.
- Resources: `list(actor,query)`, `create(actor,input)`, `get(actor,id)`, `update(actor,id,payload,expectedRevision)`.
- Versions: `publish(actor,id,expectedRevision,note)`, `versions(actor,id)`, `getVersion(actor,id,version)`, `rollback(actor,id,version,expectedRevision)`.
- Lifecycle: `close()`.

The HTTP layer awaits all store operations. An adapter may implement synchronous methods (SQLite) or asynchronous methods (remote storage), without changing the UI, SDK or HTTP contract.

Preserve these invariants in a replacement:

1. Server assigns author from authenticated identity, never a submitted owner field.
2. Only author/admin can edit, publish or restore drafts. Team members can read all published versions, not others' drafts.
3. Draft update and publication compare an expected revision. Snapshot insertion, monotonic version assignment, publication pointer and audit event are atomic.
4. Published files and digest never change. Rollback writes a new draft; publication history remains reachable.
5. Every referenced resource/version exists at publication. File path, count and size validation remain at the service boundary.
6. Raw member tokens are never persisted in the shared database, returned by list endpoints or included in logs.

SQLite schema v1: members, resources, versions, audit. File contents are stored in normalized snapshot JSON. This simplifies backups and migration at current size limits. Before migrating a live database, stop writers and back up the database (or use SQLite's backup facility including WAL consistency), export IDs, owner mappings, draft revisions, published snapshots, version digests and audit records, import them preserving identity, and run the contract tests against the replacement.

A future GitHub adapter also needs concurrency handling (commit leases/CAS), a member identity mapping and a consistent multi-object publish operation. GitHub as import/sync source may be simpler than using it as the authoritative transactional store. Changing storage is not a zero-cost migration.
