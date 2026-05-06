//general automated testing
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { error: TK_DataTypesError_file }
type TK_DataTypesError_file = {
    createCustomError<Details>(
        message: string, details: Details
    ): Error & { details: Details },
}
interface NodeRequire {
    (path: "TK_DataTypesError.js"): TK_DataTypesError_file
}



type CustomError = Error & {
    details: any
}



(function TK_DataTypesError_init() {
    const publicExports = module.exports = <TK_DataTypesError_file>{};

    publicExports.createCustomError = function TK_DataTypesError_createCustomError(
        message, details
    ) {
        if (typeof message !== "string") {
            throw ["TK_DataTypesError_createCustomError - message was not a string. passed inputs were: ", Array.from(arguments)];
        }

        const error = <Error & { details: any }>new Error(message);
        error.details = details;
        return error;
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "dataTypes", subSection: "error", entries: publicExports });
    }
})();