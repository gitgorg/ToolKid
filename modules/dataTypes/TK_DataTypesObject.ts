//general automated testing
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file {
    object: {
        clone<Type>(
            origin: Type[],
            depth: number,
        ): Type[],
        clone<Type>(
            origin: Type,
            depth: number,
        ): Type,

        filter<Data extends Dictionary, Key extends string>(
            inputs: {
                data: Data;
                byKeys: Key[];
            }
        ): Pick<Data, Key>,
        merge<
            Base extends Dictionary,
            Extension extends Dictionary
        >(
            base: Base,
            ...changes: Extension[]
        ): Base & Extension,
    }
}



(function TK_DataTypesObject_init() {
    const publicExports = module.exports = <TK_DataTypes_file["object"]>{};

    const clone = publicExports.clone =
        <TK_DataTypes_file["object"]["clone"]>function TK_DataTypesObject_cloneDeep(
            origin, depth
        ) {
            if (typeof origin !== "object" || origin === null) {
                return origin; //origin is not clonable
            };

            if (origin instanceof Array) {
                if (depth < 2) {
                    return origin.slice(0);
                }

                depth -= 1;
                const result = origin.slice(0);
                const { length } = origin;
                for (let i = 0; i < length; i += 1) {
                    result[i] = clone(origin[i], depth);
                }
                return result;
            }

            if (origin instanceof Map) {
                if (depth < 2) {
                    return new Map(origin);
                }

                depth -= 1;
                const result = new Map(origin);
                result.forEach(function TK_DataTypesObject_cloneDeepMap(value, key) {
                    result.set(key, clone(value, depth));
                });
                return result;
            }

            if (origin instanceof Set) {
                if (depth < 2) {
                    return new Set(origin);
                }

                depth -= 1;
                const result = new Set();
                result.forEach(function TK_DataTypesObject_cloneDeepMap(value) {
                    result.add(clone(value, depth));
                });
                return result;
            }

            if (depth < 2) {
                return Object.assign({}, origin);
            }

            depth -= 1;
            const result = <Dictionary>Object.assign({}, origin);
            const entries = Object.entries(origin);
            const { length } = entries;
            let keyValue: [string, any];
            for (let i = 0; i < length; i += 1) {
                keyValue = entries[i];
                result[keyValue[0]] = keyValue[1];
            }
            return result;
        };

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