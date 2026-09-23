(function TK_DataTypesObject_test() {
    const { test, assert } = ToolKid.debug.test;
    const { clone, merge, filter } = ToolKid.dataTypes.object;



    test({
        subject: clone,
        execute: function basic() {
            let origin = [1, 2, 3] as any;
            let copy = clone(origin, 1);
            assert({
                "flat equality": {
                    value: copy,
                    shouldBe: origin,
                    toleranceDepth: 1,
                },
                "flat identity": {
                    value: copy === origin,
                    shouldBe: false,
                },
            });
            origin = [1, { b: 2, c: new Set([3]) }];
            copy = clone(origin, 1);
            assert({
                "deep equality": {
                    value: copy,
                    shouldBe: origin,
                    toleranceDepth: 1,
                },
                "deep identity": {
                    value: copy === origin,
                    shouldBe: false,
                },
                "deep property identity": {
                    value: copy[1] === origin[1],
                    shouldBe: true,
                },
            });
            copy = clone(origin, 4);
            assert({
                "full equality": {
                    value: copy,
                    shouldBe: origin,
                    toleranceDepth: 5,
                },
                "full property identity": {
                    value: copy[1].c === origin[1].c,
                    shouldBe: false,
                }
            });
        }
    }, {
        subject: clone,
        execute: function invalidDepth() {
            let origin = [1, 2, 3];
            let copy = clone(origin, -2);
            assert({
                "low equality": {
                    value: copy,
                    shouldBe: origin,
                    toleranceDepth: 1,
                },
                "low identity": {
                    value: copy === origin,
                    shouldBe: false,
                },
            });
            copy = clone(origin);
            assert({
                "missing depth equality": {
                    value: copy,
                    shouldBe: origin,
                    toleranceDepth: 1,
                },
                "missing depth identity": {
                    value: copy === origin,
                    shouldBe: false,
                },
            });
        }
    });

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
        execute: function objectFilter() {
            const filtered = filter({
                data: { a: true, b: false, c: null, d: undefined },
                byKeys: ["b", "d"]
            });
            assert({
                "filtered": [filtered, { b: false }],
                "filtered keys": [Object.keys(filtered), ["b"]],
                "missingKeys": [filter.bind(null, <any>{
                    data: { a: true, b: false }
                }), Error],
            });
        }
    })
})();