//collecting automated test results
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    testFull(inputs: {
        path: string | string[],
        include?: string | string[],
        exclude?: string | string[],
        title?: string
        suspects?: any | any[]
    }): void
}




(function TK_DebugTestFull_init() {



    const publicExports = module.exports = <TK_DebugTest_file>{};

    const colors = {
        positive: "\u001b[32m", default: "\u001b[97m", negative: "\u001b[31m"
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
        summary: TestSummary, result: TestResult
    ) {
        console.warn("\n" +
            colorText("negative",
                ">> " + summary.name + " >> \"" + result.name + "\" for " + result.subject.name
            ),
            ...logFailureNice(result.errorMessage).map(shortenValue)
        );
    };

    const logFailureNice = function TK_DebugTestFull_logFailureNice(
        failure: any[]
    ) {
        if (!isDifferenceFailure(failure)) {
            return (failure instanceof Array)
                ? failure
                : [failure];
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

    const logFazit = function TK_DebugTestFull_logFazit(inputs: {
        summary: TestSummary, timeInitial: number, timeFinal: number
    }) {
        const { summary } = inputs;
        const counts = {
            failures: summary.failures.length,
            suspects: summary.missingSuspects.size
        };
        const message = "\n" +
            colorText((counts.failures === 0) ? "positive" : "negative",
                ">> " + summary.name + " >> " + counts.failures + " Error" + (counts.failures === 1 ? "" : "s")
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
                "sync " + inputs.timeInitial + " ms + async " + inputs.timeFinal + " ms"
            );
        console.log(message);
    };

    const logMissingSuspects = function TK_DebugTestFull_logMissingSuspects(summary: TestSummary) {
        const { missingSuspects } = summary;
        if (missingSuspects.size !== 0) {
            console.error("\n" +
                colorText("negative",
                    ">> " + summary.name + " >> the following suspects have not been tested:"),
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

    const shortenValue = function TK_DebugTestFull_shortenValue(value: any) {
        if (typeof value === "string") {
            if (value.length > 200) {
                return value.slice(0, 100)
                    + ">>[...]<<"
                    + value.slice(-100)
                    + ">>total length:" + value.length + "<<";
            }
        } else if (value instanceof Array) {
            if (value.length > 50) {
                return [
                    ...value.slice(0, 20),
                    ">>[...]<<",
                    ...value.slice(-20),
                    ">>total length:" + value.length + "<<"
                ];
            }
        }
        return value;
    };

    publicExports.testFull = function TK_DebugTestFull_testFull(inputs) {
        if (typeof inputs.title === "string") {
            ToolKid.debug.test.switchResultGroup(inputs.title);
        }
        let timeStart = Date.now();
        ToolKid.nodeJS.loopFiles(Object.assign({}, inputs, {
            execute: require
        }));
        const timeInitial = Date.now() - timeStart;
        timeStart = Date.now();
        const summary = ToolKid.debug.test.getSummary({
            suspects: inputs.suspects,
            callback: function TK_DebugTestFull_testFullHandleSummary(summary) {
                // TODO: real test for .testFull
                summary.missingSuspects.delete(publicExports.testFull);
                const timeFinal = Date.now() - timeStart;
                logMissingSuspects(summary);
                summary.failures.forEach(logFailure.bind(null, summary));
                logFazit({ summary, timeInitial, timeFinal });
            }
        });
        if (summary.pending.size !== 0) {
            console.log("\n>> " + summary.name + " >> " + summary.testCount + " tests done in " + timeInitial + " ms / " + summary.pending.size + " tests pending");
        }
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();