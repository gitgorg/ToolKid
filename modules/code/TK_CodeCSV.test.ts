(function TK_CodeCSV_test() {
    const { test } = ToolKid.debug.test;
    const { parse } = ToolKid.code.CSV;



    test({
        subject: parse,
        assert: {
            "CONFIG": {
                toleranceDepth: 3
            },
            "simple": [parse(`
                name, age, location
                ich, 20, hier
                du, 30, dort
                ihr, 140, hier
            `), [
                ["name", "age", "location"],
                ["ich", 20, "hier"],
                ["du", 30, "dort"],
                ["ihr", 140, "hier"],
            ]]
        }
    });
})();