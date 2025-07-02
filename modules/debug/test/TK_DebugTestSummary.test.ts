(function TK_DebugTestSummary_test() {
    const Debug = ToolKid.debug.test;
    const { assertEquality, getSummary, shouldPass, switchResultGroup, test } = Debug;



    const anyNumber = shouldPass(function (value: any) {
        return typeof value === "number" && !Number.isNaN(value);
    });

    const anyString = shouldPass(function (value: any) {
        return typeof value === "string" && value.length !== 0;
    })

    const anySet = shouldPass(function (value: any) {
        return value instanceof Set;
    });



    test({
        subject: getSummary,
        execute: function validCurrentSummary() {
            assertEquality({
                "initial summary": {
                    value: getSummary(),
                    shouldBe: {
                        name: anyString,
                        failures: shouldPass((value) => value instanceof Array),
                        missingSuspects: anySet,
                        testedSuspects: anySet,
                        pending: anySet,
                        successes: shouldPass((value) => value instanceof Map),
                        testCount: anyNumber
                    },
                    toleranceDepth: 3
                }
            });
        }
    });



    // switching to separate testGroup to not mess up results
    const currentSummary = getSummary();
    switchResultGroup("TK_DebugTestSummary");



    const separateSummary = getSummary();



    // switching back to main testGroup to not mess up results
    switchResultGroup(currentSummary.name);



    test({
        subject: switchResultGroup,
        execute: function summarySwitching() {
            assertEquality({
                "original summary din't change after switching": {
                    value: getSummary(),
                    shouldBe: currentSummary,
                    toleranceDepth: 4
                }
            });
            assertEquality({
                    "switched summary": {
                    value: separateSummary,
                    shouldBe: {
                        name: "TK_DebugTestSummary",
                        testCount: 0,
                        failures: [],
                        successes: new Map(),
                        testedSuspects: new Set(),
                        pending: new Set(),
                        missingSuspects: new Set()
                    },
                    toleranceDepth: 3
                }
            });
        }
    });

    test({
        subject: getSummary,
        execute: function missingSuspects() {
            const dummySuspect = { name: "dummySuspect" };
            const dummySuspectWithMethods = {
                name: "dummySuspectWithMedhots",
                method: function dummySuspectMethod() { }
            };
            assertEquality({
                ".missingSuspects": {
                    value: getSummary({
                        suspects: [dummySuspect, dummySuspectWithMethods]
                    }).missingSuspects,
                    shouldBe: new Set([
                        dummySuspect,
                        dummySuspectWithMethods.method
                    ])
                }
            });
        }
    });
})();