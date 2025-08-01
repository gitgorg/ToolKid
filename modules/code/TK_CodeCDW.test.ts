(function TK_CodeCDW_test() {
    const { assert, test } = ToolKid.debug.test;
    const { textLayerDefinition } = ToolKid.code.CDW;
    const { createTextParser } = ToolKid.getCoreModule("parsing");



    const { readLayerContent } = <any>textLayerDefinition.cdw_importMaybe.layerData;
    test({
        subject: readLayerContent,
        execute: function readingContents() {
            const contents = <string[]>[];
            const parser = createTextParser({
                layerDefinition: {
                    cdw_importMaybe: textLayerDefinition.cdw_importMaybe
                },
                parseClosings: function () {
                    contents.push(readLayerContent(arguments))
                }
            });
            parser("\
a #load('b.cdw') c #load(d.js) e #load('f.css', '.test.value')\
g #load() h #load('') i #load($variable)");
            assert({
                "multiple contents": {
                    value: contents,
                    shouldBe: ["b.cdw", , "f.css", , ,]
                }
            });
        }
    });
})();