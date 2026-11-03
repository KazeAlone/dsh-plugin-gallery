# 共享服务存储

浏览器 → DSH owner RPC → Host SDK → 共享 HTTP 服务 → 存储适配器。每个 DSH 只保存服务地址与已验证凭证，资源集中在服务端数据库。

`SqliteGalleryStore` 是首版适配器，Node >=24.9，WAL、busy timeout、事务写入。资源存储契约：`list(principal,query)`、`get(principal,id)`、`create(principal,input)`、`update(principal,id,input,expectedRevision)`。身份来自可信服务端提供器，不能直接使用请求体身份。

不变量：

1. 所有读写均按 principal.tenantId 过滤。默认团队使用 default 空间。
2. 创建时所有者由 principal 派生，忽略请求中的 owner、subject、tenantId。
3. 修改必须匹配 issuer、subject、tenantId；姓名不参与授权。
4. 修改校验 revision，并在同一事务更新内容、摘要、修改时间与审计事件。revision 不提供历史恢复。
5. 无主旧资源只读，只能由本机维护命令核实并一次性分配给已存在身份。

schema v3：resources 保存当前 payload、digest、revision、归属与时间；settings 保存稳定签发方 issuer；identities 保存接入身份；enrollment_codes 与 credentials 只保存随机秘密的 SHA-256 摘要；resource_audit 保存资源操作的身份主键，不记录凭证。

维护者 `issueCode`、`assignUnowned` 不属于公开 HTTP/浏览器接口。一次性码兑换及凭证轮换用 BEGIN IMMEDIATE，恢复保留 subject 并撤销旧凭证；相同 subject 的其他接入码一并作废。码只应通过可信渠道发给对应成员，分发码本身是首版的身份信任根。

旧库迁移先用 VACUUM INTO 生成独立 0600 备份，再在事务内把原表重命名为 legacy_resources / legacy_versions / legacy_audit 等档案，从当前 draft 字段复制资源至新表。旧引用转换为 ID 引用；历史版本不再对外提供。旧归属不可信时不自动继承。单独的 import-local 使用 SQLite backup 读取原库一致快照，包含 WAL，并以独占链接落地，拒绝覆盖目标库。

备份应使用 SQLite backup 或停止服务后复制完整库，避免只复制打开状态下的主文件漏掉 WAL。迁移备份与 legacy_* 表仍包含旧数据，应按团队保留政策保护，不会因移除版本界面自动清理。

将来替换为数据库服务时，保持资源 ID、principal 归属、revision 并发语义、摘要算法和 HTTP 契约。认证码与凭证存储也需要迁移或替换；这不是仅修改一个连接字符串，但不应要求改动资源页与编排插件的读取接口。
