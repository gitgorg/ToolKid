//general automated testing
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file {
    object: {
        filter<Data extends Dictionary, Key extends string>(
            inputs: {
                data: Data;
                byKeys: Key[];
            }
        ): Pick<Data, Key>,
        merge<
            First extends Dictionary,
            Change extends Dictionary
        >(
            base: First,
            ...changes: Change[]
        ): First & Change,
    }
}



(function TK_DataTypesObject_init() {
    const publicExports = module.exports = <TK_DataTypes_file["object"]>{};

    publicExports.filter = function TK_DataTypesObject_filter(inputs) {
        const result = {} as any;
        const { data, byKeys } = inputs;
        let value: any;
        for (let i = 0; i < byKeys.length; i += 1) {
            value = data[byKeys[i]];
            if (value !== undefined) {
                result[byKeys[i]] = value
            }
        }
        return result;
    };

    publicExports.merge = function TK_DataTypesObject_merge(
        base: any, ...changes
    ) {
        if (changes.length === 0) {
            return Object.assign({}, base);
        }

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
        ToolKid.register({ section: "dataTypes", subSection: "object", entries: publicExports });
    }
})();