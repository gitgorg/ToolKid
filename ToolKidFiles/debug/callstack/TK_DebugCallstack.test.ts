(function TK_DebugConsole_test() {
    const Debug = ToolKid.debug;
    const { extractFileName, readFrames } = Debug.callstack;
    const { assertEquality, test } = Debug.test;



    test({
        subject: extractFileName,
        execute: function basicReads() {
            assertEquality({
                "path regular": {
                    value: extractFileName("a/b/c.d"),
                    shouldBe: "c.d",
                },
                "path backslash": {
                    value: extractFileName("a\\b\\c.d"),
                    shouldBe: "c.d",
                },
                "path regular with position": {
                    value: extractFileName("a/b/c.d:1:2"),
                    shouldBe: "c.d",
                },
                "path backslash with position": {
                    value: extractFileName("a\\b\\c.d:1:2"),
                    shouldBe: "c.d",
                },
            });
        }
    });

    test({
        subject: readFrames,
        execute: function basicReads() {
            assertEquality({
                "no arguments": {
                    value: readFrames(),
                    shouldBe: ["TK_DebugCallstack.js"],
                },
                "position 3": {
                    value: readFrames({ position: 3 }),
                    shouldBe: ["TK_DebugTest.js"],
                },
                "amount 3": {
                    value: readFrames({ amount: 3 }),
                    shouldBe: ["TK_DebugCallstack.js", "TK_DebugCallstack.test.js", "TK_DebugTest.js"],
                },
                "position 2 amount 2": {
                    value: readFrames({ position: 2, amount: 2 }),
                    shouldBe: ["TK_DebugCallstack.test.js", "TK_DebugTest.js"],
                },
            });
        }
    });
})();