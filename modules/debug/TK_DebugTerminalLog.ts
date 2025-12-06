//more detailed console controls
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { terminal: TK_DebugTerminalLog_file }
interface TK_DebugTerminalLog_file {
    colorStrings(inputs: {
        colorName: TerminalColor,
        values: any[]
    }): any[],
    getColorCode(
        colorName: TerminalColor,
    ): string,

    disableLogs(
        amount: number
    ): void,
    disableLogs(
        disableState: false
    ): void,
    logBasic(
        ...inputs: any[]
    ): void,
    logImportant(
        ...inputs: any[]
    ): void,
    logWarning(
        ...inputs: any[]
    ): void,
    logError(
        ...inputs: any[]
    ): void,
}

type TerminalColor = "blue" | "cyan" | "green" | "grey" | "magenta" | "orange" | "red" | "white"



(function TK_DebugTerminalLog_init() {
    const publicExports = module.exports = <TK_DebugTerminalLog_file>{};

    const colorsServer = {
        blue: "\u001b[94m",
        cyan: "\u001b[96m",
        green: "\u001b[32m",
        grey: "\u001b[90m",
        magenta: "\u001b[95m",
        orange: "\u001b[33m",
        red: "\u001b[31m",
        white: "\u001b[97m"
    };

    const typeColors = {
        error: "red",
        warning: "orange",
        important: "cyan",
        basic: "grey",
        none: "white"
    };



    publicExports.colorStrings = function TK_DebugTerminalLog_colorStringsLoop(inputs) {
        const passedInputs = {
            colorCode: publicExports.getColorCode(<any>inputs.colorName),
            result: <string[]>[],
            unfinishedString: undefined
        }
        inputs.values.forEach(colorStrings.bind(null, passedInputs));
        colorStringsFinish(passedInputs);
        return passedInputs.result;
    };

    const colorStrings = function (
        inputs: {
            colorCode: string,
            unfinishedString?: string,
            result: any[]
        }, value: any
    ) {
        if (typeof value === "string") {
            if (typeof inputs.unfinishedString === "string") {
                inputs.unfinishedString += value;
            } else {
                inputs.unfinishedString = inputs.colorCode + value;
            }
        } else {
            colorStringsFinish(inputs);
            inputs.result.push(value);
        }
    };

    const colorStringsFinish = function TK_DebugTerminalLog_colorStringsFinish(inputs: {
        unfinishedString?: string,
        result: any[]
    }) {
        if (typeof inputs.unfinishedString === "string") {
            inputs.result.push(inputs.unfinishedString + colorsServer.white);
            inputs.unfinishedString = undefined;
        }
    };

    let disableCount = 0;
    let originalLog: TK_DebugTerminalLog_file["logBasic"];
    publicExports.disableLogs = function TK_DebugTerminalLog_disableLogs(amount) {
        console.log(
            ...publicExports.colorStrings({
                colorName: "grey",
                values: ["TK_DebugTerminalLog_disableLogs - " + amount]
            })
        );
        if (amount === false) {
            if (disableCount !== 0) {
                disableCount = 0;
                console.warn = originalLog;
            }
            return;
        }

        if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
            throw ["TK_DebugTerminalLogs_disableLogs - amount hast to be an integer between 1 and 100"];
        }

        if (disableCount === 0) {
            originalLog = console.warn;
            console.warn = disableLogsTick;
        }
        disableCount += amount;
    };

    const disableLogsTick = function TK_DebugTerminalLog_disableLogsTick() {
        disableCount -= 1;
        if (disableCount === 0) {
            console.warn = originalLog;
        }
    };

    publicExports.getColorCode = function TK_DebugTerminalLog_getColorCode(name) {
        const code = colorsServer[name];
        if (code === undefined) {
            throw [
                "TK_DebugTerminalLog_getColorCode - unknown color:", name,
                " only the following colors are known:", Object.keys(colorsServer)
            ];
        }
        return code;
    };

    const getPrefix = function TK_DebugTerminalLog_getPrefix(inputs: any[]) {
        return (typeof inputs[0] === "string")
            ? ">>  " : ">>";
    };

    publicExports.logError = function TK_DebugTerminalLog_logError(...inputs) {
        console.error(
            ...publicExports.colorStrings({
                colorName: "red",
                values: [getPrefix(inputs), ...inputs]
            })
        );
    };

    const logWithLevel = function TK_DebugTerminalLog_logWithLevel(
        type: "warning" | "important" | "basic",
        ...inputs: any[]
    ) {
        console.warn(
            ...publicExports.colorStrings({
                colorName: <"orange">typeColors[type],
                values: [getPrefix(inputs), ...inputs]
            })
        );
    };

    publicExports.logWarning = logWithLevel.bind(null, "warning");

    publicExports.logImportant = logWithLevel.bind(null, "important");

    publicExports.logBasic = logWithLevel.bind(null, "basic");



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "terminal", entries: publicExports });
    }
})();