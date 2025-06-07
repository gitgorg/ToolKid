(function LibraryParsing_test() {
    const {
        createTextParser, createTextReplacer, getLayerDefinition
    } = <LibraryParsing_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryParsing.js"));

    const { assertEquality, shouldPass, test } = ToolKid.debug.test;
    const shouldPassObject = shouldPass(ToolKid.dataTypes.checks.isObject)



    const layersJS = <TextLayerDefinition>Object.assign(getLayerDefinition(), {
        bracket: {
            patterns: [
                ["(", ")"],
                ["{", "}"],
                ["[", "]"]
            ],
            contains: ["MAIN"]
        },
        import: {
            patterns: [
                ["require(", ")"]
            ],
            contains: ["MAIN"]
        },
        function: {
            patterns: [
                [/\w+\(/, ")"]
            ],
            contains: ["MAIN"]
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
   /*0*/[0, 'bracket', '(', false],
        [10, 'bracket', '(', false],
        [11, 'bracket', ')', 10],
        [12, 'bracket', '{', false],
        [31, 'import', 'require(', false],
   /*5*/[39, 'text', '"', false],
        [48, 'escape', '\\(', false],
        [51, 'escape', '\\)', false],
        [53, 'text', '"', 39],
        [54, 'import', ')', 31],
   /*10*/[61, 'comment', '//', false],
        [96, 'comment', '\n', 61],
        [101, 'bracket', '[', false],
        [107, 'bracket', ']', 101],
        [109, 'function', 'forEach(', false],
   /*15*/[126, 'bracket', '(', false],
        [132, 'bracket', ')', 126],
        [134, 'bracket', '{', false],
        [144, 'function', 'log(', false],
        [158, 'function', ')', 144],
  /*20*/[164, 'bracket', '}', 134],
        [165, 'function', ')', 109],
        [168, 'bracket', '}', 12],
        [169, 'bracket', ')', 0],
        [170, 'bracket', '(', false],
  /*25*/[171, 'bracket', ')', 170]
    ];

    test({
        subject: createTextParser,
        execute: function parseLayered() {
            const inputList = <any[]>[];
            const register = <TextParserForOpenings & TextParserForClosings>function (
                RXResult, data, inputs, layerDepth, RXOpening
            ) {
                inputList.push([
                    RXResult.index, data.name, RXResult[0],
                    RXOpening === undefined ? false : RXOpening.index
                ]);
            };
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
    },{
        subject: createTextParser,
        execute: function deepLayers() {
            const registered = <any[]>[];
            const push = function (inputs:IArguments) {
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
                        patterns: [["(",")"], ["[","]"], ["{","}"]],
                        contains: ["MAIN"]
                    },
                    text: {
                        patterns: [["'", "'"],],
                        contains: ["escape"],
                    },
                    comment: {
                        patterns: [["//", /\n|$/], ["/*", "*/"]],
                    },
                    escape: {
                        isMAINLayer: false,
                        patterns: [/\\./s],
                    },
                    function:{
                        patterns: [[/\w+\(/, ")"]],
                        contains: ["MAIN"]
                    },
                },
                parseClosings,
            });
            parser("require(a);");
            assertEquality({
                "simple": {
                    value: registered,
                    toleranceDepth: 3,
                    shouldBe: [[ 0, 'require(', 'a', ')' ]]
                }
            });
            registered.length = 0;
            parser("require((b));");
            assertEquality({
                "bracketed": {
                    value: registered,
                    toleranceDepth: 3,
                    shouldBe: [
                        [ 8, '(', 'b', ')' ],
                        [ 0, 'require(', '(b)', ')' ]
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
                        [ 8, "(", "'b'", ")" ],
                        [ 0, "require(", "('b')", ")" ]
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
                        [ 2, "b(", "c", ")" ],
                        [ 0, "a(", "b(c)", ")" ]
                    ]
                }
            });
            registered.length = 0;
            parser("a(b[c)];");
            assertEquality({
                "broken bracket": {
                    value: registered,
                    toleranceDepth: 3,
                    shouldBe: [
                        [ 3, '[', 'c)', ']' ]
                    ]
                }
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
                    }
                },
            });
            let result = parser(file);
            assertEquality({
                "result": {
                    value: result, shouldBe: '\
(function (){\n\
    const data = "hello";\n\
    //const data = require({a:1, b:2});\n\
    [1,2,3].forEach(function (value) {\n\
        log(555, value)\n\
    });\n\
})();'
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
    })
})();