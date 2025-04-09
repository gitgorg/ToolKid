//general automated testing
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { number: TK_DataTypesNumber_file }
interface TK_DataTypesNumber_file {
    addUnderscores(value: any): string,
}



(function TK_DataTypesNumber_init() {

    const publicExports = module.exports = <TK_DataTypesNumber_file>{};

    publicExports.addUnderscores = function TK_DataTypesNuber_addUnderscores(value) {
        if (typeof value === "string") {
            if (isNaN(<any>value)) {
                return "";
            }

            value = parseFloat(value);
            if (isNaN(value)) {
                return "";
            }
        } else if (typeof value !== "number" || Number.isNaN(value)) {
            return "";
        }

        let result = "";
        if (value < 0) {
            result = "-";
            value *= -1;
        };
        const textBase = String(value);
        const scoreCount = Math.floor((textBase.length - 1) / 3);
        if (scoreCount === 0) {
            return result + textBase;
        }

        let offset = Math.round(textBase.length % 3) || 3;
        result += textBase.slice(0, offset);
        for (let i = 0; i < scoreCount; i += 1) {
            result += "_" + textBase.slice(offset, offset + 3);
            offset += 3;
        }
        return result;
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "dataTypes", subSection: "number", functions: publicExports });
    }
})();