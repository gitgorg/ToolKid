//general automated testing
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { error: TK_DataTypesError_file }
type TK_DataTypesError_file = {
    createCustomError<Details>(
        message: string,
        details: Details,
        originOffset?: number | string,
    ): CustomError,
}
interface NodeRequire {
    (path: "TK_DataTypesError.js"): TK_DataTypesError_file
}



type CustomError = Error & {
    ERROR: string,
    details: any,
    origin: string,
    stack: string,
}



(function TK_DataTypesError_init() {
    const publicExports = module.exports = <TK_DataTypesError_file>{};

    publicExports.createCustomError = function TK_DataTypesError_createCustomError(
        message, details, originOffset = 0
    ) {
        if (typeof message !== "string") {
            throw ["TK_DataTypesError_createCustomError - message was not a string. passed inputs were: ", Array.from(arguments)];
        }

        const error = <CustomError>new Error(message);
        error.ERROR = message;
        if (typeof originOffset === "string") {
            error.origin = originOffset;
        } else {
            const line = error.stack.split("\n")[2 + originOffset];
            error.origin = line.slice(line.indexOf("at ")+3,line.indexOf(" ("));
        }
        error.details = details;
        return error;
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "dataTypes", subSection: "error", entries: publicExports });
    }
})();