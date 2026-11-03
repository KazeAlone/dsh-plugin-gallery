# 编排与身份接入接口

## 资源读取

同一 DSH 宿主插件声明 `static inject = ["gallery"]` 后调用 `ctx.gallery`：

```js
const page = await ctx.gallery.listResources({ type: 'skill', scope: 'all', limit: 100 });
const selected = await ctx.gallery.getResource(page.items[0].id);
const ref = { id: selected.id, digest: selected.digest };
const snapshot = await ctx.gallery.getSnapshot(ref);
// 把 snapshot 保存到本次运行记录，再交给 agent 节点使用。
```

方法：

- `listResources({type?,q?,scope?:'all'|'mine',limit?:1..100,offset?}, {signal?}?)`
- `getResource(id, {signal?}?)`
- `resolveReference({id,digest?}, {signal?}?)`：摘要不符返回 `DIGEST_MISMATCH` / 409。
- `getSnapshot({id,digest?}, {signal?}?)`：返回独立的 `{id,digest,resource}` 内容副本。
- `getIdentity()`：返回经服务验证的 `{issuer,subject,tenantId,displayName}`，不返回凭证。

资源详情包含 `{id,type,name,description,tags,files,metadata,references,digest,revision,owner,canEdit,fileCount,createdAt,updatedAt}`。文件为 `{path,encoding:'utf8'|'base64',content,bytes}`，摘要是规范化资源 JSON 的 SHA-256。列表省略 files、metadata、references。owner 可以为 null（待确认的旧资源）。身份主键是 issuer + subject + tenantId，displayName 只用于展示。不要按姓名判断权限。

没有版本检索接口，digest 是变化检测值，不是可下载的旧版本索引。需要复现的运行由编排插件保存 snapshot。依赖是声明信息，不会自动递归获取或执行；消费方需要解析 references，并处理缺失、循环和摘要变化。

独立进程使用相同读取接口及受归属约束的写入接口：

```js
import { GalleryClient } from 'dsh-plugin-gallery/sdk';
const client = new GalleryClient({url:process.env.GALLERY_URL,credential:process.env.GALLERY_CREDENTIAL});
const page = await client.listResources({type:'agent'});
// client.createResource(resource)
// client.updateResource(id, resource, expectedRevision)
```

HTTP API：`GET /health`；`POST /v1/identity/enroll` 接收 `{displayName,code}`；其余接口需 `Authorization: Bearer CREDENTIAL`：`GET /v1/identity`、`GET/POST /v1/resources`、`GET/PUT /v1/resources/:id`。PUT 为 `{resource,expectedRevision}`。错误为 `{error:{code,message}}`，HTTP 状态表达失败；401 未验证、403 非作者、404 不存在或不在当前租户、409 并发冲突或摘要不符。维护者发码、分配归属不提供 HTTP 路由。浏览器通过 DSH owner RPC 访问，中央服务不开放 CORS，并拒绝带 Origin 的请求。

## 后续多租户平台

宿主身份接入口：`await ctx.gallery.setIdentity({serverUrl?,credential})`。它先调用共享服务验证 credential，再写入本机；不能传入自报的 subject、角色或 tenantId 来授权。这个方法面向可信宿主插件，不注册为浏览器 RPC。凭证只留在 Host，资源接口仍由共享服务最终裁定权限。

共享服务支持身份提供器注入：

```js
import { VerifiedPlatformIdentityProvider } from 'dsh-plugin-gallery/identity';
import { createGalleryServer } from 'dsh-plugin-gallery/server';
const identityProvider = new VerifiedPlatformIdentityProvider(async request => {
  // 在服务端验证平台签名凭证，包括签名算法、密钥、issuer、audience、expiry。
  const claims = await yourPlatformVerifier(request.headers.authorization);
  return {issuer:claims.iss,subject:claims.sub,tenantId:claims.tenant,displayName:claims.name};
});
const server = createGalleryServer({store,identityProvider});
```

验证器由维护者配置，不能从浏览器或 HTTP 注册。默认使用一次性接入码提供器；外部提供器必须自行完成实际密码学验证，接口本身不包含某个平台的 JWT 实现。替换为平台提供器时默认不开放接入码兑换。租户过滤在资源服务端执行。

平台身份与原 Gallery 身份 issuer/subject 不同，不会按同名自动合并。正式切换前需明确身份映射与受控迁移方案；首版不提供自动合并已有资源归属的 API。
