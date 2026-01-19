interface ToolKid_file { code: TK_Code_file }
interface TK_Code_file { CSV: TK_CodeCSV_file }
type TK_CodeCSV_file = {
    parse(
        code: string
    ): any[][],

    textLayerDefinition: TextLayerDefinition,
}



(function TK_CodeCSV_init() {
    // const { readLayerContent } = ToolKid.getCoreModule("parsing");



    const publicExports = module.exports = {} as TK_CodeCSV_file;

    // publicExports.textLayerDefinition = {
    //     csv_text: {
    //         patterns: [["\"", "\""], ["'", "'"]],
    //         contains: ["csv_escape"],
    //     },
    //     csv_escape: {
    //         patterns: [/\\./s],
    //         isROOTLayer: false,
    //     },
    //     csv_newLine: {
    //         patterns: [/\r\n|\r|\n/],
    //     },
    //     csv_newValue: {
    //         patterns: [","],
    //     },
    // };



    // const parser = ToolKid.getCoreModule("parsing").createTextParser({
    //     layerDefinition: publicExports.textLayerDefinition,
    //     parseOpenings: function (opening, layerData, inputs): any {

    //         if (layerData.name === "csv_newValue") {
    //             inputs.line.push(inputs.text.slice(inputs.position, opening.index).trim());
    //             inputs.position = opening.index + 1;
    //         } else if (layerData.name === "csv_newLine") {
    //             inputs.line.push(inputs.text.slice(inputs.position, opening.index).trim());
    //             inputs.result.push(inputs.line);
    //             inputs.line = [];
    //             inputs.position = opening.index;
    //         }
    //     },
    // });

    // publicExports.parse = function (text: string) {
    //     const inputs = {
    //         text,
    //         position: 0,
    //         line: [],
    //         result: [],
    //     }
    //     parser(inputs);
    //     return inputs.result;
    // };

    const RX_newLine = /\r\n|\r|\n/;
    publicExports.parse = function TK_CodeCSV_parse(text) {
        const linesText = text.trim().split(RX_newLine);
        const length = linesText.length;
        let lineArray = parseLine(linesText[0]) as any[];
        const columnCount = lineArray.length;
        const linesArray = new Array(linesText.length);
        let x = 0;
        let value;
        for (let y = 0; y < length; y += 1) {
            lineArray = parseLine(linesText[y]);
            if (lineArray.length !== columnCount) {
                console.warn("line count differs from head line " + (y + 1), ":", [linesText[y]], columnCount + " needed columns", lineArray);
                return linesArray;
            }

            for (x = 0; x < columnCount; x += 1) {
                value = lineArray[x].trim();
                if (value.length === 0) {
                    lineArray[x] = undefined;
                } else if (!isNaN(value)) {
                    lineArray[x] = parseFloat(value);
                } else {
                    if (value[0] === '"' && value[value.length - 1] === '"') {
                        lineArray[x] = value.slice(1, -1);
                    } else {
                        lineArray[x] = value;
                    }
                }
            }
            linesArray[y] = lineArray;
        }
        return linesArray;
    };

    const RX_separator = /(,)|(\\")|(")/g;
    const lineParts = new Array(100);
    const parseLine = function (text: string) {
        RX_separator.lastIndex = 0;
        let index = 0;
        let found = RX_separator.exec(text);
        let position = 0;
        let insideString = false;
        while (found !== null) {
            if (insideString === false) {
                if (found[1] !== undefined) {
                    lineParts[index] = text.slice(position, found.index).trim();
                    index += 1;
                    position = found.index + 1;
                } else {
                    insideString = true;
                }
            } else {
                if (found[3] !== undefined) {
                    insideString = false;
                }
            }
            found = RX_separator.exec(text);
        }
        const rest = text.slice(position).trim();
        if (rest.length !== 0) {
            lineParts[index] = rest;
        }
        return lineParts.slice(0, index + 1);
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "CSV", entries: publicExports });
    }
})();