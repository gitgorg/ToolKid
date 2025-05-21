(function LibraryParsing_test() {
    const {
        createSimpleRX, createTextParser, createTextParserLayered, createTextReplacer
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

    test({
        subject: createTextParser,
        execute: function singularParsing() {
            let registry = <any[]>[];
            const register = function (key: any, RXResult: RegExpExecArray) {
                registry.push(key, RXResult.index, RXResult[0]);
            };
            const parser = createTextParser(["a", register.bind(null, true)], ["b", register.bind(null, false)]);
            parser("abcbcba");
            assertEquality({
                "simple": {
                    value: registry, shouldBe: [
                        true, 0, "a",
                        false, 1, "b",
                        false, 3, "b",
                        false, 5, "b",
                        true, 6, "a"
                    ]
                }
            });
        }
    }, {
        subject: createTextParser,
        execute: function singularParsing() {
            let registry = <any[]>[];
            const register = function (key: any, RXResult: RegExpExecArray) {
                registry.push(key, RXResult.index, RXResult[0]);
            };
            const parser = createTextParser(["a", register.bind(null, true)], ["b", register.bind(null, false)]);
            parser("abcbcba");
            assertEquality({
                "simple": {
                    value: registry, shouldBe: [
                        true, 0, "a",
                        false, 1, "b",
                        false, 3, "b",
                        false, 5, "b",
                        true, 6, "a",
                    ]
                }
            });
        }
    });

    const layersJS = {
        comment: {
            patterns: [
                ["//", /\n|$/],
                ["/*", "*/"]
            ],
        },
        text: {
            patterns: [
                ["\"", "\""],
                ["'", "'"],
                ["`", "`"]
            ],
            contains: ["escape"],
        },
        escape: {
            isMAINLayer: false,
            patterns: [
                /\\./s
            ],
        },
        bracket: {
            patterns: [
                ["(", ")"],
                ["{", "}"]
            ],
            contains: ["MAIN"]
        },
        function: {
            patterns: [
                [/\w+\(/, ")"]
            ],
            contains: ["MAIN"]
        },
    };

    test({
        subject: createTextParserLayered,
        execute: function parsingJS() {
            const inputList = <any[]>[];
            const parser = createTextParserLayered({
                layers: layersJS,
                parser: function(RXResult, layer, lastIndex, depth) {
                    inputList.push(RXResult.index, depth, RXResult[0]);
                    log(depth, RXResult.index, layer.name, [RXResult[0]], lastIndex);
                },
            });

            let parsed = parser('\
(function (){\n\
    const data = require("whatever\\(2\\)");\n\
    //const data = {a:1, b:2};\n\
    data.forEach(function (value) {\n\
        log(555, value)\n\
    });\n\
})();\n\
            ');
            // assertEquality({
            //     "js": {value:inputList, shouldBe:[
            //         0, 1, "(",
            //         1, 2, "(",
            //     ]}
            // });
        }
    });

    test({
        subject: createTextReplacer,
        execute: function differentUsecases() {
            const remove_a = createTextReplacer(["a", ""]);
            const remove_aA = createTextReplacer(["a", ""], ["A", ""]);
            const moveLetters = createTextReplacer(
                ["a", "b"], ["b", "c"], ["c", "d"], ["d", "e"],
                ["e", "f"], ["f", "g"], ["g", "h"], ["h", "i"],
                ["i", "j"], ["j", "k"], ["k", "l"], ["l", "m"],
            );
            const ASCII = createTextReplacer([/./, function (found) {
                return found[0].charCodeAt(0);
            }]);

            const HTML = '\
<img data-testid="one" src="one.jpg" alt="one">\n\
<img data-testid="two" src="two.test.jpg">\n\
<img src="three.jpg">\n\
<a data-testid="four" href="www.four.com">four</a>';

            assertEquality({
                "remove_a": {
                    value: [remove_a("hallo"), remove_a("bcde"), remove_a("Saaler Aale")],
                    shouldBe: ["hllo", "bcde", "Sler Ale"]
                },
                "remove_aA": {
                    value: [remove_aA("hallo"), remove_aA("bcde"), remove_aA("Saaler Aale")],
                    shouldBe: ["hllo", "bcde", "Sler le"]
                },
                "moveLetters": {
                    value: [moveLetters("hallo")],
                    shouldBe: ["ibmmo"]
                },
                "ASCII": {
                    value: [ASCII("hallo"), ASCII("\n .\r")],
                    shouldBe: ["10497108108111", "10324613"],
                },
            });


            const removeIDs = createTextReplacer(
                [createSimpleRX('data-testid="*"'), ""]
            );
            assertEquality({
                "removeIDs": {
                    value: removeIDs(HTML),
                    shouldBe: '\
<img  src="one.jpg" alt="one">\n\
<img  src="two.test.jpg">\n\
<img src="three.jpg">\n\
<a  href="www.four.com">four</a>'
                },
            });

            const RXSource = createSimpleRX('src="(*).*"');
            const addAlt = createTextReplacer(
                [createSimpleRX('<img*>'),
                function (found) {
                    let content = found[0];
                    if (content.indexOf("alt=\"") !== -1) {
                        return content;
                    }

                    const source = RXSource.exec(content);
                    if (source !== null) {
                        content = content.slice(0, -1) + " alt=\"" + source[1] + "\">";
                    }
                    return content;
                }]
            );
            assertEquality({
                "addAlt": {
                    value: addAlt(HTML),
                    shouldBe: '\
<img data-testid="one" src="one.jpg" alt="one">\n\
<img data-testid="two" src="two.test.jpg" alt="two">\n\
<img src="three.jpg" alt="three">\n\
<a data-testid="four" href="www.four.com">four</a>'
                }
            });
        }
    });
})();