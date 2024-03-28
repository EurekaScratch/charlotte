# 用户脚本
用户脚本是插入网页的 JavaScript 代码片段，通常用于添加或修改内容。对于 Charlotte 来说，用户脚本的作用就是修改 Scratch 编辑器中的内容。(实际上，Charlotte 也是一个用户脚本 😂） 
与某些用户脚本管理器（例如：TamperMonkey、ViolentMonkey）中的用户脚本不同，Charlotte 的用户脚本有着不同的结构。
## 基本结构
Charlotte 内置插件的用户脚本可以是 JavaScript 或 TypeScript。如果你想减少代码中潜在的 bug，我们建议你使用 TypeScript，我们也将在接下来的示例中主要使用 TypeScript 进行演示。
```ts
// 添加许可证信息或导入某些类型声明。大多数情况下，除类型外，您不应导入任何其他文件。
import type { AddonCtxWithAPI } from '../api/api';

// 用户脚本的入口函数，每次激活插件时都会被调用。
export default async function ({addon, intl, settings}: AddonCtxWithAPI) {
  // 一般来说，您应将所有脚本内容都放在该函数中。
  // ...

  // 每次停用插件时，都会调用该用户脚本的卸载函数。
  // 如果您的插件无法动态禁用，您可以删除此功能，因为它没有必要。
  return () => {
    // ...
  };
}
```
下面是对函数参数的一些解释：
- `addon`: Charlotte 的全局上下文实例，包含加载器、前端和全局设置等内容。我们使用该实例来进行插件之间的交互（包括对 API 的访问）和对事件的监听。
- `intl`: 为插件提供多语言支持的实例。实际上，该对象由 ``@formatjs/intl`` 提供，您可以阅读其[类型定义](/doc/interfaces/src_core_util_l10n.IntlShape)。
- `settings`: 为插件封装的设置实例。您可以轻松获取此插件定义的设置并监听其更改(通过 `settings.get(id)` 和 `settings.on('change', (id) => {})`)。

除了上述区别外，您还可以在函数中自由添加代码逻辑。需要注意的是，所有用户脚本都是直接在页面上运行的，这意味着你可以直接修改页面内容。

## 使用 API
与普通的用户脚本不同，Charlotte 还封装了一些与 Scratch 编辑器交互相关的实用方法，可以帮助你更快地开发 Scratch 插件。现在，我们将使用 Charlotte API 编写一个 "Hello World"。
::: tip
由于 Charlotte API 也是以插件的形式提供的，因此应将 `api` 插件标记为 `required` 以确保可以正确使用 API。尽管在大多数情况下，"api "插件总是先加载的。
:::
```ts
import type { AddonCtxWithAPI } from '../api/api';

export default async function ({addon, intl, settings}: AddonCtxWithAPI) {
  // 获取 Scratch 虚拟机实例
  const vm = await addon.api.getVM();
  // 向观看者说你好
  const sayHello = () => vm.runtime.emit('SAY', vm.editingTarget, 'say', `Hello ${vm.runtime.ioDevices.userData.getUsername() ?? 'World'}!`);
  // 当项目被运行时触发
  vm.on('PROJECT_START', sayHello);
  return () => {
    // 在插件被禁用前停止监听
    vm.off('PROJECT_START', sayHello);
  };
}
```
![预览](/guide/example-userscript.png)   
如要阅读完整的 API 文档, 请看 [Charlotte API](/doc/interfaces/addons_api_api.CharlotteAPI).
## 监听事件
您可以使用 `addon.on()` 来监听 Charlotte 或其他插件发出的事件。Charlotte 目前缺乏完整的事件列表，但我们已整理了一些常用事件。除此之外，您可能需要阅读我们的源代码才能获得完整的事件信息。

| 事件名                   | 描述                               | 事件参数  | 说明         |
|--------------------------|------------------------------------|-----------|--------------|
| core.addon.activated     | 当一个插件被激活时触发             | id        |              |
| core.addon.deactivated   | 当一个插件被禁用时触发             | id        |              |
| core.settings.changed    | 当设置被更改时触发                 |           |              |
| API.instance.initialized | 当所有实例被捕获时触发             |           | 需要 api     |