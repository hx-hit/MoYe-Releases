# 墨页 MoYe · 安装包与更新

免费、轻量、离线优先的 Markdown、源码和配置文件阅读与编辑器。作者：**HXi**。

从 [Releases](https://github.com/hx-hit/MoYe-Releases/releases/latest) 下载 Windows、Linux 与 macOS 安装包。

- **Moye-Setup**：安装版，支持软件内检查、下载和安装更新。
- **Moye-Portable**：免安装版，下载新版后手动替换。
- **linux-x64 / linux-arm64**：Debian/Ubuntu 安装包，以及依赖系统 GTK3、WebKitGTK 4.1、glibc >= 2.35 的 tar.gz 程序包。
- **macos-x64 / macos-arm64**：Intel 与 Apple Silicon 的 DMG（最低 macOS 11）；当前未进行 Apple 开发者签名和公证。
- Linux/macOS 可检查更新并打开对应架构的安装包，下载后手动安装。
- **SHA256SUMS.txt**：附件校验；`latest.yml` 和 `.blockmap` 用于更新。

安装包约 3.5 MB，使用 Windows 共享 WebView2 组件。支持 Markdown、C/C++、Python、JS、TS、Vue、Rust 与常见配置文本；文件拖入、标签右键管理、拖拽排序、查找替换、深浅主题。

**从 0.5.1 开始，软件使用本公开仓库检查和下载更新，无需 GitHub 登录或访问令牌。** 旧版本首次迁移请保存未保存文档后手动安装新版。

本仓库用于公开分发安装包、更新清单和发布说明，不包含应用源码或私有仓库的提交历史。公开发布程序只验证并发布构建好的文件，不构建应用。
