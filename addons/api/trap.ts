interface ScratchBlocksInstance {}

interface DucktypedVM {
    _events: {
        EXTENSION_ADDED?: ((...args: any[]) => any)[] | ((...args: any[]) => any);
    };
}

export default async function ({addon, console}) {
    addon.instances = {};

    // Read global variables first
    if (
        'vm' in window &&
        Object.prototype.hasOwnProperty.call(window.vm, 'editingTarget') &&
        Object.prototype.hasOwnProperty.call(window.vm, 'runtime')
    ) {
        addon.instances.vm = window.vm;
        addon.emit('API.instance.vm.initialized');
    }

    if ('ScratchBlocks' in window) {
        addon.instances.Blockly = window.ScratchBlocks;
        addon.emit('API.instance.Blockly.initialized');
    }
    if (typeof addon.instances.vm === 'object' && typeof addon.instances.Blockly === 'object') {
        console.log('Got all instances from global variables.');
        addon.emit('API.instance.initialized');
        return;
    } else if ('Blockly' in window) {
        // Partial Blockly, just for fallback
        addon.instances.Blockly = window.Blockly;
    }

    function trapVM () {
        console.log('Trapping vm...');
        const oldBind = Function.prototype.bind;
        return new Promise<void>((resolve) => {
            const timeoutId = setTimeout(() => {
                console.log('Cannot find vm instance, stop listening.');
                Function.prototype.bind = oldBind;
                addon.emit('API.instance.vm.failed');
                addon.emit('API.instance.blockly.failed');
                addon.emit('API.instance.initialized');
                resolve();
            }, 30 * 1000);

            Function.prototype.bind = function (...args) {
                if (Function.prototype.bind === oldBind) {
                    return oldBind.apply(this, args);
                } else if (
                    args[0] &&
                Object.prototype.hasOwnProperty.call(args[0], 'editingTarget') &&
                Object.prototype.hasOwnProperty.call(args[0], 'runtime')
                ) {
                    console.log('VM detected!');
                    addon.instances.vm = args[0];
                    addon.emit('API.instance.vm.initialized');
                    Function.prototype.bind = oldBind;
                    clearTimeout(timeoutId);
                    resolve();
                    return oldBind.apply(this, args);
                }
                return oldBind.apply(this, args);
            };
        });
    }

    async function getBlocklyInstance (vm: DucktypedVM): Promise<ScratchBlocksInstance | null> {
        function getBlocklyInstanceInternal (): ScratchBlocksInstance | null {
            function hijack (fn: (...args: unknown[]) => unknown): any {
                const _orig = Function.prototype.apply;
                Function.prototype.apply = function (thisArg: any) {
                    return thisArg;
                };
                const result = fn();
                Function.prototype.apply = _orig;
                return result;
            }

            const events = vm._events?.EXTENSION_ADDED;
            if (events) {
                if (events instanceof Function) {
                    const result = hijack(events);
                    if (result && typeof result === 'object' && 'ScratchBlocks' in result) {
                        return result.ScratchBlocks as ScratchBlocksInstance;
                    }
                } else {
                    for (const value of events) {
                        const result = hijack(value);
                        if (result && typeof result === 'object' && 'ScratchBlocks' in result) {
                            return result.ScratchBlocks as ScratchBlocksInstance;
                        }
                    }
                }
            }
            return null;
        }

        let res = getBlocklyInstanceInternal();
        return (
            res ??
        new Promise<ScratchBlocksInstance | null>((resolve) => {
            let state: any = undefined;
            Reflect.defineProperty(vm._events, 'EXTENSION_ADDED', {
                get: () => state,
                set (v) {
                    state = v;
                    res = getBlocklyInstanceInternal();
                    if (res) {
                        Reflect.defineProperty(vm._events, 'EXTENSION_ADDED', {
                            value: state,
                            writable: true,
                        });
                        resolve(res);
                    }
                },
                configurable: true,
            });
        })
        );
    }

    addon.once('API.instance.vm.initialized', async () => {
        const blockly = await getBlocklyInstance(addon.instances.vm);
        if (blockly) {
            addon.instances.Blockly = blockly;
            addon.emit('API.instance.Blockly.initialized');
        } else {
            console.error('Cannot get Blockly from VM');
            addon.emit('API.instance.Blockly.failed');
        }
        addon.emit('API.instance.initialized');
    });
    trapVM();
}
