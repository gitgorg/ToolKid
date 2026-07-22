interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { string: TK_DataTypesString_file }
interface TK_DataTypesString_file {
    decodeJSON(JSON: string): any | Error,
    encodeJSON(data: any): string | CustomError,
}



(function TK_DataTypesString_init() {
    const { createCustomError } = ToolKid.getCoreModule("core");



    const publicExports = module.exports = <TK_DataTypesString_file>{};

    publicExports.decodeJSON = function TK_DataTypesString_decodeJSON(string) {
        try {
            return JSON.parse(string);
        } catch (error) {
            return error;
        }
    };

    publicExports.encodeJSON = function TK_DataTypesString_encodeJSON(value) {
        try {
            const result = JSON.stringify(value);
            return (result === undefined)
                ? createCustomError("can't entcode empty value to JSON", value)
                : result;
        } catch (error) {
            return createCustomError("JSON encoding failed", value);
        }
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "dataTypes", subSection: "string", entries: publicExports });
    }
})();