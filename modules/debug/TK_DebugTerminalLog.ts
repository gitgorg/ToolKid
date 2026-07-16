//more detailed console controls
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { terminal: TK_DebugTerminalLog_file }
interface TK_DebugTerminalLog_file {
    colorStrings(inputs: {
        colorName: TerminalColor,
        prefix?: string,
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
    const isClient = typeof document === "object";

    const publicExports = module.exports = <TK_DebugTerminalLog_file>{};

    const colorSignals = {
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



    const formatedValues = new Array(10);
    let formatedText: string | undefined;
    let colorCode: string;
    publicExports.colorStrings = function TK_DebugTerminalLog_colorStringsLoop(inputs) {
        colorCode = publicExports.getColorCode(<any>inputs.colorName);
        formatedText = <string | undefined>undefined;
        const values = inputs.values;
        let resultIndex = 0;
        let i = 0;
        if (typeof inputs.prefix === "string") {
            let prefix = colorCode + inputs.prefix;
            if (typeof values[0] === "string") {
                prefix += values[0];
                i = 1;
            }
            if (typeof values[i] !== "string" && isClient === false) {
                prefix += colorSignals.white;
            }
            formatedValues[0] = prefix;
            resultIndex = 1;
        }
        const length = values.length;
        let value: any;
        for (; i < length; i += 1) {
            value = values[i];
            if (typeof value === "string") {
                if (typeof formatedText === "string") {
                    formatedText += ", " + value;
                } else {
                    formatedText = (isClient === false)
                        ? colorCode + value // server can color multiple strings
                        : value; // client can only color first string
                }
            } else {
                if (formatedText !== undefined) {
                    formatedValues[resultIndex] = colorStringsFinish(formatedText)
                    formatedText = undefined;
                    resultIndex += 1;
                }
                formatedValues[resultIndex] = value;
                resultIndex += 1;
            }
        }
        if (formatedText !== undefined) {
            formatedValues[resultIndex] = colorStringsFinish(formatedText)
            resultIndex += 1;
        }
        return (isClient && resultIndex > 1)
            ? [formatedValues[0], formatedValues.slice(1, resultIndex)]
            : formatedValues.slice(0, resultIndex);
    };

    const colorStringsFinish = function TK_DebugTerminalLog_colorStringsFinish(
        unfinishedString: string,
    ) {
        if (isClient) {
            return unfinishedString;
        } else {
            return unfinishedString + colorSignals.white;
        }
    };

    let disableCount = 0;
    let originalConsoleLog: TK_DebugTerminalLog_file["logBasic"];
    let originalConsoleEror: TK_DebugTerminalLog_file["logError"];
    publicExports.disableLogs = function TK_DebugTerminalLog_disableLogs(amount) {
        console.log(
            ...publicExports.colorStrings({
                colorName: <"grey">typeColors.basic,
                prefix: getPrefix(">>  "),
                values: ["TK_DebugTerminalLog_disableLogs - " + amount]
            })
        );
        if (amount === false) {
            if (disableCount !== 0) {
                disableCount = 0;
                console.warn = originalConsoleLog;
                console.error = originalConsoleEror;
            }
            return;
        }

        if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
            throw ["TK_DebugTerminalLogs_disableLogs - amount hast to be an integer between 1 and 100"];
        }

        if (disableCount === 0) {
            originalConsoleLog = console.warn;
            originalConsoleEror = console.error;
            console.warn = disableLogsTick;
            console.error = disableLogsTick;
        }
        disableCount += amount;
    };

    const disableLogsTick = function TK_DebugTerminalLog_disableLogsTick() {
        disableCount -= 1;
        if (disableCount === 0) {
            console.warn = originalConsoleLog;
            console.error = originalConsoleEror;
        }
    };

    publicExports.getColorCode = function TK_DebugTerminalLog_getColorCode(name) {
        const code = colorSignals[name];
        if (code === undefined) {
            throw [
                "TK_DebugTerminalLog_getColorCode - unknown color:", name,
                " only the following colors are known:", Object.keys(colorSignals[<"white">typeColors.none])
            ];
        }
        return code;
    };

    const getPrefix = function TK_DebugTerminalLog_getPrefix(firstValue: any) {
        return (typeof firstValue === "string")
            ? ">>  " : ">>";
    };

    publicExports.logError = function TK_DebugTerminalLog_logError(...inputs) {
        console.error(
            ...publicExports.colorStrings({
                colorName: <"red">typeColors.error,
                prefix: getPrefix(inputs[0]),
                values: inputs
            })
        );
    };

    const logWithLevel = function TK_DebugTerminalLog_logWithLevel(
        type: "warning" | "important" | "basic",
        ...inputs: any[]
    ) {
        if (inputs.length === 0) {
            console.warn();
            return;
        }

        console.warn(
            ...publicExports.colorStrings({
                colorName: <"orange">typeColors[type],
                prefix: getPrefix(inputs[0]),
                values: inputs
            })
        );
    };

    publicExports.logWarning = logWithLevel.bind(null, "warning");

    publicExports.logImportant = logWithLevel.bind(null, "important");

    publicExports.logBasic = function TK_DebugTerminalLog_logWithLevel(
        ...inputs: any[]
    ) {
        if (inputs.length === 0) {
            console.log();
            return;
        }

        console.log(
            ...publicExports.colorStrings({
                colorName: <"white">typeColors.basic,
                prefix: getPrefix(inputs[0]),
                values: inputs
            })
        );
    };

    if (typeof process !== "undefined") {
        process.on(
            "unhandledRejection",
            function TK_DebugTerminalLog_catchPromiseRejection(reason, promise) {
                publicExports.logError("UNHANDLED PROMISE REJECTION");
                publicExports.logError(reason);
            }
        );
    }

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "terminal", entries: publicExports });
    }
})();