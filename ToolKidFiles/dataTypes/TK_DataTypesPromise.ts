interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { promise: TK_DataTypesPromise_file }
interface TK_DataTypesPromise_file {
    combinePromises(
        ...promises: Promise<any>[]
    ): Promise<any[]>,
    createPromise(): CustomPromise
}

type CustomPromise = {
    promise: Promise<any>,
    resolve(data?: any): void,
    reject(reason?: any): void,
    state: "pending" | "fulfilled" | "rejected",
    data: any
}



(function TK_DataTypesPromise_init() {
    const publicExports = module.exports = <TK_DataTypesPromise_file>{};

    publicExports.combinePromises = function TK_DataTypesPromise_combinePromises(...promises) {
        if (promises.length === 0) {
            return Promise.resolve();
        }

        let missing = promises.length;
        const datas = new Array(promises.length);
        const result = publicExports.createPromise();
        const handleSucces = function TK_DataTypesPromise_combinePromisesSuccess(
            position: number, data: any
        ) {
            datas[position] = data;
            missing -= 1;
            if (missing === 0) {
                result.resolve(datas);
            }
        };
        const handleFailure = function TK_DataTypesPromise_combinePromisesFailure(data: any) {
            if (result.state === "pending") {
                result.reject(data);
            }
        };
        promises.forEach(function TK_DataTypesPromise_combinePromisesWatch(promise, position) {
            promise.then(handleSucces.bind(null, position), handleFailure);
        });
        return result.promise;
    };

    publicExports.createPromise = function TK_DataTypesPromise_createPromise() {
        const result = <CustomPromise>{
            state: "pending"
        };
        result.promise = new Promise(function TK_DataTypesPromise_createPromiseInternal(
            resolve, reject
        ) {
            result.resolve = promiseDecide.bind(null,
                result,
                resolve,
                "fulfilled"
            );
            result.reject = promiseDecide.bind(null,
                result,
                reject,
                "rejected"
            );
        });
        return result;
    };

    const promiseDecide = function TK_DataTypesPromise_promiseDecide(
        promiseData: CustomPromise,
        method: { (reason: any): void },
        state: "fulfilled" | "rejected",
        data: any
    ) {
        if (promiseData.state === "pending") {
            method(data);
            promiseData.data = data;
            promiseData.state = state;
            return;
        }

        console.error([
            "TK_DataTypesPromise_createPromiseReject - promise allready " + promiseData.state + " with:",
            promiseData.data,
            " then tried " + state + " with:",
            data
        ]);
        return;

    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunctions({ section: "dataTypes", subSection: "promise", functions: publicExports });
    }
})();