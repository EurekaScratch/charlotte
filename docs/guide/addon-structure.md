# Addon Structure
All addons are stored in Charlotte repo's `addons` directory. If you want to add your addons, You should create your addon directory. A basic file structure like this:
```
addons/
- [...other addons]/
- [your addon id]/
  - addon.json
  - userscript.ts
  - userstyles.css
  - [...asset files]
```
## `addon.json`
The addon manifest tells Charlotte how your addon works. This is a base you can use to start coding, here is a basic manifest structure:
```json
{
    "name": "🌠 Meteor shower",
    "description": "Add meteor shower in workspaces.",
    "userscripts": [
        {
            "url": "userscript",
            "matches": ["all"],
            "runAtComplete": false
        }
    ],
    "dynamicEnable": false,
    "dynamicDisable": false,
    "required": ["api"]
}
```
For more details, See [addon manifest](../doc/interfaces/src_core_loader_loader.AddonManifest).