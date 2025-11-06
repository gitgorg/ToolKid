(function LibraryParsing_test() {
    const {
        createTextParser, createTextReplacer, getLayerDefinition, readLayerContent
    } = <LibraryParsing_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryParsing.js"));

    const { assertEquality, /*assertFailure,*/ shouldPass, test } = ToolKid.debug.test;
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
    const fileParserInputs = [
   /*0*/[0, 'bracket', '('],
        [10, 'bracket', '('],
        [11, 'bracket', ')', 10],
        [12, 'bracket', '{'],
        [31, 'import', 'require('],
   /*5*/[39, 'text', '"'],
        [48, 'escape', '\\('],
        [51, 'escape', '\\)'],
        [53, 'text', '"', 39],
        [54, 'import', ')', 31],
   /*10*/[61, 'comment', '//'],
        [96, 'comment', '\n', 61],
        [101, 'bracket', '['],
        [107, 'bracket', ']', 101],
        [109, 'function', 'forEach('],
   /*15*/[126, 'bracket', '('],
        [132, 'bracket', ')', 126],
        [134, 'bracket', '{'],
        [144, 'function', 'log('],
        [158, 'function', ')', 144],
  /*20*/[164, 'bracket', '}', 134],
        [165, 'function', ')', 109],
        [168, 'bracket', '}', 12],
        [169, 'bracket', ')', 0],
        [170, 'bracket', '('],
  /*25*/[171, 'bracket', ')', 170]
    ];

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
            const parser = createTextParser({
                layerDefinition: layersJS,
                parseOpenings: register,
                parseClosings: register,
            });
            parser(file);
            assertEquality({
                "js": {
                    value: inputList,
                    toleranceDepth: 3,
                    shouldBe: fileParserInputs
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
            const parser = createTextParser({
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
                parseClosings,
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
            const parser = createTextParser({
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
                parseClosings: register,
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
                "simple overlap": {
                    value: inputList,
                    toleranceDepth: 3,
                    shouldBe: [
                        [9, "comment", "\n", 0],
                        [19, 'RX', '/', 14]
                    ]
                }
            });
        }
    }, {
        subject: createTextParser,
        execute: function equalClosings() {
            const parser = createTextParser({
                layerDefinition: {
                    html_cdw: {
                        patterns: [[/DATA-MVC="/i, '"'], [/DATA-CDW="/i, '"']],
                    },
                },
                parseClosings: register,
            });
            inputList.length = 0;
            parser('<a DATA-MVC="b" DATA-CDW="c">content</a>');
            assertEquality({
                "inputList": {
                    value: inputList,
                    toleranceDepth: 3,
                    shouldBe: [
                        [ 14, 'html_cdw', '"', 3 ],
                        [ 27, 'html_cdw', '"', 16 ]
                    ]
                }
            });
        }
    }, {
        subject: createTextParser,
        execute: function fail_parseText() {
            inputList.length = 0;
            const parser = createTextParser({
                layerDefinition: {
                    bracket: layersJS.bracket,
                },
                parseClosings: register,
            });

            // assertFailure({
            //     name: "broken brackets",
            //     execute: parser,
            //     withInputs: ["a(b[c)];"]
            // })
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
            const parser = createTextParser({
                layerDefinition: {
                    bracket: layersJS.bracket
                },
                parseClosings: function () {
                    contents.push(readLayerContent(arguments));
                }
            });
            parser("a(b[c)d]e)f");
            assertEquality({
                "contents": { value: contents, shouldBe: ["c)d", "b[c)d]e"] }
            });
        }
    });
})();