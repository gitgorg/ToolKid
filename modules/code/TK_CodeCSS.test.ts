(function TK_CodeCSS_test() {
    const { assert, test } = ToolKid.debug.test;
    const { textLayerDefinition } = ToolKid.code.CSS;
    const { createTextParser } = ToolKid.getCoreModule("parsing");



    const { readLayerContent } = <any>textLayerDefinition.css_url.layerData;
    test({
        subject: readLayerContent,
        execute: function readingContents() {
            const contents = <string[]>[];
            const parser = <TextParser>createTextParser({
                layerDefinition: {
                    css_url: textLayerDefinition.css_url
                },
                parsers: new Map([
                    [function () {
                        contents.push(readLayerContent(arguments))
                    }, ">*"]
                ])
            });
            parser("\
a url('b.cdw') c url(d.js) e url()");
            assert({
                "multiple contents": {
                    value: contents,
                    shouldBe: ["b.cdw", "d.js",]
                }
            });
        }
    });
})();