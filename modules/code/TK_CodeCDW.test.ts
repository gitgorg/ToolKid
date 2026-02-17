(function TK_CodeCDW_test() {
    const { assert, test } = ToolKid.debug.test;
    const { textLayerDefinition } = ToolKid.code.CDW;
    const { createTextParser } = ToolKid.getCoreModule("parsing");



    const { readLayerContent } = <any>textLayerDefinition.cdw_importMaybe.layerData;
    test({
        subject: readLayerContent,
        execute: function readingContents() {
            const contents = <string[]>[];
            const parser = <TextParser>createTextParser({
                layerDefinition: {
                    cdw_importMaybe: textLayerDefinition.cdw_importMaybe
                },
                parsers: new Map([
                    [function () {
                        contents.push(readLayerContent(arguments))
                    }, ">*"]
                ])
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

    test({
        subject: createTextParser,
        execute: function parsingCDWText() {
            const parser = <TextParser>createTextParser({
                layerDefinition: textLayerDefinition,
                parsers: new Map([
                    [function (closing, layerData, inputs, depth, opening) {
                        contents.push([
                            opening.index,
                            layerData.name,
                            inputs.text.slice(opening.index, closing.index + closing[0].length)
                        ])
                    }, ">*"]
                ])
            });
            const contents = <any[]>[];
            parser("'single\\' double\\2'");
            assert({
                "quotes": {
                    value: contents,
                    shouldBe: [
                        [7, 'cdw_textEscape', "\\'"],
                        [16, 'cdw_textEscape', '\\2'],
                        [0, 'cdw_text', "'single\\' double\\2'"]
                    ],
                    toleranceDepth: 3
                }
            });

            contents.length = 0;
            parser("'number{{2+3}} and text \\{{4+5}}'");
            assert({
                "quotes": {
                    value: contents,
                    shouldBe: [
                        [7, 'cdw_textParse', "{{2+3}}"],
                        [24, 'cdw_textEscape', '\\{'],
                        [0, 'cdw_text', "'number{{2+3}} and text \\{{4+5}}'"]
                    ],
                    toleranceDepth: 3
                }
            });

            contents.length = 0;
            parser(`
&& #info() | watch:[[keyDown, Alt, c],[keyDown, Alt, 'ç']]
&& #load([
    path << 'state.js',
    callback << {:
        && .match.loadState($)
    :}
])`
            );
            assert({
                "real code": {
                    value: contents,
                    shouldBe: [
                        [9, 'cdw_funkCall', '()'],
                        [21, 'cdw_list', '[keyDown, Alt, c]'],
                        [54, 'cdw_text', "'ç'"],
                        [39, 'cdw_list', "[keyDown, Alt, 'ç']"],
                        [20, 'cdw_list', "[[keyDown, Alt, c],[keyDown, Alt, 'ç']]"],
                        [83, 'cdw_text', "'state.js'"],
                        [141, 'cdw_funkCall', '($)'],
                        [
                            111,
                            'cdw_funkDeclare',
                            '{:\n        && .match.loadState($)\n    :}'
                        ],
                        [
                            69,
                            'cdw_list',
                            '[\n' +
                            "    path << 'state.js',\n" +
                            '    callback << {:\n' +
                            '        && .match.loadState($)\n' +
                            '    :}\n' +
                            ']'
                        ],
                        [
                            63,
                            'cdw_importMaybe',
                            '#load([\n' +
                            "    path << 'state.js',\n" +
                            '    callback << {:\n' +
                            '        && .match.loadState($)\n' +
                            '    :}\n' +
                            '])'
                        ]
                    ],
                    toleranceDepth: 3,
                },
            });
        }
    });
})();