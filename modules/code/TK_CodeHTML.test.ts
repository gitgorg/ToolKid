(function TK_CodeHTML_test() {
    const { merge } = ToolKid.dataTypes.object;
    const { assert, test } = ToolKid.debug.test;
    const { collectAttributes, extendTag, textLayerDefinition } = ToolKid.code.HTML;
    const { createTextParser, readLayerContent } = ToolKid.getCoreModule("parsing");



    test({
        subject: collectAttributes,
        assert: {
            "CONFIG": { toleranceDepth: 4 },
            "no attributes": [collectAttributes('<a></a>'), {
                attributes: {}, endPosition: 3
            }],
            "no tag ending": [collectAttributes('<a b="c"'), {
                attributes: {}, error: Error
            }]
        }
    });

    test({
        subject: extendTag,
        assert: {
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
    });
})();