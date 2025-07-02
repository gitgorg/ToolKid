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
        const handleSucces = function TK_DataTypesPromise_combinePromisesSuccess(position: number, data: any) {
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
            result.resolve = promiseDecide.bind(null, {
                promiseData: result,
                method: resolve,
                state: "fulfilled"
            });
            result.reject = promiseDecide.bind(null, {
                promiseData: result,
                method: reject,
                state: "rejected"
            });
        });
        return result;
    };

    const promiseDecide = function TK_DataTypesPromise_promiseDecide(bound: {
        promiseData: CustomPromise,
        method(reason: any): void,
        state: "fulfilled" | "rejected"
    }, data: any) {
        const { promiseData } = bound;
        if (promiseData.state !== "pending") {
            console.error([
                "TK_DataTypesPromise_createPromiseReject - promise allready " + promiseData.state + " with:",
                promiseData.data,
                " then tried " + bound.state + " with:",
                data
            ]);
            return;
        }

        bound.method(data);
        promiseData.data = data;
        promiseData.state = bound.state;
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "dataTypes", subSection: "promise", entries: publicExports });
    }
})();