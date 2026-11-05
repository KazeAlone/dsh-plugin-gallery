# Gallery 本地存储

当前数据写入 `$DSH_HOME/gallery/resources.json`，未设置 DSH_HOME 时为 `~/.dsh/gallery/resources.json`。无需数据库、共享服务或插件身份凭证。

文件格式为 `{format:1,resources:[...]}`。每条资源有 UUID、规范化内容、SHA-256 摘要、revision 和创建/更新时间。文件及附件内容随资源存储。

每次读操作读取当前文件；写操作先获取同目录 `.lock` 目录锁、读取最新数据并校验 revision，再写入权限 0600 的临时文件，最后原子替换。其他写入正在进行时返回 CONFLICT，可稍后重试。损坏或未知格式文件会报错，不会用空资源库覆盖。进程若在持锁期间异常退出，确认没有其他写入进程后可移除遗留的 `resources.json.lock` 目录；先备份数据。

未设置最大资源库总容量，当前适用于开发和本地资源整理；每个资源仍受 100 个文件及 5 MiB 限制。后续统一数据库通过存储适配器扩展。

原 SQLite 数据和旧身份文件保持原样，不自动迁移，也不自动覆盖 JSON 数据。旧资源可通过 Gallery JSON 导出/导入。历史共享服务和迁移工具暂保留，但默认 DSH 插件不会加载它们。

## 连接配置

`gallery/storage.json` 保存默认内部存储配置，默认库 ID 和 activeLibraryId 固定为 local，数据路径固定为 `gallery/resources.json`。旧多库配置中的额外库和选中状态不再使用，旧额外库引用返回 LIBRARY_NOT_FOUND。确认配置后保存规范化的单库配置。

没有配置文件时可直接使用默认库。未知格式或损坏配置会报错，配置写入保留写锁和原子替换。当前不提供新建、切换、迁移或合并资源库的功能。
