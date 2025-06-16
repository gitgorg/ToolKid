//general automated testing
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { object: TK_DataTypesObject_file }
interface TK_DataTypesObject_file {
    merge<
        Base extends Dictionary,
        Change extends Dictionary,
        FurtherChange extends Dictionary
    >(
        base:Base,
        change:Change,
        ...changes: FurtherChange[]
    ): Base & Change & FurtherChange,
}



(function TK_DataTypesObject_init() {
    const publicExports = module.exports = <TK_DataTypesObject_file>{};

    publicExports.merge = function TK_DataTypesObject_merge(
        base:any, ...changes
    ) {
        const result = Object.assign({}, base);
        const addToResult = mergeLayer.bind(null, result);
        for (let i = 0; i < changes.length; i += 1) {
            Object.entries(changes[i]).forEach(addToResult);
        }
        return result;
    };

    const mergeLayer = function TK_DataTypesObject_mergeLayer(
        result: Dictionary, [key, newValue]: [string, any]
    ) {
        if (newValue === undefined) {
            delete result[key];
            return;
        }

        const oldValue = result[key];
        if (newValue !== oldValue && isObject(oldValue) && isObject(newValue)) {
            const replacement = Object.assign({}, oldValue);
            Object.entries(newValue).forEach(mergeLayer.bind(null, replacement));
            newValue = replacement;
        }
        result[key] = newValue;
    };

    const isObject = function TK_DataTypesObject_isObject(value: any) {
        return typeof value === "object" && !(value instanceof Array);
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunctions({ section: "dataTypes", subSection: "object", functions: publicExports });
    }
})();