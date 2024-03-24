# 开发你的插件
在开始之前，你可以阅读 [ScratchAddons's Addon Basic](https://scratchaddons.com/docs/develop/getting-started/addon-basics/) 来对插件有一个基本的了解。  
首先，您需要将 Charlotte 的源代码克隆到您的电脑上，并安装依赖项：
```bash
# 确保已安装 Node.js 和 pnpm
git clone git@github.com:EurekaScratch/charlotte.git
cd charlotte
pnpm install #安装依赖项
pnpm run eureka:init ## 初始化 Eureka
pnpm run build # 生成插件清单
```

# 调试
Charlotte 支持由 Violentmonkey 的 "跟踪外部编辑 "功能提供的热调试。   
0. 安装 Violentmonkey
1. 运行 `pnpm run dev` 启动开发服务器。
2. 在浏览器中打开 `http://localhost:10001/charlotte.user.js`.
3. 安装后点击 "跟踪外部编辑 "按钮。
4. 现在你可以热调试 Charlotte。源代码中的所有更改都将同步到浏览器中。

现在你可以创建你的第一个插件了！
