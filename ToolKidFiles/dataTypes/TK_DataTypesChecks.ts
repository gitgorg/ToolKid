//secure data type checks
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { checks: TK_DataTypesChecks_file }

interface TK_DataTypesChecks_file {
    getDataType(value: any): "array" | "bigint" | "boolean" | "function" | "number" | "object" | "string" | "symbol" | "undefined",
    handleDataType(
        typeHandlers: DataTypeHandlers,
        value: any
    ): any,
    isArray: LibraryTools_file["isArray"],
    isBoolean(value: any): boolean,
    isError(value: any): boolean,
    isFunction(value: any): boolean,
    isInteger(value: any): boolean,
    isMap(value: any): boolean,
    isNumber(value: any): boolean,
    isPromise(value: any): boolean,
    isString(value: any): boolean
}

type DataTypeHandlers = {
    any?(value: any): any,

    array?(value: any[]): any,
    bigint?(value: bigint): any,
    boolean?(value: boolean): any,
    function?(value: GenericFunction): any,
    number?(value: number): any,
    object?(value: Dictionary): any,
    string?(value: string): any,
    symbol?(value: symbol): any,
    undefined?(value: undefined | null | number): any
}



(function TK_DataTypesChecks_init() {
    const publicExports = module.exports = <TK_DataTypesChecks_file>{};

    publicExports.getDataType = function TK_DataTypesChecks_getDataType(value) {
        return <any>dataTypeConverters[typeof value](value);
    };

    publicExports.handleDataType = function TK_DataTypesChecks_handleDataType(typeHandlers, value) {
        if (typeof typeHandlers !== "object") {
            throw ["TK_DataTypesChecks_handleDataType - invalid DataTypeHandlers passed:", typeHandlers];
        }

        const type = publicExports.getDataType(value);
        if (typeHandlers[type] !== undefined) {
            return (<GenericFunction>typeHandlers[type])(value);
        } else if (typeHandlers.any !== undefined) {
            return typeHandlers.any(value);
        }
    };

    const dataTypeConverters = {
        bigint: function RS_h_checks_isEmptyBigint() { return "bigint"; },
        boolean: function RS_h_checks_isEmptyBoolean() { return "boolean"; },
        function: function RS_h_checks_isEmptyFunction() { return "function"; },
        number: function RS_h_checks_isEmptyNumber(data: number) {
            return Number.isNaN(data) ? "undefined" : "number";
        },
        object: function RS_h_checks_isEmptyObject(data: any) {
            if (data === null) {
                return "undefined";
            } else if (data instanceof Array) {
                return "array";
            } else {
                return "object";
            }
        },
        string: function RS_h_checks_isEmptyString() { return "string"; },
        symbol: function RS_h_checks_isEmptySymbol() { return "symbol"; },
        undefined: function RS_h_checks_isEmptyUndefined() { return "undefined"; }
    };

    publicExports.isBoolean = function TK_DataTypesChecks_isBoolean(value) {
        return typeof value === "boolean";
    };

    publicExports.isError = function TK_DataTypesChecks_isError(value) {
        return value instanceof Error;
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