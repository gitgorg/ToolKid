(function LibraryRegularExpression_test() {
    const { assert, test } = ToolKid.debug.test;
    const {
        createSimpleRX, createStringChecker
    } = <LibraryRegularExpression_file>require(ToolKid.nodeJS.resolvePath(__dirname, "./LibraryRegularExpression.js"));

    test({
        subject: createSimpleRX,
        execute: function differentUsecases() {
            const testFiles = createSimpleRX({
                pattern: "*.test.js",
                isFromStartToEnd: true
            });
            const greedy = <any>createSimpleRX("**b**d");
            assert({
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
            assert({
                "sourceContent": {
                    value: [found[0], found[1]],
                    shouldBe: ['src="a.jpg"', "a.jpg"]
                },
            });
        }
    });

    test({
        subject: createStringChecker,
        execute: function checkingStrings() {
            const hasA = createStringChecker({ includes: [/a/] });
            assert({
                "typeof hasA": {
                    value: typeof hasA, shouldBe: "function"
                },
                "hasA": {
                    value: [hasA("bcde"), hasA("bcade"), hasA("AAA")],
                    shouldBe: [false, true, false]
                }
            });
            const noBorC = createStringChecker({ excludes: [/b/, /c/] });
            assert({
                "only b": { value: noBorC("bbbb"), shouldBe: false },
                "only c": { value: noBorC("ccccc"), shouldBe: false },
                "caps": { value: noBorC("BC"), shouldBe: true },
            });
        }
    })
})()