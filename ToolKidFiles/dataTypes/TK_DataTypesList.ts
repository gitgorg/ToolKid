interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { list: TK_DataTypesList_file }
interface TK_DataTypesList_file {
    shortenList(inputs: {
        list: string,
        maxLength: number,
        omissionSignal: string | {
            (
                omittedText: string
            ): string
        }
    }): string,
    shortenList<entryType, singalType>(inputs: {
        list: entryType[],
        maxLength: number,
        omissionSignal: singalType | {
            (
                omittedText: entryType[]
            ): singalType
        }
    }): (entryType | singalType)[],
}



(function TK_DataTypesList_init() {
    const publicExports = module.exports = <TK_DataTypesList_file>{};

    publicExports.shortenList = function TK_DataTypesList_shortenList(
        inputs: any
    ) {
        const { list } = inputs;
        if (
            (typeof list !== "string" && !(list instanceof Array))
            || list.length <= inputs.maxLength
        ) {
            return list;
        }

        let { omissionSignal } = inputs;
        const limit = Math.floor(inputs.maxLength / 2);
        if (typeof omissionSignal === "function") {
            omissionSignal = omissionSignal(list.slice(limit, -limit));
        }
        return typeof list === "string"
            ? list.slice(0, limit) + omissionSignal + list.slice(-limit)
            : [...list.slice(0, limit), omissionSignal, ...list.slice(-limit)];
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "dataTypes", subSection: "list", functions: publicExports });
    }
})();