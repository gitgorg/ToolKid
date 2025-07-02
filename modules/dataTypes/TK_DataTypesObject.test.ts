(function TK_DataTypesObject_test() {
    const { test, assert, assertFailure } = ToolKid.debug.test;
    const { merge, filter } = ToolKid.dataTypes.object;



    test({
        subject: merge,
        execute: function objectMerge() {
            assert({
                "add": {
                    value: merge({ a: 1 }, { b: 2 }),
                    shouldBe: { a: 1, b: 2 }
                },
                "overwrite": {
                    value: merge({ a: 1 }, { a: 2 }),
                    shouldBe: { a: 2 }
                },
                "delete": {
                    value: merge({ a: 1 }, { a: undefined }),
                    shouldBe: {}
                }
            });
        }
    }, {
        subject: merge,
        execute: function complexCombinations() {
            assert({
                "multiple objects": {
                    toleranceDepth: 4,
                    value: merge(
                        {
                            name: "sigi", lastName: "evers",
                            child: { name: "eva", lastName: "evers" }
                        },
                        { job: "janitor", history: ["janitor"] },
                        { job: undefined, history: ["janitor", undefined] },
                        { child: { name: "udo" } }
                    ),
                    shouldBe: {
                        name: "sigi", lastName: "evers",
                        history: ["janitor", undefined],
                        child: { name: "udo", lastName: "evers" }
                    }
                },
            });
        }
    });

    test({
        subject: filter,
        execute: function objectFilter () {
            const filtered = filter({data: {a:true, b:false, c:null}, byKeys:["b","d"]});
            assert({
                "filtered": [filtered, {b:false}],
                "filtered keys": [Object.keys(filtered), ["b"]]
            });
            assertFailure({
                name:"missingKeys",
                execute: filter,
                withInputs: [{data: {a:true, b:false}}]
            });
        }
    })
})();