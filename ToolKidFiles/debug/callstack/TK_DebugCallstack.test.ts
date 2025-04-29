(function TK_DebugConsole_test() {
    const Debug = ToolKid.debug;
    const { readCallstack } = Debug.callstack;
    const { assertEquality, test } = Debug.test;



    test({
        subject: readCallstack,
        execute: function basicReads() {
            assertEquality({
                "no arguments": {
                    value: readCallstack(),
                    shouldBe: ["TK_DebugCallstack"],
                },
                "position 3": {
                    value: readCallstack({ position: 3 }),
                    shouldBe: ["TK_DebugTest"],
                },
                "amount 3": {
                    value: readCallstack({ amount: 3 }),
                    shouldBe: ["TK_DebugCallstack", "TK_DebugCallstack.test", "TK_DebugTest"],
                },
                "position 2 amount 2": {
                    value: readCallstack({ position: 2, amount: 2 }),
                    shouldBe: ["TK_DebugCallstack.test", "TK_DebugTest"],
                },
            });
        }
    });
})();