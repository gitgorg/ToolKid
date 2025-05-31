(function LibraryParsing_test() {
    const {
        createSimpleRX, createTextParser, createTextReplacer, getLayerDefinition
    } = <LibraryParsing_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryParsing.js"));

    const { assertEquality, test } = ToolKid.debug.test;



    test({
        subject: createSimpleRX,
        execute: function differentUsecases() {
            const testFiles = createSimpleRX({
                pattern: "*.test.js",
                isFromStartToEnd: true
            });
            const greedy = <any>createSimpleRX("**b**d");
            assertEquality({
                "testFiles": {
                    value: [testFiles.test("a.test.js"), testFiles.test("b.js"), testFiles.test("c.test.jsm")],
                    shouldBe: [true, false, false]
                },
                "greedy": {
                    value: [
                        greedy.exec("aaabcccd")[0],
                        greedy.exec("abcd")[0],
                        greedy.exec("aaabbbcccddd")[0],
                        greedy.exec("abcdb")[0],
                        greedy.exec("abcdbd")[0],
                    ],
                    shouldBe: ["aaabcccd", "abcd", "aaabbbcccddd", "abcd", "abcdbd"]
                },
            });

            const sourceContent = <any>createSimpleRX('src="(*)"');
            let found = sourceContent.exec('<img src="a.jpg" alt="a">');
            assertEquality({
                "sourceContent": {
                    value: [found[0], found[1]],
                    shouldBe: ['src="a.jpg"', "a.jpg"]
                },
            });
        }
    });

    const layersJS = <TextLayerDefinition>Object.assign(getLayerDefinition(),{
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
                ["require(",")"]
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
/*0*/   [0, 'bracket', '(', false],
        [10, 'bracket', '(', false],
        [11, 'bracket', ')', 10],
        [12, 'bracket', '{', false],
        [31, 'import', 'require(', false],
/*5*/   [39, 'text', '"', false],
        [48, 'escape', '\\(', false],
        [51, 'escape', '\\)', false],
        [53, 'text', '"', 39],
        [54, 'import', ')', 31],
/*10*/  [61, 'comment', '//', false],
        [96, 'comment', '\n', 61],
        [101, 'bracket', '[', false],
        [107, 'bracket', ']', 101],
        [109, 'function', 'forEach(', false],
/*15*/  [126, 'bracket', '(', false],
        [132, 'bracket', ')', 126],
        [134, 'bracket', '{', false],
        [144, 'function', 'log(', false],
        [158, 'function', ')', 144],
/*20*/  [164, 'bracket', '}', 134],
        [165, 'function', ')', 109],
        [168, 'bracket', '}', 12],
        [169, 'bracket', ')', 0],
        [170, 'bracket', '(', false],
/*25*/  [171, 'bracket', ')', 170]
    ];

    test({
        subject: createTextParser,
        execute: function parseLayered() {
            const inputList = <any[]>[];
            const register = <TextParserForOpenings & TextParserForClosings>function (
                RXResult, layerName, layerDepth, RXOpening
            ) {
                inputList.push([
                    RXResult.index, layerName, RXResult[0],
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
    });

    test({
        subject: createTextReplacer,
        execute: function replaceLayered() {
            const parser = createTextReplacer({
                layerDefinition: layersJS,
                parseClosings: function (
                    RXResult, layerName
                ):any {
                    if (layerName === "import") {
                        return '"hello"'
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
})();