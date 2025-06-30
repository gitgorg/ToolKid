(function TK_CodeParsing_test() {
    const { assert, test } = ToolKid.debug.test;
    const { removeQuotes } = ToolKid.code;



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