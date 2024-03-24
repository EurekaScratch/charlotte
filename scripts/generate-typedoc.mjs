import TypeDoc from 'typedoc';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function rootPath (...args) {
    return path.join(__dirname, '..', ...args);
}

async function main () {
    // Specify code entry points
    const entries = [
        rootPath('addons/api/api.ts'),
        rootPath('src/core/loader/loader.ts')
    ];
    const app = await TypeDoc.Application.bootstrapWithPlugins({
        name: 'Charlotte Documentation',
        entryPoints: entries,
        tsconfig: rootPath('tsconfig.json'),
        plugin: ['typedoc-plugin-markdown'],
        readme: 'none',
        theme: 'markdown',
        githubPages: false,
        disableSources: true,
        allReflectionsHaveOwnDocument: true,
        hideBreadcrumbs: true, // Hide breadcrumbs
        hideMembersSymbol: true, // Do not add special symbols
    }, [
        new TypeDoc.TSConfigReader() // Enable TypeDoc to read tsconfig.json
    ]);

    const project = await app.convert();

    if (project) {
    // Output directory
        const outputDir = rootPath('docs/doc');

        // Generate documentation content
        await app.generateDocs(project, outputDir);

        // Generate documentation data structure
        const jsonDir = path.join(outputDir, 'documentation.json');
        await app.generateJson(project, jsonDir);

        // Parse data structure to generate Sidebar configuration required by VitePress Config
        await resolveConfig(jsonDir);
    }
}

/** Generate sidebar directory configuration */
async function resolveConfig (jsonDir) {
    const result = [];
  
    // Read the json file of documentation data structure
    const buffer = await fs.readFile(jsonDir, 'utf8');
    const data = JSON.parse(buffer.toString());
    if (!data.children || data.children.length <= 0) {
        return;
    }

    data.children.forEach((module) => {
        if (TypeDoc.ReflectionKind.singularString(module.kind) !== 'Module') {
            return;
        }
        let moduleNames = module.name.split('/');
        let name = moduleNames[moduleNames.length - 1];
        const sidebarItem = {
            text: name,
            items: [
                { text: name, link: getModulePath(module.name) },
            ],
        };
        module.children.forEach((sub) => {
            switch (TypeDoc.ReflectionKind.singularString(sub.kind)) {
                case 'Class':
                    sidebarItem.items.push({
                        text: `Class: ${sub.name}`,
                        link: getClassPath(module.name, sub.name)
                    });
                    break;
                case 'Interface':
                    sidebarItem.items.push({
                        text: `Interface: ${sub.name}`,
                        link: getInterfacePath(module.name, sub.name)
                    });
                    break;
                case 'Type alias':
                    sidebarItem.items.push({
                        text: `Type: ${sub.name}`,
                        link: getTypePath(module.name, sub.name)
                    });
                    break;
                case 'Function':
                    sidebarItem.items.push({
                        text: `Function: ${sub.name}`,
                        link: getFunctionPath(module.name, sub.name)
                    });
                    break;
            }
        });
        result.push(sidebarItem);
    });

    await fs.writeFile(rootPath('docs/doc/sidebar.json'), JSON.stringify(result), 'utf8');
}
  
function transformModuleName (name) {
    return name.replace(/\//g, '_').replace(/\-/g, '_');
}
  
function getModulePath (name) {
    return path.join('/doc/modules', `${transformModuleName(name)}`).replace(/\\/g, '/');
}
  
function getClassPath (moduleName, className) {
    return path.join('/doc/classes', `${transformModuleName(moduleName)}.${className}`).replace(/\\/g, '/');
}
  
function getInterfacePath (moduleName, interfaceName) {
    return path.join('/doc/interfaces', `${transformModuleName(moduleName)}.${interfaceName}`).replace(/\\/g, '/');
}
  
function getTypePath (moduleName, typeName) {
    return path.join('/doc/types', `${transformModuleName(moduleName)}.${typeName}`).replace(/\\/g, '/');
}
  
function getFunctionPath (moduleName, functionName) {
    return path.join('/doc/functions', `${transformModuleName(moduleName)}.${functionName}`).replace(/\\/g, '/');
}

main().catch(console.error);
