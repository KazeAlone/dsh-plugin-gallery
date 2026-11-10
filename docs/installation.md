# 安装方式与依赖

插件已在 dependencies 中声明 @modelcontextprotocol/client 和 yaml。源码包包含构建好的 dist/client.js，但不包含 node_modules。

## 安装包分发（推荐）

在插件源码目录执行：

```bash
npm pack --ignore-scripts
```

该操作生成安装包，不要求先给源码目录安装依赖。使用实际生成的文件名安装：

```bash
dsh plugin --profile web add /absolute/path/dsh-plugin-gallery-0.20.8.tgz --ignore-scripts
```

包管理器会为安装包解析和安装运行依赖。--ignore-scripts 仅跳过生命周期脚本，不等于跳过运行依赖。安装后重启 DSH、刷新浏览器。

## 本地源码目录链接

```bash
dsh plugin --profile web add /absolute/path/dsh-gallery --ignore-scripts
```

目录安装通常保存为 link:，DSH 直接加载原目录的 src/host.mjs。链接本身不会自动在该目录安装依赖；本地开发者需先在源码目录执行 npm install --ignore-scripts。源码发生前端修改后还需 npm run build，并重启 DSH。保留被链接的目录。

如果出现 Cannot find package '@modelcontextprotocol/client' imported from /原目录/src/mcp-check.mjs，说明 DSH 正在从未准备好依赖的源码目录加载插件。正式分发请使用上面的安装包方式，而不是为每台使用者手工补装源码依赖。

## 替换旧目录链接

先停止对应 DSH 实例，再移除旧链接并安装包：

```bash
dsh plugin --profile web remove dsh-plugin-gallery
dsh plugin --profile web add /absolute/path/dsh-plugin-gallery-0.20.8.tgz --ignore-scripts
```

使用指定 CLI 版本时，命令前缀为 npx @deepseek-ai/dsh@0.2.1-rc.5 plugin --profile web。插件管理使用 plugin 子命令，而不是把 update 参数传给 Web 启动命令。配置名需与实际运行实例一致。
