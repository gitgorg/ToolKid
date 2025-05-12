(function LibraryBuilder_test() {
    const {
        createPatternMatcher, createPatternMatcherComlex
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
})();