(function TK_DebugTerminal_test() {
    const Debug = ToolKid.debug;
    const Terminal = Debug.terminal;
    const { disableLogs, getColorCode } = Terminal;
    const { assertEquality, test } = Debug.test;



    const colors = <Dictionary>{};
    test({
        subject: getColorCode,
        execute: function collectImportantColors() {
            ["grey", "white", "cyan", "orange", "red"].forEach(function (name) {
                colors[name] = getColorCode(<any>name);
                const testInputs = <Dictionary>{};
                testInputs["type of " + name] = {
                    value: typeof colors[name],
                    shouldBe: "string"
                };
                assertEquality(testInputs);
            });
        }
    });

    test({
        subject: Terminal.colorStrings,
        execute: function basic() {
            assertEquality({
                "mixed values": {
                    value: Terminal.colorStrings({
                        colorName: "orange", values: ["text", 10, null, "text2"]
                    }),
                    shouldBe: [
                        colors.orange + "text" + colors.white,
                        10,
                        null,
                        colors.orange + "text2" + colors.white
                    ]
                },
                "combined strings": {
                    value: Terminal.colorStrings({
                        colorName: "red", values: ["A", "B", "C", {}, "D", "E"]
                    }),
                    shouldBe: [
                        colors.red + "ABC" + colors.white,
                        {},
                        colors.red + "DE" + colors.white
                    ],
                    toleranceDepth: 2
                }
            });
        }
    });



    const originalLogError = console.error;
    const originalLogWarning = console.warn;
    let errors = <any[][]>[];
    let warnings = <any[][]>[];
    console.error = function TK_DebugTerminalLog_errorReplacement(...inputs) {
        errors.push(inputs);
    };
    console.warn = function TK_DebugTerminalLog_warnReplacement(...inputs) {
        warnings.push(inputs);
    };

    test({
        subject: disableLogs,
        execute: function disablingLogs() {
            warnings.length = 0;
            disableLogs(2);
            console.warn(1);
            console.warn(2);
            console.warn(3);
            assertEquality({
                "blocked warnings": {
                    value: warnings,
                    shouldBe: [[3]],
                    toleranceDepth: 2,
                }
            });
        },
    }, {
        subject: disableLogs,
        execute: function reenablingLogs() {
            warnings.length = 0;
            disableLogs(100);
            console.warn(1);
            disableLogs(false);
            console.warn(2);
            console.warn(3);
            assertEquality({
                "reenabled warnings": {
                    value: warnings,
                    shouldBe: [[2], [3]],
                    toleranceDepth: 2,
                },
            });
        },
        callback: function () {
            warnings.length = 0;
        }
    });

    test({
        subject: Terminal.logError,
        execute: function logError() {
            Terminal.logError("string first", 1);
            Terminal.logError(2, "number first");
            assertEquality({
                "errors": {
                    value: errors,
                    shouldBe: [
                        [colors.red + ">>  string first" + colors.white, 1],
                        [
                            colors.red + ">>" + colors.white,
                            2, colors.red + "number first" + colors.white
                        ]
                    ],
                    toleranceDepth: 3
                }
            });
        }
    });

    test({
        subject: Terminal.logBasic,
        execute: function logBasic() {
            warnings.length = 0;
            Terminal.logBasic("basic", 1, [true]);
            assertEquality({
                "warnings": {
                    value: warnings,
                    shouldBe: [
                        [colors.grey + ">>  basic" + colors.white, 1, [true]]
                    ],
                    toleranceDepth: 3
                }
            });
        }
    });

    test({
        subject: Terminal.logImportant,
        execute: function logImportant() {
            warnings.length = 0;
            Terminal.logImportant("important", 2, [true]);
            assertEquality({
                "warnings": {
                    value: warnings,
                    shouldBe: [
                        [colors.cyan + ">>  important" + colors.white, 2, [true]]
                    ],
                    toleranceDepth: 3
                }
            });
        }
    });

    test({
        subject: Terminal.logWarning,
        execute: function logWarning() {
            warnings.length = 0;
            Terminal.logWarning("warning", 3, [true]);
            assertEquality({
                "warnings": {
                    value: warnings,
                    shouldBe: [
                        [colors.orange + ">>  warning" + colors.white, 3, [true]]
                    ],
                    toleranceDepth: 3
                }
            });
        }
    });



    warnings.length = 0;
    console.error = originalLogError;
    console.warn = originalLogWarning;
})();