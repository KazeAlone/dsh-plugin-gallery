# 单用户存储契约 · schema v2

`SqliteGalleryStore` 管理本地资源，宿主通过存储接口调用它，浏览器没有 SQL 或文件系统访问能力。

接口：

- `list(query)`、`create(payload)`、`get(id)`、`update(id,payload,expectedRevision)`。
- `publish(id,expectedRevision,note)`、`versions(id)`、`getVersion(id,version)`、`rollback(id,version,expectedRevision)`。
- `close()`。

这些方法不再接受成员身份。`GalleryReader` 可包装同步或异步适配器；宿主写入操作也会等待返回结果。

## 不变量

1. 草稿可直接查看与修改。多窗口写入必须比较 revision，不静默覆盖旧编辑。
2. 发布快照、摘要和版本号不可变。版本生成、发布指针更新、资源审计事件属于同一事务。
3. 回滚生成新草稿，不改写发布历史。
4. 发布时必须存在所有固定依赖版本。
5. 服务边界校验文件路径、文件数量、大小及资源类型。

## v1 → v2

v2 只有 resources、versions、audit 三张业务表，没有成员、令牌或资源所有者字段。

默认本地库不存在时，`openGalleryStore` 用 Node SQLite backup 复制旧 service DB 的一致快照（包含 WAL 中提交的数据），通过独占链接落到新路径。已有本地库不会被覆盖。原 service DB 保留。

打开旧格式库时，在执行迁移前用 `VACUUM INTO` 保存独立备份；然后在一个事务内复制资源、版本和资源审计记录，删除旧表，重命名新表，设置 user_version=2。资源 ID、草稿 revision、时间戳、快照文本和 digest 保持原样；成员相关审计记录不迁入新库。

若迁移事务失败则回滚。新版号大于 2 的数据库拒绝打开，避免旧插件改写新格式。数据库及备份文件使用 0600 权限。

迁移后备份和原数据库仍可能包含旧成员数据，仅供恢复保留，不参与当前资源操作。清理这些备份应由操作者在确认升级后自行决定。

以后更换存储需要迁移资源 ID、草稿 revision、版本快照、摘要与审计记录，并保持上述不变量；消费插件读取契约可保持不变。
