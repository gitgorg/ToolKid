(function TK_CodeParsing_test() {
    const { assert, test } = ToolKid.debug.test;
    const { addIndentation, readIndentation, removeQuotes } = ToolKid.code;



    test({
        subject: addIndentation,
        execute: function assertAddingIndentation() {
            assert({
                "simple": [
                    addIndentation("a\n b\nc", " ").join(""),
                    "a\n  b\n c"
                ],
            });
        }
    });

    test({
        subject: readIndentation,
        execute: function assertIndentation() {
            assert({
                "simple": [readIndentation(" a b d e", 3), " "],
                "lineBreaks": [readIndentation(" a\n  b d\n  e", 7), "  "],
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
    });
})();