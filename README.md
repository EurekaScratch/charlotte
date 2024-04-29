<div align="center">

# 🌠 Charlotte
#### Enhance your favorite Scratch editors.

</div>

---

Charlotte is a Scratch addons loader, that is designed to be flexible and extensible. Charlotte can add lots of exciting features to mostly **any** Scratch editors.   

The project takes its name from the minor planet "543 Charlotte" orbiting the Sun. It was discovered by Paul Götz on September 11, 1904, in Heidelberg.
# What is the different from ScratchAddons?
1. ScratchAddons only supports official Scratch site up to now. Charlotte supports many Scratch-based editors like ClipCC, Gandi, etc.
2. ScratchAddons is a browser extension, Charlotte is a userscript.
3. Charlotte has a different API than ScratchAddons.

# ✨ Features
1. More convenient dev overflow, Powered by ViolentMonkey's hot reload.
2. Charlotte's core part and addons are both written in TypeScript, which means less bugs and more stability.
3. Neat, easy-to-use Addon API
 
# 🌈 Supported Platforms
Here are the Scratch-based websites we currently officially support. You can also add support for other websites by modifying the code.
- Scratch
- Codingclip
- Cocrea
- Aerfaying (阿儿法营)
- Co-Create World (共创世界)
- Xiaomawang (小码王)
- CodeLab
- 40code
- TurboWarp
- Xueersi (学而思)
- Creaticode
- Adacraft
- PenguinMod
- ElectraMod
- XPlab

# 💡 Installation
1. Since Charlotte is a userscript, You should make sure your browser has Userscript Manager installed. For desktop, ViolentMonkey and Tampermonkey are both ok, but we recommend ViolentMonkey since it has better development experience. For mobile, Via Browser/Kiwi Browser is a good choice.
2. Install Charlotte by clicking `charlotte.user.js` in GitHub releases.
3. All done! You can enjoy Charlotte in your favorite editors.

...Well, maybe you also need to manage the addons you need to use. We currently offer the following solutions:

## Open Addons Modal
1. By Click '🌠 Charlotte' button at the bottom of the 'My Blocks' category. (Make sure Blockly is accessible and 'Dashboard' addon is enabled)
2. Open Browser's DevTools (usually can be opened by pressing "F12"), Checkout 'Console' tab, input `__charlotte.app.openFrontend()` then evaluate.

## Manage your addons
After opened the addons modal, You can turn on/off and configure addons. Some addons May require a refresh to be enabled or disabled.
For addon details, see [our addons](https://charlotte.codingclip.cc/addons/api)


# ⚓ License
AGPL-3.0, see [LICENSE](./LICENSE).
