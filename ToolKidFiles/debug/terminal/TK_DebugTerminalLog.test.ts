(function TK_DebugTerminal_test() {
    const Debug = ToolKid.debug;
    const Terminal = Debug.terminal;
    const { assertEquality, test } = Debug.test;



    const colors = <Dictionary>{};
    test({
        subject: Terminal.getColorCode,
        execute: function collectImportantColors() {
            ["grey", "white", "cyan", "orange", "red"].forEach(function (name) {
                colors[name] = Terminal.getColorCode(<any>name);
                assertEquality({
                    name: "type of " + name,
                    value: typeof colors[name],
                    shouldBe: "string"
                });
            });
        }
    });

    test({
        subject: Terminal.colorStrings,
        execute: function basic() {
            assertEquality({
                "mixed values":{
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
                "combined strings":{
                    value: Terminal.colorStrings({
                        colorName: "red", values: ["A","B","C", {}, "D","E"]
                    }),
                    shouldBe: [
                        colors.red + "ABC" + colors.white,
                        {},
                        colors.red + "DE" + colors.white
                    ]
                }
            });
        }
    });



    const originalLogError = console.error;
    const originalLogWarning = console.warn;
    let errors = <any[][]>[];
    let warnings = <any[][]>[];
    console.error = function (...inputs) {
        errors = inputs;
    };
    console.warn = function (...inputs) {
        warnings = inputs;
    };

    test({
        subject: Terminal.logError,
        execute: function basic() {
            Terminal.logError("string first", 1);
            assertEquality({
                name: "errors", value: errors, shouldBe:
                    [colors.red + ">> string first" + colors.white, 1]
            });
            Terminal.logError(2, "number first");
            assertEquality({
                name: "errors", value: errors, shouldBe: [
                    colors.red + ">>" + colors.white,
                    2,
                    colors.red + "number first" + colors.white
                ]
            });
        }
    });

    test({
        subject: Terminal.logBasic,
        execute: function basic() {
            Terminal.logBasic("basic", 1, [true]);
            assertEquality({
                name: "warnings", value: warnings, shouldBe:[
                    colors.grey + ">> basic" + colors.white, 1, [true]
                ]
            });
        }
    });

    test({
        subject: Terminal.logImportant,
        execute: function basic() {
            Terminal.logImportant("important", 2, [true]);
            assertEquality({
                name: "warnings", value: warnings, shouldBe:[
                    colors.cyan + ">> important" + colors.white, 2, [true]
                ]
            });
        }
    });

    test({
        subject: Terminal.logWarning,
        execute: function basic() {
            Terminal.logWarning("warning", 3, [true]);
            assertEquality({
                "warnings":{
                    value: warnings,
                    shouldBe:[
                        colors.orange + ">> warning" + colors.white, 3, [true]
                    ]
                }
            });
        }
    });



    console.error = originalLogError;
    console.warn = originalLogWarning;
})();