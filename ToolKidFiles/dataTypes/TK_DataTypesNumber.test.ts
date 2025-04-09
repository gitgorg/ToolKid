(function TK_DataTypesNumber_test() {
    const { test, assertEquality } = ToolKid.debug.test;
    const { addUnderscores } = ToolKid.dataTypes.number;



    test({
        subject: addUnderscores,
        execute: function unchangedIntegers() {
            assertEquality({
                "0": {
                    value: addUnderscores(0),
                    shouldBe: "0"
                },
                "-0": {
                    value: addUnderscores(-0),
                    shouldBe: "0"
                },
                "999": {
                    value: addUnderscores(999),
                    shouldBe: "999"
                },
                "-999": {
                    value: addUnderscores(-999),
                    shouldBe: "-999"
                },
            });
        }
    },{
        subject: addUnderscores,
        execute: function changedIntegers() {
            assertEquality({
                "1000": {
                    value: addUnderscores(1000),
                    shouldBe: "1_000"
                },
                "11111": {
                    value: addUnderscores(11111),
                    shouldBe: "11_111"
                },
                "999999": {
                    value: addUnderscores(999999),
                    shouldBe: "999_999"
                },
                "2000000": {
                    value: addUnderscores(2000000),
                    shouldBe: "2_000_000"
                },
                "-111111": {
                    value: addUnderscores(-111111),
                    shouldBe: "-111_111"
                },
            });
        }
    },{
        subject: addUnderscores,
        execute: function strings() {
            assertEquality({
                "string 1000": {
                    value: addUnderscores("1000"),
                    shouldBe: "1_000"
                },
            });
        }
    },{
        subject: addUnderscores,
        execute: function nonNumbers() {
            assertEquality({
                "no argument": {
                    value: (<any>addUnderscores)(),
                    shouldBe: ""
                },
                "undefined": {
                    value: (<any>addUnderscores)(undefined),
                    shouldBe: ""
                },
            });
        }
    });
})();