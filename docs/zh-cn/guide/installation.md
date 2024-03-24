# 官方支持的平台
以下是我们目前正式支持的基于 Scratch 的网站。你也可以通过修改代码添加对其他网站的支持。
- Scratch
- 别针社区
- Cocrea
- 阿儿法营
- 共创世界
- 小码王
- CodeLab
- 40code
- TurboWarp
- 学而思
- Creaticode
- Adacraft
- PenguinMod
- 
# 安装
1. 由于 Charlotte 是一个用户脚本，因此应确保浏览器安装了用户脚本管理器。对于桌面浏览器，ViolentMonkey 和 Tampermonkey 都可以，但我们推荐使用 ViolentMonkey，因为它有更好的开发经验。对于手机，Via Browser/Kiwi Browser 是不错的选择。
2. 点击 GitHub 发行版中的 `charlotte.user.js` 安装 Charlotte。
3. 大功告成！你可以在自己喜欢的编辑器中使用 Charlotte。

# 使用方法
...也许你还需要管理你需要使用的附加组件。我们目前提供以下解决方案：

## 打开管理模态框
1. 点击 "自定义积木 "类别底部的 "🌠 Charlotte"按钮。(确保 Blockly 可访问且 "Dashboard "插件已启用）
2. 打开浏览器的 DevTools（通常可通过按 "F12 "键打开），查看 "控制台 "选项卡，输入 `__charlotte.app.openFrontend()` 并执行。
## 管理插件
打开管理模态框后，你可以打开/关闭并配置插件。某些附加组件可能需要刷新才能启用或禁用。
有关所有插件的详细信息，请参阅 [插件](../addons/api)
