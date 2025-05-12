(function TK_CodeParsing_test() {
    const { assertEquality, test } = ToolKid.debug.test;
    const { readJSImports } = ToolKid.code;



    test({
        subject: readJSImports,
        execute: function importingFromJS() {
            const parse = function (code:string) {
                const tokens = <any[]>[];
                const parser = tokens.push.bind(tokens);
                readJSImports({ code, parser });
                return tokens;
            };

            assertEquality({
                "no imports": {
                    value: parse("none"),
                    shouldBe: []
                },
                "regular require": {
                    value: parse("a; require(\"b\"); c; \n require(\"d\"); e;"),
                    shouldBe: [3, "b", 22, "d"]
                },
            });
        }
    });
})();