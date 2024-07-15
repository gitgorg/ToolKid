(function TK_DataTypesChecksEquality_test() {
    const Debug = ToolKid.debug;
    const { assertEquality, test } = Debug.test;
    const {areEqual} = ToolKid.dataTypes.checks;



    test({
        subject: areEqual,
        execute: function passingTest() {
            assertEquality({
                "complexValues": {
                    value: areEqual({
                        value: {
                            NaN: NaN,
                            object: { number: 100 },
                            array:  [1, 2, 3],
                            map: new Map(<any>[["text", "bla"], [10, 100]]),
                            set: new Set([1, true, "text"])
                        },
                        shouldBe: {
                            NaN: NaN,
                            object: { number: 100 },
                            array:  [1, 2, 3],
                            map: new Map(<any>[["text", "bla"], [10, 100]]),
                            set: new Set([1, true, "text"])
                        },
                        toleranceDepth: 3
                    }),
                    shouldBe: true
                }
            });
        }
    },{
        subject: areEqual,
        execute: function fail_differentValues() {
            const differences = areEqual({
                value: {
                    different: 100,
                    exceeding: true
                },
                shouldBe: {
                    different: "100",
                    missing: true
                }
            });
            assertEquality({
                "differentValues": {
                    value: differences,
                    shouldBe: [
                        {path:["different"], type:"different", value:100, shouldBe:"100"},
                        {path:["missing"], type:"different", value:undefined, shouldBe:true},
                        {path:["exceeding"], type:"unwanted", value:true}
                    ],
                    toleranceDepth:3
                }
            });
        }
    },{
        subject: areEqual,
        execute: function fail_exceedingToleranceDepth() {
            let differences = areEqual({
                value: [1,[2],[[3]]],
                shouldBe: [1,[2],[[3]]]
            });
            assertEquality({
                "depthDefault(1)": {
                    value: differences,
                    shouldBe: [
                        {path:[1], type:"tooDeep", value:[2]},
                        {path:[2], type:"tooDeep", value:[[3]]}
                    ],
                    toleranceDepth:4
                }
            });
            differences = areEqual({
                value: [1,[2],[[3]]],
                shouldBe: [1,[2],[[3]]],
                toleranceDepth: 2
            });
            assertEquality({
                "depth2": {
                    value: differences,
                    shouldBe: [
                        {path:[2,0], type:"tooDeep", value:[3]}
                    ],
                    toleranceDepth:3
                }
            });
        }
    });
})();