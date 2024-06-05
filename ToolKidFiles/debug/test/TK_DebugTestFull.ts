//collecting automated test results
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    testFull(inputs: {
        path: string | string[],
        include?: string | string[],
        exclude?: string | string[]
        //suspect?: any | any[]
    }): void
}




(function TK_DebugTestFull_init() {



    const publicExports = module.exports = <TK_DebugTest_file>{};

    const colors = {
        positive: "\u001b[32m", //green
        default: "\u001b[97m", //white
        negative: "\u001b[31m" //red
    };



    const colorText = function TK_DebugTestFull_colorString(
        color: "positive" | "negative",
        text: string
    ) {
        return colors[color] + text + colors.default;
    };

    const getChangeDetail = function TK_DebugTestFull_getChangeDetail(inputs: {
        data: Dictionary,
        inputMask(
            value: any
        ): { current: any, wanted: any }
    }) {
        const result = <any[]>[];
        Object.entries(inputs.data).forEach(function (entry) {
            const [key, value] = entry;
            const values = inputs.inputMask(value);
            result.push(
                "   proptery " + key + " is:", values.current, "   and should have been:", values.wanted
            );
        });
        return result;
    };

    const isDifferenceFailure = function TK_DebugTestFull_isDifferenceFailure(
        failure: any[]
    ) {
        return failure[failure.length - 2] === "difference:";
    };

    const logFailure = function TK_DebugTestFull_logFailure(
        result: TestResult
    ) {
        console.warn(
            colorText("negative",
                ">> failed test \"" + result.name + "\" for " + result.subject.name),
            logFailureNice(result.errorMessage)
        );
    };

    const logFailureNice = function TK_DebugTestFull_logFailureNice(
        failure: any[]
    ) {
        if (!isDifferenceFailure(failure)) {
            return failure;
        }

        const differences = failure[failure.length - 1];
        return [
            failure[0].slice(0, -9) + differences.count + " unwanted differences:",
            ...getChangeDetail({
                data: differences.changed, inputMask: masks.changed
            }),
            ...getChangeDetail({
                data: differences.onlyB, inputMask: masks.missing
            }),
            ...getChangeDetail({
                data: differences.onlyA, inputMask: masks.exceeding
            })
        ];
    };

    const logFazit = function TK_DebugTestFull_logFazit(summary: TestSummary) {
        const counts = {
            failures: summary.failures.length,
            suspects: summary.missingSuspects.size
        };
        const message =
            colorText((counts.failures === 0) ? "positive" : "negative",
                ">> " + counts.failures + " Error" + (counts.failures === 1 ? "" : "s")
            )
            + " / "
            + colorText("positive",
                summary.testCount + " test groups"
            )
            + " / "
            + colorText((counts.suspects === 0) ? "positive" : "negative",
                counts.suspects + " untested suspects"
            )
            + " / "
            + colorText("positive",
                summary.timeTotal + " milliseconds"
            );
        console.warn(message);
    };

    const logMissingSuspects = function TK_DebugTestFull_logMissingSuspects(summary: TestSummary) {
        const { missingSuspects } = summary;
        if (missingSuspects.size !== 0) {
            console.error(
                colorText("negative",
                    ">> the following suspects have not been tested:"),
                Array.from(missingSuspects)
            );
        }
    };

    const masks = {
        changed: function (value: [current: any, wanted: any]) {
            return { current: value[0], wanted: value[1] }
        },
        missing: function (
            value: any
        ) {
            return { current: undefined, wanted: value }
        },
        exceeding: function (value: any) {
            return { current: value, wanted: undefined }
        }
    };

    publicExports.testFull = function TK_DebugTestFull_testFull(inputs) {
        ToolKid.debug.test.clearSummaryState();
        ToolKid.nodeJS.loopFiles(Object.assign({}, inputs, {
            execute: require
        }));
        log(777,inputs);
        const summary = ToolKid.debug.test.getSummary(function(summary){
            logMissingSuspects(summary);
            summary.failures.forEach(logFailure);
            logFazit(summary);
        });
        if (summary.pending.size !== 0) {
            console.log(">> " + summary.pending.size + " tests pending");
        }
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();