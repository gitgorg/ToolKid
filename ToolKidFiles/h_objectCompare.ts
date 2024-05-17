//comparing objects with each other
interface ToolKid_file {
    object: h_object_file
}

interface h_object_file {
    compareDeep (
        objA?:Dictionary, objB?:Dictionary
    ): ObjectDifference
}

interface ObjectDifference {
    count: number,
    changed:{[key:string]: [any,any]},
    onlyA:Dictionary,
    onlyB:Dictionary
}



(function RS_h_object_init () {
    const publicExports = module.exports = <h_object_file>{};



    publicExports.compareDeep = function RS_helpers_object_compareDeep (objA={}, objB={}) {
        const result = {
            count:0, changed:{}, onlyA:{}, onlyB:Object.assign({},objB)
        };
        Object.keys(objA).forEach(compareDeepSub.bind(null, result, objA, objB));
        result.count += Object.keys(result.onlyB).length;
        return result;
    };

    const compareDeepSub = function RS_helpers_object_compareDeepSub (
        result:Dictionary,
        objA:Dictionary, objB:Dictionary, key:string
    ):void {
        delete result.onlyB[key];
        const valA = objA[key];
        const valB = objB[key];
        if (valA === valB || (Number.isNaN(valA) && Number.isNaN(valB))) {
            return;
        }

        if (valB === undefined) {
            result.count += 1;
            result.onlyA[key] = valA;
            return;
        } else if (typeof valA !== typeof valB || typeof valA !== "object" || valA === null || valB === null) {
            result.count += 1;
            result.changed[key] = [valA,valB]
            return;
        }

        const subs = publicExports.compareDeep(valA,valB);
        if (subs.count === 0) {
            return;
        }

        Object.entries(subs.onlyA).forEach(function (data) {
            result.count +=1;
            result.onlyA[key+"."+data[0]] = data[1];
        });
        Object.entries(subs.onlyB).forEach(function (data) {
            result.onlyB[key+"."+data[0]] = data[1];
        });
        Object.entries(subs.changed).forEach(function (data) {
            result.count +=1;
            result.changed[key+"."+data[0]] = data[1];
        });
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({section:"object", functions:publicExports});
    }
})();