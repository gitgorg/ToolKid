(function TK_DataTypesChecks_test() {
    const { test, assertEquality } = ToolKid.debug.test;
    const { isArray, isBoolean, isFunction, isInteger, isMap, isNumber, isPromise, isString } = ToolKid.dataTypes.checks;



    test({
        subject: isArray,
        execute: function arrayTests() {
            assertEquality({
                "numbers": {
                    value: isArray([1, 2, 3]), shouldBe: true
                }, "mixed": {
                    value: isArray([undefined, true, "word"]), shouldBe: true
                }, "incomplete Array": {
                    value: isArray([,]), shouldBe: true
                }
            });
        }
    }, {
        subject: isArray,
        execute: function fail_arrayTests() {
            assertEquality({
                "empty Array": {
                    value: isArray([]), shouldBe: false
                }
            });
        }
    });

    test({
        subject: isBoolean,
        execute: function booleanTests() {
            assertEquality({
                "true": {
                    value: isBoolean(true), shouldBe: true
                }, "false": {
                    value: isBoolean(false), shouldBe: true
                }
            });
        }
    }, {
        subject: isBoolean,
        execute: function fail_booleanTests() {
            assertEquality({
                "string": {
                    value: isBoolean("true"), shouldBe: false
                }
            });
        }
    });

    test({
        subject: isFunction,
        execute: function functionTests() {
            assertEquality({
                "regular": {
                    value: isFunction(function(){}), shouldBe: true
                }, "fat arrow": {
                    value: isFunction(() => true), shouldBe: true
                }, "constructed": {
                    value: isFunction(Function("return true;")), shouldBe:true
                }
            });
        }
    }, {
        subject: isFunction,
        execute: function fail_functionTests() {
            assertEquality({
                "string": {
                    value: isFunction("function(){return true;}"), shouldBe: false
                }
            });
        }
    });

    test({
        subject: isInteger,
        execute: function integerTests() {
            assertEquality({
                "10": {
                    value: isInteger(10), shouldBe: true
                }, "0": {
                    value: isInteger(0), shouldBe: true
                }, "10.0": {
                    value: isInteger(10.0), shouldBe: true
                }, "-0": {
                    value: isInteger(-0), shouldBe: true
                }, "-100": {
                    value: isInteger(-100), shouldBe: true
                }
            });
        }
    }, {
        subject: isInteger,
        execute: function fail_integerTests() {
            assertEquality({
                "float": {
                    value: isInteger(0.3), shouldBe: false
                },
                "NaN": {
                    value: isInteger(NaN), shouldBe: false
                },
                "infinity": {
                    value: isInteger(Number.POSITIVE_INFINITY), shouldBe: false
                }
            });
        }
    });

    test({
        subject: isMap,
        execute: function mapTests() {
            assertEquality({
                "mixed": {
                    value: isMap(new Map(<any>[["text", "string"], [true, false]])), shouldBe: true
                }
            });
        }
    }, {
        subject: isMap,
        execute: function fail_mapTests() {
            assertEquality({
                "empty": {
                    value: isMap(new Map()), shouldBe: false
                }
            });
        }
    });

    test({
        subject: isNumber,
        execute: function numberTests() {
            assertEquality({
                "10": {
                    value: isNumber(10), shouldBe: true
                }, "0": {
                    value: isNumber(0), shouldBe: true
                }, "-100": {
                    value: isNumber(-100), shouldBe: true
                }, "float": {
                    value: isNumber(0.3), shouldBe: true
                },
                "infinity": {
                    value: isNumber(Number.POSITIVE_INFINITY), shouldBe: true
                }
            });
        }
    }, {
        subject: isNumber,
        execute: function fail_numberTests() {
            assertEquality({
                "NaN": {
                    value: isNumber(NaN), shouldBe: false
                }
            });
        }
    });

    test({
        subject: isPromise,
        execute: function promiseTests() {
            assertEquality({
                "resolved": {
                    value: isPromise(Promise.resolve()), shouldBe: true
                }, "rejected": {
                    value: isPromise(
                        Promise.reject().catch(function () { })
                    ), shouldBe: true
                }
            });
        }
    }, {
        subject: isPromise,
        execute: async function fail_promiseTests() {
            assertEquality({
                "awaited promise": {
                    value: isPromise(await Promise.resolve()), shouldBe: false
                }
            });
        }
    });

    test({
        subject: isString,
        execute: function stringTests() {
            assertEquality({
                "string": {
                    value: isString("false"), shouldBe: true
                }, "white space": {
                    value: isString(" "), shouldBe: true
                }
            });
        }
    }, {
        subject: isString,
        execute: function fail_stringTests() {
            assertEquality({
                "empty": {
                    value: isString(""), shouldBe: false
                }
            });
        }
    });
})();