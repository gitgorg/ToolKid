(function TK_DataTypesString_test() {
    const { shouldPass, test } = ToolKid.debug.test;
    const shouldBeError = shouldPass(ToolKid.dataTypes.checks.isError);
    const { decodeJSON, encodeJSON } = ToolKid.dataTypes.string;



    test({
        subject: decodeJSON,
        assert: function success() {
            return {
                "CONFIG": {
                    toleranceDepth: 3,
                },
                "1": [decodeJSON("1"), 1],
                '"a"': [decodeJSON('"a"'), "a"],
                "[1,true]": [decodeJSON("[1,true]"), [1, true]],
                '{"name":"i"}': [decodeJSON('{"name":"i"}'), { name: "i" }],
            }
        }
    }, {
        subject: decodeJSON,
        assert: function errors() {
            return {
                "missing quotes": [decodeJSON('a'), shouldBeError],
                "missing quotes 2": [decodeJSON('{name: "test"}'), shouldBeError],
            }
        }
    });

    test({
        subject: encodeJSON,
        assert: function success() {
            return {
                "CONFIG": {
                    toleranceDepth: 3,
                },
                "1": [encodeJSON(1), "1"],
                'a': [encodeJSON('a'), '"a"'],
                "[1,true]": [encodeJSON([1, true]), "[1,true]"],
                '{"name":"i"}': [encodeJSON({ name: "i" }), '{"name":"i"}'],
            }
        }
    }, {
        subject: encodeJSON,
        assert: function errors() {
            return {
                "function": [encodeJSON(function () { }), shouldBeError],
                "regExp": [encodeJSON(/./), "{}"],
            }
        }
    });
    // log(decodeJSON('a'), 888)
})();