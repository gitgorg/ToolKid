//general automated testing
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { array: TK_DataTypesArray_file }
interface TK_DataTypesArray_file {
    iterateBatch<DataType, StopSignal>(inputs: {
        data: DataType[],
        parser: {
            (
                entry: DataType, index: number
            ): StopSignal | void
        },
        batchSize: number,

        callback?: { (lastIndex: number): void },
        startIndex?: number,
        stopSignal?: StopSignal
    }): void,
}



(function TK_DataTypesArray_init() {
    type DataIterateBatch = {
        batchSize: number,
        boundIterator: { (): void },
        callback: { (lastIndex: number): void },
        data: DataType[],
        parser: { (entry: DataType, index: number): "stop" | void },
        startIndex: number,
        stopSignal: any,
    }



    const publicExports = module.exports = <TK_DataTypesArray_file>{};

    publicExports.iterateBatch = function TK_DataTypesArray_iterateBatch(inputs) {
        const privateData = <DataIterateBatch><any>Object.assign({
            batchSize: 10,
            callback: function () { },
            maxBlockDuration: 100,
            stopSignal: {},
            startIndex: 0,
        }, inputs, {
            dataPosition: 0,
        });
        if (typeof privateData.startIndex !== "number" || Number.isNaN(privateData.startIndex)) {
            throw ["TK_DataTypesArray_iterateBatch - .startIndex should be a number:", inputs];
        }

        privateData.boundIterator = iterateBatchLoop.bind(null, privateData);
        iterateBatchLoop(privateData);
    };

    const iterateBatchLoop = function db_TLSTools_iterateBatchLoop(inputs: DataIterateBatch) {
        const { data, parser, stopSignal } = inputs;
        const indexEnd = Math.min(inputs.startIndex + inputs.batchSize, data.length);
        for (let i = inputs.startIndex; i < indexEnd; i += 1) {
            if (parser(data[i], i) === stopSignal) {
                inputs.callback(i);
                return;
            }
        }

        if (indexEnd === data.length) {
            inputs.callback(indexEnd - 1);
            return;
        }

        inputs.startIndex = indexEnd;
        setTimeout(inputs.boundIterator, 0);
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunctions({ section: "dataTypes", subSection: "array", functions: publicExports });
    }
})();