(function TK_File_test() {
    const { assert, test } = ToolKid.debug.test;
    const { getExtension, getName } = ToolKid.file;

    const shouldBeError = ToolKid.debug.test.shouldPass("isError");

    test({
        subject: getExtension,
        execute: function readFileExtension() {
            assert({
                "regular": [getExtension("test.html"), "html"],
                "CAPS": [getExtension("test.HTML"), "html"],
                "mixed case": [getExtension("test.hTmL"), "html"],
                "folder": [getExtension("a/b/c"), ""],
                "folder difficult": [getExtension("a\\.b\\c"), ""],
                "missing inputs": [getExtension, Error],
                "invalid inputs": [getExtension.bind(null, true as any), Error],
            });
        }
    });

    test({
        subject: getName,
        execute: function readFileName() {
            assert({
                "slash": [getName("a/b/c.d"), "c.d"],
                "backslash": [getName("a\\b\\c.d"), "c.d"],
                "mixed slashes": [getName("a\\b//c.d"), "c.d"],
                "folder": [getName("a/b/c"), "c"],
                "folder difficult": [getName("a\\.b\\c"), "c"],
                "missing inputs": [(<any>getName)(), shouldBeError],
                "invalid inputs": [(<any>getName)(true), shouldBeError],
            });
        }
    });

    test({
        subject: ToolKid.file.register,
        execute: function placeholder() {
            // TODO: .register can't be tested for now
        }
    });
})();