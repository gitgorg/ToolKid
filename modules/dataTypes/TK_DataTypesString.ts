interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { string: TK_DataTypesString_file }
interface TK_DataTypesString_file {
    decodeJSON(JSON: string): any | Error,
    /**
     * same interface as JSON.stringify
     * @param value to be converted
     * @param replacer ? function that transforms the results
     * @param space ? adds indentation, white space, and line break characters
     */
    encodeJSON(
        value: any,
        replacer?: { (this: any, key: string, value: any): any },
        space?: string,
    ): string | CustomError,
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

    publicExports.encodeJSON = function TK_DataTypesString_encodeJSON(
        value, replacer, space
    ) {
        try {
            const result = JSON.stringify(value, replacer, space);
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