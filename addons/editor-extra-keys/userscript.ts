export default async function ({ addon, intl, settings }) {
    const ScratchBlocks = await addon.api.getBlockly();

    let defaultKeys = null;
    let disabled = false;
    function appendKeys (keys, enableShiftKeys) {
        if (!defaultKeys) {
            defaultKeys = [...keys];
        }
        if (!disabled) {
            keys.push(
                ...[
                    ['-', '-'],
                    [',', ','],
                    ['.', '.'],
                ]
            );
            keys.splice(5, 0, [intl.formatMessage({id: '@editor-extra-keys/enter-key', defaultMessage: 'enter'}), 'enter']);
            if (settings.get('experimentalKeys')) {
                keys.push(
                    ...[
                        ['`', '`'],
                        ['=', '='],
                        ['[', '['],
                        [']', ']'],
                        ['\\', '\\'],
                        [';', ';'],
                        ["'", "'"],
                        ['/', '/'],
                    ]
                );
            }
            if (enableShiftKeys && settings.get('shiftKeys')) {
                keys.push(
                    ...[
                        ['!', '!'],
                        ['@', '@'],
                        ['#', '#'],
                        ['$', '$'],
                        ['%', '%'],
                        ['^', '^'],
                        ['&', '&'],
                        ['*', '*'],
                        ['(', '('],
                        [')', ')'],
                        ['_', '_'],
                        ['+', '+'],
                        ['{', '{'],
                        ['}', '}'],
                        ['|', '|'],
                        [':', ':'],
                        ['"', '"'],
                        ['?', '?'],
                        ['<', '<'],
                        ['>', '>'],
                        ['~', '~'],
                    ]
                );
            }
        }
        return keys;
    }

    for (const opcode of ['sensing_keyoptions', 'event_whenkeypressed']) {
        const block = ScratchBlocks.Blocks[opcode];
        const originalInit = block.init;
        block.init = function (...args) {
            const originalJsonInit = this.jsonInit;
            this.jsonInit = function (obj) {
                appendKeys(obj.args0[0].options, opcode === 'event_whenkeypressed');
                return originalJsonInit.call(this, obj);
            };
            return originalInit.call(this, ...args);
        };
    }

    const updateExistingBlocks = () => {
        const workspace = ScratchBlocks.getMainWorkspace();
        const flyout = workspace && workspace.getFlyout();
        if (workspace && flyout) {
            const allBlocks = [...workspace.getAllBlocks(), ...flyout.getWorkspace().getAllBlocks()];
            for (const block of allBlocks) {
                if (block.type !== 'event_whenkeypressed' && block.type !== 'sensing_keyoptions') {
                    continue;
                }
                const input = block.inputList[0];
                if (!input) {
                    continue;
                }
                const field = input.fieldRow.find((i) => i && Array.isArray(i.menuGenerator_));
                if (!field) {
                    continue;
                }
                field.menuGenerator_ = appendKeys(
                    defaultKeys ? [...defaultKeys] : field.menuGenerator_,
                    block.type === 'event_whenkeypressed'
                );
            }
        }
    };

    updateExistingBlocks();
    settings.on('change', updateExistingBlocks);
    return () => {
        disabled = true;
        updateExistingBlocks();
    };
}
