//collecting automated test results
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { test: TK_DebugTest_file }
interface TK_DebugTest_file {
    testFull(inputs: {
        title?: string
        suspects?: any | any[]
    } & Omit<Parameters<LibraryFiles_file["loopFiles"]>[0], "execute">): void,
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

    const getChangeDetail = function TK_DebugTestFull_getChangeDetail(
        difference: EqualityDifference | string,
    ) {
        if (typeof difference === "string") {
            return "\n" + readErrorName(difference);
        }

        const path = (!(difference.path instanceof Array) || difference.path.length === 0)
            ? "value"
            : "." + difference.path.join(".");
        return [
            "\n > " + path + "\nis:", shortenData(difference.value),
            "\ninstead of:", shortenData(difference.shouldBe)];
    };

    const isDifferenceFailure = function TK_DebugTestFull_isDifferenceFailure(
        failure: any[]
    ) {
        return typeof failure[1] === "object" && failure[1].path instanceof Array;
    };

    const logFailure = function TK_DebugTestFull_logFailure(
        summaryName: string, result: TKTestResult
    ) {
        console.warn("\n" +
            colorText("negative",
                ">>  " + summaryName
                + "  >  " + result.errorSource
                + "  >  " + result.subject.name
                + "  >  \"" + result.name + "\"\n"
            ),
            ...shortenData(logFailureNice(result.errorMessage))
        );
    };

    const logFailureNice = function TK_DebugTestFull_logFailureNice(
        errorMessage: TKTestResult["errorMessage"]
    ) {
        if (!isDifferenceFailure(errorMessage)) {
            return (errorMessage instanceof Array)
                ? errorMessage
                : [errorMessage];
        }

        return [readErrorName(errorMessage[0])].concat(...errorMessage.slice(1).map(getChangeDetail));
    };

    const readErrorName = function (errorText: string) {
        return errorText.slice(0, errorText.lastIndexOf("~") + 1);
    };

    const summarizeFazitSync = function TK_DebugTestFull_summarizeFazitSync(inputs: {
        summary: TestSummary,
        timeInitial: number
    }) {
        const { summary } = inputs;
        const counts = {
            failures: summary.failures.length,
            suspects: summary.missingSuspects.size
        };
        return "\n" +
            colorText((counts.failures === 0) ? "positive" : "negative",
                ">>  " + summary.name + "  >  " + counts.failures + " Error" + (counts.failures === 1 ? "" : "s")
            )
            + "  /  "
            + colorText("positive",
                summary.testCount + " test groups"
            )
            + "  /  "
            + colorText("positive",
                "sync " + inputs.timeInitial + " ms"
            );
    };

    const summarizeFazit = function TK_DebugTestFull_summarizeFazit(inputs: {
        summary: TestSummary,
        timeInitial: number,
        timeFinal: number
    }) {
        const { summary } = inputs;
        const counts = {
            failures: summary.failures.length,
            suspects: summary.missingSuspects.size
        };
        return summarizeFazitSync(inputs) +
            colorText("positive",
                " + async " + inputs.timeFinal + " ms"
            )
            + "  /  "
            + colorText((counts.suspects === 0) ? "positive" : "negative",
                counts.suspects + " untested suspects"
            );
    };

    const logMissingSuspects = function TK_DebugTestFull_logMissingSuspects(summary: TestSummary) {
        const { missingSuspects } = summary;
        if (missingSuspects.size !== 0) {
            console.error("\n" +
                colorText("negative",
                    ">>  " + summary.name + " >> the following suspects have not been tested:"),
                Array.from(missingSuspects)
            );
        }
    };

    const omissionSignal = function TK_DebugTestFull_omissionSignal(
        omitted: string | any[]
    ) {
        return "[ ... " + omitted.length + " ... ]";
    };

    const shortenData = function TK_DebugTestFull_shortenValue(list: any) {
        return ToolKid.dataTypes.list.shorten({
            list,
            maxLength: (typeof list === "string" ? 200 : 30),
            omissionSignal
        });
    };

    publicExports.testFull = function TK_DebugTestFull_testFull(inputs) {
        const TKTest = ToolKid.debug.test;
        if (typeof inputs.title === "string") {
            TKTest.switchResultGroup(inputs.title);
        }
        const name = TKTest.getResultGroup().name;
        console.log(colorText("positive",
            "\n>>  testing " + name
        ));
        TKTest.setFailureHandler(
            logFailure.bind(null, name)
        );
        let timeStart = Date.now();
        ToolKid.nodeJS.loopFiles(Object.assign({}, inputs, { execute: require }));
        const timeInitial = Date.now() - timeStart;
        timeStart = Date.now();
        const summary = TKTest.getSummary({
            suspects: inputs.suspects,
            callback: function TK_DebugTestFull_testFullHandleSummary(summary) {
                // TODO: real test for .testFull
                summary.missingSuspects.delete(publicExports.testFull);
                const timeFinal = Date.now() - timeStart;
                logMissingSuspects(summary);
                console.log(summarizeFazit({ summary, timeInitial, timeFinal }));
            }
        });
        if (summary.pending.size !== 0) {
            console.log(
                summarizeFazitSync({ summary, timeInitial })
                + " ... waiting for at least " + summary.pending.size + " more tests"
            );
        }
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();