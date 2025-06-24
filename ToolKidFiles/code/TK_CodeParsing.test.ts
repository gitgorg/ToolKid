(function TK_CodeParsing_test() {
    const { assert, test } = ToolKid.debug.test;
    const { readJSImports, removeQuotes } = ToolKid.code;



    test({
        subject: readJSImports,
        execute: function importingFromJS() {
            const parse = function (code: string) {
                const tokens = <any[]>[];
                const parser = tokens.push.bind(tokens);
                readJSImports({ code, parser });
                return tokens;
            };

            assert({
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

    test({
        subject: removeQuotes,
        execute: function basicQuotes() {
            assert({
                "double quotes": [removeQuotes('"a"'), "a"],
                "single quotes": [removeQuotes("'a'"), "a"],
                // "back tick": [removeQuotes("`a`"), "a"],
            });
        }
    })
})();