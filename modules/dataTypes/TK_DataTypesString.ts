interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { string: TK_DataTypesString_file }
interface TK_DataTypesString_file {
    decodeJSON(JSON: string): any | Error,
    encodeJSON(data: any): string | Error,
}



(function TK_DataTypesString_init() {
    const publicExports = module.exports = <TK_DataTypesString_file>{};

    publicExports.decodeJSON = function TK_DataTypesString_decodeJSON(string) {
        try {
            return JSON.parse(string);
        } catch (error) {
            return error;
        }
    };

    publicExports.encodeJSON = function TK_DataTypesString_encodeJSON(data) {
        if (data instanceof Error) {
            if ((<CustomError>data).details === undefined) {
                return `{"error": "${data.message}"}`;
            }

            try {
                const details = JSON.stringify((<CustomError>data).details);
                return `{"error": "${data.message}", "details": ${details}}`;
            } catch (error: any) {
                console.warn("JSON encoding failed for: ", data, " error: ", error);
                // TODO: return undefined instead
                return error;
            }
        }

        try {
            const result = JSON.stringify(data);
            if (result !== undefined) {
                return result;
            }

            const error = <Dictionary>new Error("JSON encoding failed - can't convert value");
            error.details = data;
            return error;
        } catch (error: any) {
            console.warn("JSON encoding failed for: ", data, " error: ", error);
            // TODO: return undefined instead
            return error;
        }
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "dataTypes", subSection: "string", entries: publicExports });
    }
})();