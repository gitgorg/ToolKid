(function LibraryParsing_test() {
    const {
        createTextParser, createTextReplacer, getLayerDefinition, readLayerContent
    } = <LibraryParsing_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryParsing.js"));

    const { assert, assertEquality, /*assertFailure,*/ shouldPass, test } = ToolKid.debug.test;
    const shouldPassObject = shouldPass(ToolKid.dataTypes.checks.isObject)



    const layersJS = <TextLayerDefinition>Object.assign(getLayerDefinition(), {
        bracket: {
            patterns: [
                ["(", ")"],
                ["{", "}"],
                ["[", "]"]
            ],
            contains: ["ROOT"]
        },
        import: {
            patterns: [
                ["require(", ")"]
            ],
            contains: ["ROOT"]
        },
        function: {
            patterns: [
                [/\w+\(/, ")"]
            ],
            contains: ["ROOT"]
        },
    });

    const file = '\
(function (){\n\
    const data = require("whatever\\(2\\)");\n\
    //const data = require({a:1, b:2});\n\
    [1,2,3].forEach(function (value) {\n\
        log(555, value)\n\
    });\n\
})();';

    const inputList = <any[]>[];
    const register = <TextParserForOpenings & TextParserForClosings>function (
        RXResult, layerData, inputs, layerDepth, RXOpening
    ) {
        if (RXOpening === undefined) {
            inputList.push([
                RXResult.index, layerData.name, RXResult[0]
            ]);
            return;
        }

        inputList.push([
            RXResult.index, layerData.name, RXResult[0],
            RXOpening.index
        ]);
    };

    test({
        subject: createTextParser,
        execute: function parseLayered() {
            inputList.length = 0;
            const parser = <TextParser>createTextParser({
                layerDefinition: layersJS,
                parsers: new Map(<any>[
                    [register, ["*"]],
                ]),
            });
            parser(file);
            assertEquality({
                "js": {
                    value: inputList,
                    toleranceDepth: 3,
                    shouldBe: [
                        [0, 'bracket', '('], //0
                        [10, 'bracket', '('],
                        [11, 'bracket', ')', 10],
                        [12, 'bracket', '{'],
                        [31, 'import', 'require('],
                        [39, 'text', '"'], //5
                        [48, 'escape', '\\('],
                        [50, 'escape', '', 48],
                        [51, 'escape', '\\)'],
                        [53, 'escape', '', 51],
                        [53, 'text', '"', 39],
                        [54, 'import', ')', 31],
                        [61, 'comment', '//'], //10
                        [96, 'comment', '\n', 61],
                        [101, 'bracket', '['],
                        [107, 'bracket', ']', 101],
                        [109, 'function', 'forEach('],
                        [126, 'bracket', '('], //15
                        [132, 'bracket', ')', 126],
                        [134, 'bracket', '{'],
                        [144, 'function', 'log('],
                        [158, 'function', ')', 144],
                        [164, 'bracket', '}', 134], //20
                        [165, 'function', ')', 109],
                        [168, 'bracket', '}', 12],
                        [169, 'bracket', ')', 0],
                        [170, 'bracket', '('],
                        [171, 'bracket', ')', 170] //25
                    ]
                }
            });
        }
    }, {
        subject: createTextParser,
        execute: function deepLayers() {
            const registered = <any[]>[];
            const push = function (inputs: IArguments) {
                const opening = inputs[4];
                const closing = inputs[0];
                registered.push([
                    opening.index,
                    opening[0],
                    inputs[2].text.slice(opening.index + opening[0].length, closing.index),
                    closing[0]
                ]);
            }
            const parseClosings = <TextParserForClosings>function (
                closing, layerData
            ) {
                if (layerData.name === "bracket" || layerData.name === "function") {
                    push(arguments);
                }
            };
            const parser = <TextParser>createTextParser({
                layerDefinition: {
                    bracket: {
                        patterns: [["(", ")"], ["[", "]"], ["{", "}"]],
                        contains: ["ROOT"]
                    },
                    text: {
                        patterns: [["'", "'"],],
                        contains: ["escape"],
                    },
                    comment: {
                        patterns: [["//", /\n|$/], ["/*", "*/"]],
                    },
                    escape: {
                        isROOTLayer: false,
                        patterns: [/\\./s],
                    },
                    function: {
                        patterns: [[/\w+\(/, ")"]],
                        contains: ["ROOT"]
                    },
                },
                parsers: new Map([
                    [parseClosings, ">*"]
                ]),
            });
            parser("require(a);");
            assertEquality({
                "simple": {
                    value: registered,
                    toleranceDepth: 3,
                    shouldBe: [[0, 'require(', 'a', ')']]
                }
            });
            registered.length = 0;
            parser("require((b));");
            assertEquality({
                "bracketed": {
                    value: registered,
                    toleranceDepth: 3,
                    shouldBe: [
                        [8, '(', 'b', ')'],
                        [0, 'require(', '(b)', ')']
                    ]
                }
            });
            registered.length = 0;
            parser("require(('b'));");
            assertEquality({
                "bracketed string": {
                    value: registered,
                    toleranceDepth: 3,
                    shouldBe: [
                        [8, "(", "'b'", ")"],
                        [0, "require(", "('b')", ")"]
                    ]
                }
            });
            registered.length = 0;
            parser("a(b(c));");
            assertEquality({
                "call in call": {
                    value: registered,
                    toleranceDepth: 3,
                    shouldBe: [
                        [2, "b(", "c", ")"],
                        [0, "a(", "b(c)", ")"]
                    ]
                }
            });
        }
    }, {
        subject: createTextParser,
        execute: function overlapingDefinitions() {
            const parser = <TextParser>createTextParser({
                layerDefinition: {
                    comment: {
                        patterns: [
                            ["//", /\n|$/],
                            ["/*", "*/"]
                        ],
                    },
                    RX: {
                        patterns: [["/", "/"]],
                        contains: ["escape"]
                    },
                    escape: {
                        isROOTLayer: false,
                        patterns: [
                            /\\./s
                        ],
                    },
                },
                parsers: new Map([
                    [register, ">*"]
                ]),
            });
            inputList.length = 0;
            parser('//comment\na = /b/');
            assertEquality({
                "simple overlap": {
                    value: inputList,
                    toleranceDepth: 3,
                    shouldBe: [
                        [9, "comment", "\n", 0],
                        [16, 'RX', '/', 14]
                    ]
                }
            });
            inputList.length = 0;
            parser('//comment\na = /b\\/c/');
            assertEquality({
                "simple overlap escaped": {
                    value: inputList,
                    toleranceDepth: 3,
                    shouldBe: [
                        [9, "comment", "\n", 0],
                        [18, 'escape', '', 16],
                        [19, 'RX', '/', 14]
                    ]
                }
            });
        }
    }, {
        subject: createTextParser,
        execute: function equalClosings() {
            const parser = <TextParser>createTextParser({
                layerDefinition: {
                    html_cdw: {
                        patterns: [[/DATA-MVC="/i, '"'], [/DATA-CDW="/i, '"']],
                    },
                },
                parsers: new Map([
                    [register, ">*"]
                ]),
            });
            inputList.length = 0;
            parser('<a DATA-MVC="b" DATA-CDW="c">content</a>');
            assertEquality({
                "inputList": {
                    value: inputList,
                    toleranceDepth: 3,
                    shouldBe: [
                        [14, 'html_cdw', '"', 3],
                        [27, 'html_cdw', '"', 16]
                    ]
                }
            });
        }
    }, {
        subject: createTextParser,
        execute: function fail_parseText() {
            inputList.length = 0;
            const parser = <TextParser>createTextParser({
                layerDefinition: {
                    bracket: layersJS.bracket,
                },
                parsers: new Map(<any>[
                    [register, [">bracket"]],
                    ["REMOVE", ["*"]]
                ])
            });

            parser("a(b[c)];");
            assertEquality({
                "broken bracket": {
                    value: inputList,
                    toleranceDepth: 3,
                    shouldBe: [
                        [6, "bracket", "]", 3]
                    ]
                },
            });
        }
    })



    test({
        subject: createTextParser,
        execute: function specifics_basic() {
            inputList.length = 0;
            const parser = <TextParser>createTextParser({
                layerDefinition: {
                    bracket: layersJS.bracket,
                    function: layersJS.function
                },
                parsers: new Map(<any>[
                    [register, [">bracket", ">function"]]
                ])
            });

            parser("{a:(require(b)[c])}");
            assertEquality({
                "broken bracket": {
                    value: inputList,
                    toleranceDepth: 3,
                    shouldBe: [
                        [13, 'function', ')', 4],
                        [16, 'bracket', ']', 14],
                        [17, 'bracket', ')', 3],
                        [18, 'bracket', '}', 0]
                    ]
                },
            });
        }
    }, {
        subject: createTextParser,
        execute: function specifics_remove() {
            inputList.length = 0;
            const parser = <TextParser>createTextParser({
                layerDefinition: layersJS,
                parsers: new Map(<any>[
                    [register, [">bracket", ">function"]],
                    ["REMOVE", ["*"]]
                ])
            });
            parser("{a:(require(b)[c])}");
            assertEquality({
                "broken bracket": {
                    value: inputList,
                    toleranceDepth: 3,
                    shouldBe: [
                        [13, 'function', ')', 4],
                        [16, 'bracket', ']', 14],
                        [17, 'bracket', ')', 3],
                        [18, 'bracket', '}', 0]
                    ]
                },
            });
        }
    }, {
        subject: createTextParser,
        execute: function specifics_skip() {
            inputList.length = 0;
            const parser = <TextParser>createTextParser({
                layerDefinition: layersJS,
                parsers: new Map(<any>[
                    [register, [">bracket", ">function"]],
                    ["SKIP", ["import"]],
                    ["REMOVE", ["*"]]
                ])
            });
            parser("{a:(require(b)[c])}");
            assertEquality({
                "broken bracket": {
                    value: inputList,
                    toleranceDepth: 3,
                    shouldBe: [
                        [16, 'bracket', ']', 14],
                        [17, 'bracket', ')', 3],
                        [18, 'bracket', '}', 0]
                    ]
                },
            });
        }
    });

    test({
        subject: createTextParser,
        execute: function specifics_missingLayers() {
            assert({
                "parser": {
                    value: createTextParser({
                        layerDefinition: layersJS,
                        parsers: new Map(<any>[
                            [register, [">bracket", ">function"]],
                            ["SKIP", ["import"]]
                        ])
                    }),
                    toleranceDepth: 3,
                    shouldBe: new Error(),
                    allowAdditions: true
                },
            });
        }
    });



    test({
        subject: createTextReplacer,
        execute: function replaceLayered() {
            const parser = createTextReplacer({
                layerDefinition: layersJS,
                parseClosings: function (
                    RXResult, data
                ): any {
                    if (data.name === "import") {
                        return '"hello"';
                    } else if (data.name === "function") {
                        const RXOpening = arguments[4];
                        if (RXOpening[0] === "log(") {
                            return ["/*", "log", "*/"]
                        }
                    }
                },
            });
            let result = parser(file);
            assertEquality({
                "result": {
                    value: result,
                    shouldBe: ['\
(function (){\n\
    const data = ', '"hello"', ';\n\
    //const data = require({a:1, b:2});\n\
    [1,2,3].forEach(function (value) {\n\
        ', '/*', 'log', '*/', '\n\
    });\n\
})();'
                    ],
                    toleranceDepth: 2,
                }
            });
        }
    });

    test({
        subject: getLayerDefinition,
        execute: function checkLayerDefinition() {
            const definition = getLayerDefinition();
            assertEquality({
                "definition": {
                    value: definition,
                    allowAdditions: true,
                    toleranceDepth: 4,
                    shouldBe: {
                        text: shouldPassObject
                    },
                }
            });
        }
    });

    test({
        subject: readLayerContent,
        execute: function simpleContents() {
            let contents = <string[]>[];
            const parser = <TextParser>createTextParser({
                layerDefinition: {
                    bracket: layersJS.bracket
                },
                parsers: new Map([
                    [function () {
                        contents.push(readLayerContent(arguments));
                    }, ">*"]
                ]),
            });
            parser("a(b[c)d]e)f");
            assertEquality({
                "contents": { value: contents, shouldBe: ["c)d", "b[c)d]e"] }
            });
        }
    });
})();