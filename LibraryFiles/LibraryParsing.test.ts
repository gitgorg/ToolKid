(function LibraryParsing_test() {
    const {
        createPatternMatcher, createPatternMatcherComlex,
        createRegExp, createTextReplacer
    } = <LibraryParsing_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryParsing.js"));

    const { assertEquality, test } = ToolKid.debug.test;



    test({
        subject: createPatternMatcher,
        execute: function aalTest() {
            const matcher = createPatternMatcher("aal");
            assertEquality({
                "typeof matcher": { value: typeof matcher, shouldBe: "function" },
                "text 1": { value: matcher("ein herzliches haallo an aale aale"), shouldBe: [16, "aal"] },
                "text 2": { value: matcher("testen ist eine Quaal, doch es gibt keine Waal"), shouldBe: [18, "aal"] },
            });
        }
    }, {
        subject: createPatternMatcher,
        execute: function simpleMatchers() {
            const text = "abc def\nghi jkl";
            assertEquality({
                "simple single": { value: createPatternMatcher(" ")(text), shouldBe: [3, " "] },
                "simple single after line break": { value: createPatternMatcher("k")(text), shouldBe: [13, "k"] },
                "regExp single": { value: createPatternMatcher(/\S/)(text), shouldBe: [0, "a"] },
                "long single": { value: createPatternMatcher("def")(text), shouldBe: [4, "def"] },
                "long single reverse": { value: createPatternMatcher("fed")(text), shouldBe: [-1, undefined] },

                "simple multiple": { value: createPatternMatcher("d", "e")(text), shouldBe: [4, "d"] },
                "simple multiple reverse": { value: createPatternMatcher("e", "d")(text), shouldBe: [4, "d"] },
            });
        }
    }, {
        subject: createPatternMatcherComlex,
        execute: function indexingMatchers() {
            const text = "abc def\nghi jkl";
            const matcher = function (...patterns: any[]) {
                return createPatternMatcherComlex({ patterns, indexPatterns: true });
            }
            assertEquality({
                "simple single": { value: matcher(" ")(text), shouldBe: [3, " ", 0] },
                "simple single after line break": { value: matcher("k")(text), shouldBe: [13, "k", 0] },
                "regExp single": { value: matcher(/\S/)(text), shouldBe: [0, "a", 0] },
                "long single": { value: matcher("def")(text), shouldBe: [4, "def", 0] },
                "long single reverse": { value: matcher("fed")(text), shouldBe: [-1, undefined, -1] },

                "simple multiple": { value: matcher("d", "e")(text), shouldBe: [4, "d", 0] },
                "simple multiple reverse": { value: matcher("e", "d")(text), shouldBe: [4, "d", 1] },
            });
        }
    });

    test({
        subject: createRegExp,
        execute: function differentUsecases() {
            const testFiles = createRegExp({
                pattern: "*.test.js",
                isFromStartToEnd: true
            });
            const greedy = <any>createRegExp("**b**d");
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

            const sourceContent = <any>createRegExp('src="(*)"');
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

            const HTML =
                '<img data-testid="one" src="one.jpg" alt="one">\n\
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
                [createRegExp('data-testid="*"'), ""]
            );
            assertEquality({
                "removeIDs": {
                    value: removeIDs(HTML),
                    shouldBe:
                        '<img  src="one.jpg" alt="one">\n\
<img  src="two.test.jpg">\n\
<img src="three.jpg">\n\
<a  href="www.four.com">four</a>'
                },
            });

            const RXSource = createRegExp('src="(*).*"');
            const addAlt = createTextReplacer(
                [createRegExp('<img*>'),
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
                    shouldBe:
                        '<img data-testid="one" src="one.jpg" alt="one">\n\
<img data-testid="two" src="two.test.jpg" alt="two">\n\
<img src="three.jpg" alt="three">\n\
<a data-testid="four" href="www.four.com">four</a>'
                }
            });
        }
    });
})();