(function TK_CodeJS_test() {
    const { assert, test } = ToolKid.debug.test;
    const { removeComments, replaceFileConnections, textLayerDefinition } = ToolKid.code.JS;
    const { createTextParser } = ToolKid.getCoreModule("parsing");



    test({
        subject: removeComments,
        execute: function basic() {
            assert({
                "multiple notations": [removeComments("a // b\nc /* d */"), ["a ", "", "c ", "", ""]]
            });
        }
    });

    test({
        subject: replaceFileConnections,
        execute: function basic() {
            assert({
                "mutltiple notations": {
                    value: replaceFileConnections({
                        text: 'a require("b.js") c require(\'d.js\') e require() f require(g.js) h //require("i.js")',
                        replacer: function (content) {
                            return "-" + content + "-";
                        }
                    }),
                    shouldBe: [
                        'a ', '-"b.js"-', ' c ', "-'d.js'-",
                        ' e require() f require(g.js) h //require("i.js")'
                    ]
                }
            });
        }
    });

    const { readLayerContent } = <any>textLayerDefinition.js_import.layerData;
    test({
        subject: readLayerContent,
        execute: function readingImportContents() {
            const contents = <string[]>[];
            const parser = <TextParser>createTextParser({
                layerDefinition: {
                    js_import: textLayerDefinition.js_import
                },
                parsers: new Map(<any>[
                    [function () {contents.push(readLayerContent(arguments)) }, ">*"]
                ]),
            });
            parser('\
a require("b.js") c require(\'d.js\') e require("f\')\
g require() h reqire("") i require(\'\')');
            assert("multiple contents", contents, ["b.js", "d.js", undefined]);
        }
    });
})();