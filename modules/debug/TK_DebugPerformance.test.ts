(function TK_DebugPerformance_test() {
    const { assert, shouldBeCloseTo, test } = ToolKid.debug.test;
    const { createClock } = ToolKid.debug.performance;


    const clock = createClock("a", "b");
    test({
        subject: createClock,
        execute: function basic() {
            clock.start("a");
            clock.stop("a");
            clock.start("b");
            clock.stop("b");
            assert({
                "CONFIG": {
                    toleranceDepth: 3,
                },
                "read": [clock.read(), {
                    counts: {
                        a: 1,
                        b: 1,
                    },
                    timeTotals: {
                        a: shouldBeCloseTo(10, 0),
                        b: shouldBeCloseTo(10, 0),
                    },
                }]
            });
        }
    });
})();