//secure data type checks
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { checks: TK_DataTypesChecks_file }

interface TK_DataTypesChecks_file {
    getDataType(value: any): DataType,
    handleDataType(inputs:{
        typeHandlers: DataTypeHandlers,
        value: any,
        withInputs?: any[]
    }): any,
    
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

type DataType = "array" | "bigint" | "boolean" | "function" | "number" | "object" | "string" | "symbol" | "undefined" | "HTML" | "HTMLClassList";

type DataTypeHandlers = {
    any?(...inputs:any[]): any,

    array?: {(...inputs:any[]): any} | false,
    bigint?: {(...inputs:any[]): any} | false,
    boolean?: {(...inputs:any[]): any} | false,
    function?: {(...inputs:any[]): any} | false,
    number?: {(...inputs:any[]): any} | false,
    object?: {(...inputs:any[]): any} | false,
    string?: {(...inputs:any[]): any} | false,
    symbol?: {(...inputs:any[]): any} | false,
    undefined?: {(...inputs:any[]): any} | false,

    HTML?: {(...inputs:any[]): any} | false,
    HTMLClassList?: {(...inputs:any[]): any} | false,
}



(function TK_DataTypesChecks_init() {
    const publicExports = module.exports = <TK_DataTypesChecks_file>{};

    publicExports.getDataType = function TK_DataTypesChecks_getDataType(value) {
        return <any>dataTypeConverters[typeof value](value);
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

    if (typeof Element === "function") {
        const standard = dataTypeConverters.object;
        dataTypeConverters.object = <any>function RS_h_checks_isEmptyObjectDOM(data: any) {
            if (data instanceof Element) {
                return "HTML";
            } else if (data instanceof DOMTokenList) {
                return "HTMLClassList";
            } else {
                return standard(data);
            }
        }
    }

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

    publicExports.handleDataType = function TK_DataTypesChecks_handleDataType(inputs) {
        const {typeHandlers} = inputs;
        if (typeof typeHandlers !== "object") {
            throw ["TK_DataTypesChecks_handleDataType - invalid DataTypeHandlers passed:", typeHandlers];
        }

        const {value} = inputs;
        const type = publicExports.getDataType(value);
        const handler = typeHandlers[type];
        if (handler === false) {
            return;
        }

        const withInputs = inputs.withInputs || [value];
        if (typeof handler === "function") {
            return handler(...withInputs);
        } else if (typeof typeHandlers.any === "function") {
            return typeHandlers.any(...withInputs);
        }
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "dataTypes", subSection: "checks", functions: publicExports });
    }
})();