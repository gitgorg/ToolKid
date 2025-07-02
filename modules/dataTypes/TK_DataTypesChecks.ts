//secure data type checks
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { checks: TK_DataTypesChecks_file }

interface TK_DataTypesChecks_file {
    getDataType(value: any): DataType,
    // TODO: rename to parseByDataType or somethin alike
    handleDataType(inputs: {
        value: any,
        typeHandlers: DataTypeParsers,

        withInputs?: any[]
    }): any,

    isArray(value: any): boolean,
    isBoolean(value: any): boolean,
    isError(value: any): boolean,
    isFunction(value: any): boolean,
    isInteger(value: any): boolean,
    isMap(value: any): boolean,
    isNumber(value: any): boolean,
    isObject(value: any): boolean,
    isPromise(value: any): boolean,
    isString(value: any): boolean
}

type DataType = "array" | "bigint" | "boolean" | "function" | "number" | "object" | "string" | "symbol" | "undefined" | "HTML" | "HTMLClassList";

type DataTypeParsers = {
    any?(...inputs: any[]): any,
    array?: { (...inputs: any[]): any } | false,
    bigint?: { (...inputs: any[]): any } | false,
    boolean?: { (...inputs: any[]): any } | false,
    function?: { (...inputs: any[]): any } | false,
    number?: { (...inputs: any[]): any } | false,
    object?: { (...inputs: any[]): any } | false,
    string?: { (...inputs: any[]): any } | false,
    symbol?: { (...inputs: any[]): any } | false,
    undefined?: { (...inputs: any[]): any } | false,

    HTML?: { (...inputs: any[]): any } | false,
    HTMLClassList?: { (...inputs: any[]): any } | false,
}



(function TK_DataTypesChecks_init() {
    const publicExports = module.exports = <TK_DataTypesChecks_file>{};

    const getDataType = publicExports.getDataType = function TK_DataTypesChecks_getDataType(value) {
        return <DataType>dataTypeConverters[typeof value](value);
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

    publicExports.isArray = (typeof Array.isArray === "function")
        ? function TK_DataTypesChecks_isArray(value) {
            return Array.isArray(value) && value.length !== 0;
        }
        : function TK_DataTypesChecks_isArrayLegacy(value) {
            return value instanceof Array && value.length !== 0;
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

    publicExports.isObject = function TK_DataTypesChecks_isObject(value) {
        return typeof value === "object"
            && value !== null
            && !(value instanceof Array)
            && !(value instanceof Map);
    };

    publicExports.isPromise = function TK_DataTypesChecks_isPromise(value) {
        return value instanceof Promise;
    };

    publicExports.isString = function TK_DataTypesChecks_isString(value) {
        return typeof value === "string" && value !== "";
    };

    publicExports.handleDataType = function TK_DataTypesChecks_handleDataType(inputs) {
        const { typeHandlers } = inputs;
        if (typeof typeHandlers !== "object") {
            throw ["TK_DataTypesChecks_handleDataType - invalid DataTypeParsers passed:", typeHandlers];
        }

        const { value } = inputs;
        const handler = typeHandlers[getDataType(value)];
        if (handler === false) {
            return;
        }

        if (typeof handler === "function") {
            return handler(...(inputs.withInputs || [value]));
        } else if (typeof typeHandlers.any === "function") {
            return typeHandlers.any(...(inputs.withInputs || [value]));
        }
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "dataTypes", subSection: "checks", entries: publicExports });
    }
})();