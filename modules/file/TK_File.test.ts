(function TK_File_test() {
    const { assert, assertFailure, test } = ToolKid.debug.test;

    const { getExtension } = ToolKid.file;

    test({
        subject: getExtension,
        execute: function fileExtension() {
            assert({
                "regular": [getExtension("test.html"), "html"],
                "CAPS": [getExtension("test.HTML"), "html"],
                "mixed case": [getExtension("test.hTmL"), "html"],
                "folder": [getExtension("a/b/c"), ""],
                "folder difficlt": [getExtension("a\\.b\\c"), ""],
            });
            assertFailure({
                name: "missing inputs",
                execute: getExtension,
            },{
                name: "invalid inputs",
                execute: getExtension,
                withInputs: true,
            });
        }
    });
})();