//file operations for nodeJS
interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file {
    readJSImports(inputs: {
        code: string,
        parser: {
            (
                position: number,
                importContent: string,
            ): void
        }
    }): void,
}



(function TK_CodeParsing_init() {

    const publicExports = module.exports = <TK_Code_file>{};







    const importSignals = {
        requireStart: "require(\"",
        requireEnd: "\")"
    };

    publicExports.readJSImports = function TK_CodeParse_readJSImports(inputs) {
        const codeSections = inputs.code.split(importSignals.requireStart);
        if (codeSections.length === 1) {
            return;
        }

        let position = codeSections[0].length;
        let codeSection, content;
        const { length } = codeSections;
        for (let i = 1; i < length; i += 1) {
            codeSection = codeSections[i];
            content = codeSection.slice(0, codeSection.indexOf(importSignals.requireEnd));
            if (content !== "fs" && content !== "path") {
                inputs.parser(position, content);
            }
            position += codeSection.length + importSignals.requireStart.length;
        }
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunctions({ section: "code", functions: publicExports });
    }
})();