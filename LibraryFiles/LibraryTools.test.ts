(function LibraryBuilder_test() {
    const {
        createPatternMatcher, createPatternMatcherComlex, createSimpleRegxp, createStringCheck, partial
    } = <LibraryTools_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryTools_nodeJS.js"));
    const { assertEquality, assertFailure, shouldPass, test } = ToolKid.debug.test;


    test({
        subject: createPatternMatcher,
        execute: function genericBehaviour() {
            const matcher = createPatternMatcher("aal");
            assertEquality({
                "typeof matcher": { value: typeof matcher, shouldBe: "function" },
                "text 1": { value: matcher("ein herzliches haallo an aale aale"), shouldBe: [16, "aal"] },
                "text 2": { value: matcher("heute haben wir die Quaal der Waal"), shouldBe: [22, "aal"] },
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

    const paths = [
        "a/b/c.ts",
        "a/b/c.js",
        "a/b/c.test.js",
        "a/b/c/d",
        "a/d/c.ts",
        "a/b"
    ];

    test({
        subject: createSimpleRegxp,
        execute: function filteringPaths() {
            const filterPathsEasy = function LibraryTools_test_filterPathsEasy(
                easyString: string
            ) {
                const expression = createSimpleRegxp(easyString);
                return paths.filter(
                    expression.test.bind(expression)
                );
            };

            assertEquality({
                "tests": {
                    value: filterPathsEasy("*.test.js"),
                    shouldBe: [
                        "a/b/c.test.js"
                    ]
                },
                "has subname starting with c": {
                    value: filterPathsEasy("*/c*"),
                    shouldBe: [
                        "a/b/c.ts",
                        "a/b/c.js",
                        "a/b/c.test.js",
                        "a/b/c/d",
                        "a/d/c.ts"
                    ]
                },
                "has folder": {
                    value: filterPathsEasy("*/d/*"),
                    shouldBe: [
                        "a/d/c.ts"
                    ]
                },
                "ends with folder": {
                    value: filterPathsEasy("*/b"),
                    shouldBe: [
                        "a/b"
                    ]
                }
            });
        }
    });

    test({
        subject: createStringCheck,
        execute: function filteringStrings() {
            assertEquality({
                "only .ts": {
                    value: paths.filter(createStringCheck({
                        include: [createSimpleRegxp("*.ts")]
                    })),
                    shouldBe: [
                        "a/b/c.ts",
                        "a/d/c.ts"
                    ]
                },
                "no .ts": {
                    value: paths.filter(createStringCheck({
                        exclude: [createSimpleRegxp("*.ts")]
                    })),
                    shouldBe: [
                        "a/b/c.js",
                        "a/b/c.test.js",
                        "a/b/c/d",
                        "a/b"
                    ]
                },
                "only .js without .test": {
                    value: paths.filter(createStringCheck({
                        include: [createSimpleRegxp("*.js")],
                        exclude: [createSimpleRegxp("*.test.js")]
                    })),
                    shouldBe: [
                        "a/b/c.js"
                    ]
                }
            });
        }
    });

    test({
        subject: partial,
        execute: function basic() {
            const sum = function (a: any, b: any, c = 0) {
                return a + b + c;
            };
            const add1 = partial(sum, 1);
            const concat11 = partial(add1, "1");
            assertEquality({
                "regular function": {
                    value: sum(1, 2),
                    shouldBe: 3
                },
                "partial result type": {
                    value: add1,
                    shouldBe: shouldPass(ToolKid.dataTypes.checks.isFunction)
                },
                "partial all arguments": {
                    value: partial(sum, 1, 2)(),
                    shouldBe: 3
                },
                "partial combining arguments": {
                    value: add1(10),
                    shouldBe: 11
                },
                "partial of partial": {
                    value: concat11(7),
                    shouldBe: "117"
                }
            });
        }
    }, {
        subject: partial,
        execute: function failures() {
            assertFailure({
                name: "no inputs",
                execute: partial
            });
            assertFailure({
                name: "no parameters to bind",
                execute: partial,
                withInputs: partial
            });
            assertFailure({
                name: "first parameter isn't a function",
                execute: partial,
                withInputs: [10, partial]
            });
        }
    });
})();