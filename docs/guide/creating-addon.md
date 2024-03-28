# Creating your first addon
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
Here are some basic descriptions of these files.
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
### `name` & `description`
The addon's default name and description, Which means they can be changed by i18n file.
### `userscripts`
For all userscripts included in Addon, Charlotte will execute each userscript match based on the `match` field. The execution order of userscript will be strictly executed in array order (the next script needs to wait for the current script to complete before it is executed, unless the script specified `runAtComplete`). Here are some explanation of some of these fields:
- `url`: Userscript's file name, Should NOT contain non-ASCII characters and file extensions.
- `matches`: On which websites this userscript should run, Can be string or a platform object. You can see [what our matcher accepted](/doc/types/src_core_loader_match.Match) and [all accepted platform alias](/doc/variables/src_core_loader_match.platformInfo).
- `runAtComplete`: Whether this userscript should be run after page loaded. Please noted that an addon's activated event will be sent after all scripts are executed, So use this field at your own risk.
### `dynamicEnable` & `dynamicDisable`
Whether if your addon can be enabled for disabled dynamically. If you are not sure whether your script can enable/disable dynamically, set them to ``false``.
### `required`
Which other addons does your Addon depend on for execution. In general, your userscript requires the ``api`` to work.   
::: tip
Generally speaking, the activating or deactivating of each addon will not block other addons's loading process, but not for required addons. Charlotte will block the activating of all other addons before the required addon is completed.
:::

For more details, See [addon manifest](../doc/interfaces/src_core_loader_loader.AddonManifest).   

We'll cover the basic structure of addon's userscripts in the next page.