/* eslint-disable no-var, eqeqeq */
/*
 * https://github.com/scratchfoundation/scratch-blocks/blob/f210e042988b91bcdc2abeca7a2d85e178edadb2/blocks_vertical/procedures.js#L205
 * Ignore some eslint rules since the logic should be strictly consistent with the definition in Blockly
 */
export function modifiedCreateAllInputs (connectionMap) {
    // Split the proc into components, by %n, %b, %s and %l (ignoring escaped).
    let procComponents = this.procCode_.split(/(?=[^\\]%[nbsl])/);
    procComponents = procComponents.map(function (c) {
        return c.trim(); // Strip whitespace.
    });

    // Create arguments and labels as appropriate.
    let argumentCount = 0;
    for (var i = 0, component; (component = procComponents[i]); i++) {
        var labelText;
        // Don't treat %l as an argument
        if (component.substring(0, 1) == '%' && component.substring(1, 2) !== 'l') {
            const argumentType = component.substring(1, 2);
            if (!(argumentType == 'n' || argumentType == 'b' || argumentType == 's')) {
                throw new Error('Found an custom procedure with an invalid type: ' + argumentType);
            }
            labelText = component.substring(2).trim();

            const id = this.argumentIds_[argumentCount];

            const input = this.appendValueInput(id);
            if (argumentType == 'b') {
                input.setCheck('Boolean');
            }
            this.populateArgument_(argumentType, argumentCount, connectionMap, id, input);
            argumentCount++;
        } else {
            labelText = component.trim().replace('%l ', '');
        }
        this.addProcedureLabel_(labelText.replace(/\\%/, '%'));
    }

    // Remove all traces of %l at the earliest possible time
    this.procCode_ = this.procCode_.replaceAll('%l ', '');
}

//https://github.com/scratchfoundation/scratch-blocks/blob/f210e042988b91bcdc2abeca7a2d85e178edadb2/blocks_vertical/procedures.js#L565
export function modifiedUpdateDeclarationProcCode (prefixLabels = false) {
    this.procCode_ = '';
    this.displayNames_ = [];
    this.argumentIds_ = [];
    for (let i = 0; i < this.inputList.length; i++) {
        if (i != 0) {
            this.procCode_ += ' ';
        }
        const input = this.inputList[i];
        if (input.type == 5) {
            // Replaced Blocky.DUMMY_VALUE with 5
            this.procCode_ += (prefixLabels ? '%l ' : '') + input.fieldRow[0].getValue(); // Modified to prepend %l delimiter, which prevents label merging
        } else if (input.type == 1) {
            /*
             * Replaced Blocky.INPUT_VALUE with 1
             * Inspect the argument editor.
             */
            const target = input.connection.targetBlock();
            this.displayNames_.push(target.getFieldValue('TEXT'));
            this.argumentIds_.push(input.name);
            if (target.type == 'argument_editor_boolean') {
                this.procCode_ += '%b';
            } else {
                this.procCode_ += '%s';
            }
        } else {
            throw new Error('Unexpected input type on a procedure mutator root: ' + input.type);
        }
    }
}
