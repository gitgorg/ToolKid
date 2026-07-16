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
                        colorName: "orange", prefix: "text", values: [10, null, "text2"]
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
                        colors.red + "A, B, C" + colors.white,
                        {},
                        colors.red + "D, E" + colors.white
                    ],
                    toleranceDepth: 2
                }
            });
        }
    });



    const registerMessage =function TK_DebugTerminalLog_registerMessage(
        messages:any[][], ...inputs: any[]
    ) {
        messages.push(inputs);
    };

    const logOriginal = console.log;
    const logs = <any[][]>[];
    const logReplacement = registerMessage.bind(null,logs);

    const warnOriginal = console.warn;
    const warnings = <any[][]>[];
    const warnReplacement = registerMessage.bind(null,warnings);

    const errorOriginal = console.error;
    const errors = <any[][]>[];
    const errorReplacement = registerMessage.bind(null,errors);

    test({
        subject: disableLogs,
        execute: function disablingLogs() {
            warnings.length = 0;
            console.warn = warnReplacement;
            disableLogs(2);
            console.warn(1);
            console.warn(2);
            console.warn(3);
            console.warn = warnOriginal;
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
            console.warn = warnReplacement;
            disableLogs(100);
            console.warn(1);
            disableLogs(false);
            console.warn(2);
            console.warn(3);
            console.warn = warnOriginal;
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
            console.error = errorReplacement;
            Terminal.logError("string first", 1);
            Terminal.logError(2, "number first");
            console.error = errorOriginal;
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
        },
    });

    test({
        subject: Terminal.logBasic,
        execute: function logBasic() {
            warnings.length = 0;
            console.log = logReplacement;
            Terminal.logBasic("basic", 1, [true]);
            console.log = logOriginal;
            assertEquality({
                "warnings basic": {
                    value: logs,
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
            console.warn = warnReplacement;
            Terminal.logImportant("important", 2, [true]);
            console.warn = warnOriginal;
            assertEquality({
                "warnings important": {
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
            console.warn = warnReplacement;
            Terminal.logWarning("warning", 3, [true]);
            console.warn = warnOriginal;
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



    errors.length = 0;
    warnings.length = 0;
    console.error = errorOriginal;
    console.warn = warnOriginal;
})();