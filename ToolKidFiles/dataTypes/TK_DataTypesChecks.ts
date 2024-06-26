//secure data type checks
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { checks: TK_DataTypesChecks_file }
interface TK_DataTypesChecks_file {
    isArray(value: any): boolean,
    isBoolean(value: any): boolean,
    isFunction(value: any): boolean,
    isInteger(value: any): boolean,
    isMap(value: any): boolean,
    isNumber(value: any): boolean,
    isPromise(value: any): boolean,
    isString(value: any): boolean
}

(function TK_DataTypesChecks_init() {
    const publicExports = module.exports = <TK_DataTypesChecks_file>{};

    publicExports.isArray = function TK_DataTypesChecks_isArray(value) {
        return value instanceof Array && value.length !== 0;
    };

    publicExports.isBoolean = function TK_DataTypesChecks_isBoolean(value) {
        return typeof value === "boolean";
    };

    publicExports.isFunction = function TK_DataTypesChecks_isFunction(value) {
        return typeof value === "function";
    };

    publicExports.isInteger = function TK_DataTypesChecks_isInteger(value) {
        return Number.isInteger(value);
    };

    publicExports.isMap = function TK_DataTypesChecks_isMap(value) {
        return value instanceof Map && value.size !== 0;
    };

    publicExports.isNumber = function TK_DataTypesChecks_isNumber(value) {
        return typeof value === "number" && !Number.isNaN(value);
    };

    publicExports.isPromise = function TK_DataTypesChecks_isPromise(value) {
        return value instanceof Promise;
    };

    publicExports.isString = function TK_DataTypesChecks_isString(value) {
        return typeof value === "string" && value !== "";
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "dataTypes", subSection: "checks", functions: publicExports });
    }
})();