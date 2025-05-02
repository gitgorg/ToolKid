(function TK_DataTypesList_test() {
    const { test, assertEquality } = ToolKid.debug.test;
    const { shortenList } = ToolKid.dataTypes.list;



    test({
        subject: shortenList,
        execute: function omittingText() {
            const alphabet = "abcdefghijklmnopqrstuvwxyz";
            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

            let omittedValue: any;
            const omissionSignal = function (input: any) {
                omittedValue = input;
                return "[" + input.length + "]";
            };

            assertEquality({
                "string with string omission signal": {
                    value: shortenList({
                        list: alphabet,
                        maxLength: 10,
                        omissionSignal: "[..]"
                    }),
                    shouldBe: "abcde[..]vwxyz"
                },
                "string with function omission signal": {
                    value: shortenList({
                        list: alphabet,
                        maxLength: 10,
                        omissionSignal
                    }),
                    shouldBe: "abcde[16]vwxyz"
                },
                "string omitted text": {
                    value: omittedValue,
                    shouldBe: "fghijklmnopqrstu"
                },
                "array with boolean omission signal": {
                    value: shortenList({
                        list: numbers,
                        maxLength: 6,
                        omissionSignal: true
                    }),
                    shouldBe: [1, 2, 3, true, 8, 9, 10]
                },
                "array with function omission signal": {
                    value: shortenList({
                        list: numbers,
                        maxLength: 6,
                        omissionSignal: omissionSignal
                    }),
                    shouldBe: [1, 2, 3, "[4]", 8, 9, 10]
                },
                "array omitted values": {
                    value: omittedValue,
                    shouldBe: [4, 5, 6, 7]
                },
            });
        }
    },);
})();