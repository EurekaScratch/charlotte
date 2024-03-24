# 插件结构
所有插件都存储在 Charlotte 仓库的 `addons` 目录中。如果要添加插件，您需要创建自己的插件目录。基本文件结构如下:
```
addons/
- [...其他插件]/
- [您的插件 ID]/
  - addon.json
  - userscript.ts
  - userstyles.css
  - [...资源文件］
```
## `addon.json`
插件清单会告诉 Charlotte 您的插件是如何工作的。这是您开始编码的基础，以下是基本的清单结构:
```json
{
    "name": "🌠 流星雨",
    "description": "在工作区添加流星雨",
    "userscripts": [
        {
            "url": "userscript",
            "match": ["all"],
            "runAtComplete": false
        }
    ],
    "dynamicEnable": false,
    "dynamicDisable": false,
    "required": ["api"]
}
```
更多详情请参阅 [Addon manifest](/doc/interfaces/src_core_loader_loader.AddonManifest)。