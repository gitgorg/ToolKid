//file operations for nodeJS
interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file {
    addIndentation(
        text: string,
        indentation: string | number,
    ): string[],
    readIndentation(
        text: string,
        position: number,
    ): string,
    removeQuotes(
        text: string
    ): string,
}



(function TK_CodeParsing_init() {

    const publicExports = module.exports = <TK_Code_file>{};
    const RXAnyChararcter = /\S/g;



    publicExports.addIndentation = function TK_CodeParsing_addIndentation(text, indentation) {
        if (
            indentation === 0
            || (typeof indentation === "string" && indentation.length === 0)
        ) {
            return [text];
        }

        const parts = <string[]>new Array(100);
        const addition = (typeof indentation === "string")
            ? indentation
            : new Array(indentation).join(" ");
        const { length } = text;
        let position = 0;
        let nextPosition = 0;
        let i = 0;
        while (position < length) {
            nextPosition = text.indexOf("\n", position);
            if (nextPosition === -1) {
                break;
            }

            if (nextPosition === position) {
                parts[i] = "\n";
                i += 1;
                position += 1;
                continue;
            }

            nextPosition += 1;
            parts[i] = text.slice(position, nextPosition);
            parts[i + 1] = addition;
            i += 2;
            position = nextPosition;
        }
        if (position !== length) {
            parts[i] = text.slice(position);
            i += 1;
        }
        parts.length = i;
        return parts;
    };

    publicExports.readIndentation = function TK_CodeParsing_readIndentation(
        text, position
    ) {
        const linestart = text.lastIndexOf("\n", position) + 1;
        RXAnyChararcter.lastIndex = position;
        const found = RXAnyChararcter.exec(text);
        return (found === null)
            ? text.slice(linestart)
            : text.slice(linestart, found.index);
    };

    publicExports.removeQuotes = function TK_CodeParsing_removeQuotes(text) {
        if (typeof text !== "string") {
            return "";
        }

        text = text.trim();
        if (text.length === 0) {
            return "";
        }

        if (text[0] === "'") {
            return (text[text.length - 1] === "'")
                ? text.slice(1, -1) : text;
        } else if (text[0] === "\"") {
            return (text[text.length - 1] === "\"")
                ? text.slice(1, -1) : text;
        } else {
            return text;
        }
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", entries: publicExports });
    }
})();