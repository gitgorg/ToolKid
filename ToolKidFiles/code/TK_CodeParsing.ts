//file operations for nodeJS
interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file {
    removeQuotes(
        input: string
    ): string,
}



(function TK_CodeParsing_init() {

    const publicExports = module.exports = <TK_Code_file>{};



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
        ToolKid.register({ section: "code", entries: publicExports });
    }
})();