//general automated testing
interface ToolKid_file { dataTypes: TK_DataTypes_file }
interface TK_DataTypes_file { promise: TK_DataTypesPromise_file }
interface TK_DataTypesPromise_file {
    combine(
        ...promises: Promise<any>[]
    ): Promise<any[]>,
    createPromise(): {
        promise: Promise<any>,
        resolve(data?:any):void,
        reject(reason?:any):void,
        state: "pending" | "resolved" | "rejected"
    }
}




(function TK_DataTypesPromise_init() {



    const publicExports = module.exports = <TK_DataTypesPromise_file>{};

    publicExports.combine = function TK_DataTypesPromise_combine (...promises) {
        if (promises.length === 0) {
            return Promise.resolve();
        }

        let missing = promises.length;
        const datas = new Array(promises.length);
        const result = publicExports.createPromise();
        const handleSucces = function (position:number, data:any) {
            datas[position] = data;
            missing -= 1;
            if (missing === 0) {
                result.resolve(datas);
            }
        };
        const handleFailure = function (data:any) {
            result.reject(data);
        };
        promises.forEach(function(promise, position){
            promise.then(handleSucces.bind(null,position), handleFailure);
        });
        return result.promise;
    };

    publicExports.createPromise = function TK_DataTypesPromise_createPromise() {
        const result = <{
            promise: Promise<any>,
            resolve(data?:any):void,
            reject(reason?:any):void,
            state: "pending" | "resolved" | "rejected"
        }>{};
        result.promise = new Promise(function TK_DataTypesPromise_createPromiseInternal(
            resolve, reject
        ) {
            result.resolve = function TK_DataTypesPromise_createPromiseResolve(data:any){
                if (result.state !== "pending") {
                    throw ["TK_DataTypesPromise_createPromiseResolve - promise allready resolved"];
                }

                resolve(data);
                result.state = "resolved";
            };
            result.reject = function TK_DataTypesPromise_createPromiseReject(reason:any) {
                if (result.state !== "pending") {
                    throw ["TK_DataTypesPromise_createPromiseReject - promise allready resolved"];
                }

                reject(reason);
                result.state = "rejected";
            };
        });
        return result;
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "dataTypes", subSection: "promise", functions: publicExports });
    }
})();