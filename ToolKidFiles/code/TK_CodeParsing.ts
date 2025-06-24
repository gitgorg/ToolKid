//file operations for nodeJS
interface ToolKid_file { code: TK_CodeParsing_file }
interface TK_CodeParsing_file {
    readJSImports(inputs: {
        code: string,
        parser: {
            (
                position: number,
                importContent: string,
            ): void
        }
    }): void,
    removeQuotes(
        input:string
    ):string,
}



(function TK_CodeParsing_init() {

    const publicExports = module.exports = <TK_CodeParsing_file>{};







    const importSignals = {
        requireStart: "require(\"",
        requireEnd: "\")"
    };

    publicExports.readJSImports = function TK_CodeParsing_readJSImports(inputs) {
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

    publicExports.removeQuotes = function TK_CodeParsing__removeQuotes(text: string) {
        if (typeof text !== "string") {
            return "";
        }

        text = text.trim();
        if (text.length === 0) {
            return "";
        }

        if (text[0] === "'") {
            if (text[text.length - 1] === "'") {
                return text.slice(1, -1);
            }
        } else if (text[0] === "\"") {
            if (text[text.length - 1] === "\"") {
                return text.slice(1, -1);
            }
        }

        return text;
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunctions({ section: "code", functions: publicExports });
    }
})();