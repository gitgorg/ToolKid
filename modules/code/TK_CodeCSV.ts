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
        const columnCount = linesText[0].split(",").length;
        const length = linesText.length;
        let lineArray = [] as any[];
        const linesArray = new Array(linesText.length);
        let x = 0;
        let value;
        for (let y = 0; y < length; y += 1) {
            lineArray = linesText[y].split(",");
            if (lineArray.length !== columnCount) {
                console.warn("line count differs from head line:", linesText[y], lineArray, columnCount);
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



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "CSV", entries: publicExports });
    }
})();