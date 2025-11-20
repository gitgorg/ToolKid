(function TK_CodeHTML_test() {
    const { merge } = ToolKid.dataTypes.object;
    const { assert, test } = ToolKid.debug.test;
    const { collectAttributes, extendTag, textLayerDefinition } = ToolKid.code.HTML;
    const { createTextParser, readLayerContent } = ToolKid.getCoreModule("parsing");



    test({
        subject: collectAttributes,
        assert: function () {
            return {
                "CONFIG": { toleranceDepth: 4 },
                "no attributes": [collectAttributes('<a></a>'), {
                    attributes: {}, endPosition: 3
                }],
                "no tag ending": [collectAttributes('<a b="c"'), {
                    attributes: {}, error: Error
                }]
            };
        }
    });

    test({
        subject: extendTag,
        assert: function () {
            return {
                "complex": {
                    value: extendTag({
                        baseTag: '\
<a b="1" c="2" d="\n\
    3\n\
">',
                        extensionTag: '\
<A c="\n\
    one two\n\
" d="three" e="four"\
'
                    }).join(""),
                        shouldBe: '\
<a b="1" c="\n\
    one two\n\
 2" d="three \n\
    3\n\
" e="four">\
'
                }
            };
        }
    });

    test({
        subject: "HTML textLayerDefinition",
        execute: function readingContents() {
            const contents = <any[][]>[];
            const parser = createTextParser({
                layerDefinition: {
                    html_comment: textLayerDefinition.html_comment,
                    html_tagStart: merge(textLayerDefinition.html_tagStart, {
                        contains: ["html_attribute"]
                    }),
                    html_attribute: textLayerDefinition.html_attribute
                },
                parseClosings: function (closing, layer, inputs, depth, opening) {
                    contents.push([
                        layer.name, readLayerContent(arguments),
                        opening.index, opening[0],
                        closing.index, closing[0],
                    ]);
                }
            });
            parser('\
<html>\
<head><title a="b">test</title></head>\
<!--<body c="d"></body>-->\
</html>');
            assert({
                "simple attributes and comment": {
                    value: contents,
                    toleranceDepth: 3,
                    shouldBe: [
                        ['html_tagStart', '', 0, '<html', 5, '>'],
                        ['html_tagStart', '', 6, '<head', 11, '>'],
                        ['html_attribute', 'b', 19, 'a="', 23, '"'],
                        ['html_tagStart', ' a="b"', 12, '<title', 24, '>'],
                        ['html_comment', '<body c="d"></body>', 44, '<!--', 67, '-->'],
                    ]
                }
            });
        }
    }, {
        subject: "HTML textLayerDefinition",
        execute: function realComplex() {
            const contents = <any[][]>[];
            const parser = createTextParser({
                layerDefinition: textLayerDefinition,
                parseClosings: function (closing, layer, inputs, depth, opening) {
                    contents.push([
                        layer.name, readLayerContent(arguments),
                        opening.index, opening[0],
                        closing.index, closing[0],
                    ]);
                }
            });
            parser('<!DOCTYPE html>\
<html lang="de">\
<head DATA-INSERT="head.html"></head>\
<body DATA-CDW="\
    && #info() | watch: [[keyDown,Alt,c],[keyDown,Alt,\'ç\']]\
">\
    <h1 class="hidden">TakeLaw Help Center</h1>\
    <header DATA-INSERT="header.html"></header>\
    <main></main>\
    <footer DATA-INSERT="footer.html"></footer>\
</body>\
</html>');
            assert({
                "real complex values": {
                    value: contents,
                    toleranceDepth: 3,
                    shouldBe: [
                        ['html_attribute', 'de', 21, 'lang="', 29, '"'],
                        ['html_tagStart', ' lang="de"', 15, '<html', 30, '>'],
                        ['html_insert', 'head.html', 37, 'DATA-INSERT="', 59, '"'],
                        ['html_tagStart', ' DATA-INSERT="head.html"', 31, '<head', 60, '>'],
                        ['html_cdw', "    && #info() | watch: [[keyDown,Alt,c],[keyDown,Alt,'ç']]", 74, 'DATA-CDW="', 143, '"'],
                        ['html_tagStart', ` DATA-CDW="    && #info() | watch: [[keyDown,Alt,c],[keyDown,Alt,'ç']]"`, 68, '<body', 144, '>'],
                        ['html_attribute', 'hidden', 153, 'class="', 166, '"'],
                        ['html_tagStart', ' class="hidden"', 149, '<h1', 167, '>'],
                        ['html_insert', 'header.html', 204, 'DATA-INSERT="', 228, '"'],
                        ['html_tagStart', ' DATA-INSERT="header.html"', 196, '<header', 229, '>'],
                        ['html_tagStart', '', 243, '<main', 248, '>'],
                        ['html_insert', 'footer.html', 268, 'DATA-INSERT="', 292, '"'],
                        ['html_tagStart', ' DATA-INSERT="footer.html"', 260, '<footer', 293, '>']
                    ]
                }
            });
        }
    });
})();