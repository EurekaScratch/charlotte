# Develop Charlotte
Before start, You can read [ScratchAddons's Addon Basic](https://scratchaddons.com/docs/develop/getting-started/addon-basics/) to have a basic understanding of addon.   
To begin with, You need clone Charlotte's repository to your computer and install dependencies:
```bash
# Make sure Node.js & pnpm installed
git clone git@github.com:EurekaScratch/charlotte.git
cd charlotte
pnpm install #Install dependencies
pnpm run eureka:init ## Initialize Eureka addon
pnpm run build # Generate addon manifest
```

# Debugging
Charlotte supports debugging lively powered by Violentmonkey's 'Track External Edits' feature.
0. Install Violentmonkey
1. Run `pnpm run dev` to start dev server.
2. Open ``http://localhost:10001/charlotte.user.js`` in your broswer.
3. Install then click 'Track External Edits' button.
4. Now you can debugging Charlotte lively. All changes in source will be synced in broswer.

Now you you can create your first addon!
