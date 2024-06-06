"use strict";
(function ToolKid_init () {
const registeredFiles = {};


(function Library_init() {
    let LibraryTools;
    const publicExports = module.exports = {};
    const addAsReadOnly = function Library_addAsReadOnly(inputs) {
        Object.defineProperty(inputs.container, inputs.name, {
            enumerable: true,
            value: inputs.property,
            writable: false
        });
    };
    const addAsReadOnlyHidden = function Library_addAsReadOnlyHidden(inputs) {
        Object.defineProperty(inputs.container, inputs.name, {
            enumerable: false,
            value: inputs.property,
            writable: false
        });
    };
    publicExports.createInstance = function Library_createInstance() {
        const result = {};
        const registerWithContext = registerFunction.bind(null, result);
        addAsReadOnlyHidden({
            container: result,
            name: "registerFunction",
            property: registerWithContext
        });
        return result;
    };
    const isValidInput = function Library_isValidInput(inputs) {
        return (typeof inputs.name !== "string"
            || typeof inputs.helperFunction !== "function");
    };
    publicExports.getTools = function Library_getTools() {
        if (LibraryTools === undefined) {
            LibraryTools = require("./LibraryTools");
        }
        return LibraryTools;
    };
    const printRegisterError = function Library_printRegisterError(inputs) {
        console.error(["Library_registerHelperToSection - invalid inputs:", inputs]);
    };
    const registerFunction = function Library_registerFunction(library, inputs) {
        let section = registerSection({
            container: library,
            name: inputs.section
        });
        if (inputs.subSection !== undefined) {
            section = registerSection({
                container: section,
                name: inputs.subSection
            });
        }
        registerHelperToSectionLoop({
            section: section,
            helpers: inputs.functions
        });
    };
    const registerHelperToSectionLoop = function Library_registerHelperToSectionLoop(inputs) {
        const { section, helpers } = inputs;
        for (let name in helpers) {
            registerHelperToSection({
                section, name, helperFunction: helpers[name]
            });
        }
    };
    const registerHelperToSection = function Library_registerHelperToSection(inputs) {
        if (isValidInput(inputs)) {
            printRegisterError(inputs);
            return;
        }
        addAsReadOnly({
            container: inputs.section,
            name: inputs.name,
            property: inputs.helperFunction
        });
    };
    const registerSection = function Library_registerSection(inputs) {
        let section = inputs.container[inputs.name];
        if (section !== undefined) {
            return section;
        }
        section = {};
        addAsReadOnly({
            container: inputs.container,
            name: inputs.name,
            property: section
        });
        return section;
    };
    global.ToolKid = publicExports.createInstance();
})();
registeredFiles["Library.js"] = module.exports;

(function TK_ConnectionHTTPinit() {
    const publicExports = module.exports = {};
    publicExports.request = function TK_ConnectionHTTPRequest(inputs) {
        const chosenFetch = (inputs.post === undefined)
            ? fetchGET : fetchPOST;
        return chosenFetch(inputs).then(requestParse.bind(null, inputs), requestFailed.bind(null, {
            inputs,
            type: "connection"
        }));
    };
    const fetchGET = function TK_ConnectionHTTPfetchGET(inputs) {
        return fetch(inputs.URL, {
            method: "GET",
            headers: inputs.headers
        });
    };
    const fetchPOST = function TK_ConnectionHTTPfetchPOST(inputs) {
        return fetch(inputs.URL, {
            method: "POST",
            mode: "cors",
            headers: Object.assign({
                "Content-Type": "application/json",
            }, inputs.headers),
            body: inputs.post
        });
    };
    const requestParse = function TK_ConnectionHTTPRequestParse(inputs, response) {
        if (!response.ok || response.status < 200 || response.status >= 300) {
            return requestFailed({
                inputs,
                type: "status"
            }, response.status);
        }
        const contentType = response.headers.get("content-type");
        const chosenParser = (contentType.indexOf("application/json") !== -1)
            ? "json"
            : "text";
        return response[chosenParser]().then(requestRespond.bind(null, inputs), requestFailed.bind(null, {
            inputs,
            type: "parsing"
        }));
    };
    const requestRespond = function TK_ConnectionHTTPRequestRespond(inputs, response) {
        if (typeof inputs.callback === "function") {
            try {
                inputs.callback(response);
            }
            catch (error) {
                return requestFailed({
                    inputs,
                    type: "callback"
                }, error);
            }
        }
        return response;
    };
    const errorInfos = {
        callback: "callback did fail",
        connection: "request could not be sent",
        status: "response status is not ok",
        parsing: "response is malformed"
    };
    const requestFailed = function TK_ConnectionHTTPRequestFailed(bound, detail) {
        const error = Error("TK_ConnectionHTTPRequest - " + errorInfos[bound.type] + ".");
        error.cause = {
            detail,
            inputs: bound.inputs
        };
        if (typeof bound.inputs.errorHandler === "function") {
            bound.inputs.errorHandler(error);
            return error;
        }
        else {
            throw error;
        }
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "connection", subSection: "HTTP", functions: publicExports });
    }
})();
registeredFiles["TK_ConnectionHTTP.js"] = module.exports;

(function TK_ConnectionHTTPFormats_init() {
    const publicExports = module.exports = {};
    publicExports.readMediaType = function TK_ConnectionHTTPFormats_readMediaType(path) {
        path = path.slice(path.lastIndexOf(".") + 1).toLocaleLowerCase();
        return mediaTypes[path];
    };
    const mediaTypes = {
        //audio
        mp3: "audio/mpeg3",
        wav: "audio/wave",
        //font
        eot: "application/vnd.ms-fontobject",
        otf: "font/otf",
        ttf: "font/ttf",
        woff: "font/woff",
        woff2: "font/woff2",
        //image
        gif: "image/gif",
        ico: "image/x-icon",
        jpeg: "image/jpeg",
        jpg: "image/jpeg",
        png: "image/png",
        //text
        cdw: "text/cowdarewelsh",
        css: "text/css",
        htm: "text/html",
        html: "text/html",
        js: "text/javascript",
        json: "application/json",
        mjs: "text/javascript",
        //video
        mp4: "video/mp4",
        ogg: "video/ogg",
        webm: "video/webm"
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "connection", subSection: "HTTP", functions: publicExports });
    }
})();
registeredFiles["TK_ConnectionHTTPFormats.js"] = module.exports;

(function TK_DebugTerminalLog_init() {
    const publicExports = module.exports = {};
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
            colorCode: publicExports.getColorCode(inputs.colorName),
            result: [],
            unfinishedString: undefined
        };
        inputs.values.forEach(colorStrings.bind(null, passedInputs));
        colorStringsFinish(passedInputs);
        return passedInputs.result;
    };
    const colorStrings = function (inputs, value) {
        if (typeof value === "string") {
            if (typeof inputs.unfinishedString === "string") {
                inputs.unfinishedString += value;
            }
            else {
                inputs.unfinishedString = inputs.colorCode + value;
            }
        }
        else {
            colorStringsFinish(inputs);
            inputs.result.push(value);
        }
    };
    const colorStringsFinish = function TK_DebugTerminalLog_colorStringsFinish(inputs) {
        if (typeof inputs.unfinishedString === "string") {
            inputs.result.push(inputs.unfinishedString + colorsServer.white);
            inputs.unfinishedString = undefined;
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
    const getPrefix = function TK_DebugTerminalLog_getPrefix(inputs) {
        return (typeof inputs[0] === "string")
            ? ">> " : ">>";
    };
    publicExports.logError = function TK_DebugTerminalLog_logError(...inputs) {
        console.error(...publicExports.colorStrings({
            colorName: "red",
            values: [getPrefix(inputs), ...inputs]
        }));
    };
    const logWithLevel = function TK_DebugTerminalLog_logWithLevel(type, ...inputs) {
        console.warn(...publicExports.colorStrings({
            colorName: typeColors[type],
            values: [getPrefix(inputs), ...inputs]
        }));
    };
    publicExports.logWarning = logWithLevel.bind(null, "warning");
    publicExports.logImportant = logWithLevel.bind(null, "important");
    publicExports.logBasic = logWithLevel.bind(null, "basic");
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "terminal", functions: publicExports });
    }
})();
registeredFiles["TK_DebugTerminalLog.js"] = module.exports;

(function TK_DebugTestResults_init() {
    let timeStart = Date.now();
    let testResults = [];
    let testSuspects = new Set();
    const publicExports = module.exports = {};
    const beautifyErrorMessage = function TK_DebugTestResults_beautifyErrorMessage(testResult) {
        const message = testResult.errorMessage;
        const length = message.length;
        if (message[length - 2] !== "~details~") {
            return testResult;
        }
        const subMessages = [];
        const difference = message[length - 1];
        let part = difference.onlyA;
        if (Object.keys(part).length !== 0) { //extensive properties
            subMessages.push(["unwanted properties: ", part]);
        }
        part = difference.onlyB;
        if (Object.keys(part).length !== 0) { //missing properties
            subMessages.push(["missing properties: ", part]);
        }
        Object.entries(difference.changed).forEach(function (keyAndValues) {
            subMessages.push([
                "   property " + keyAndValues[0] + "is :",
                keyAndValues[1][0],
                "   and should have been:",
                keyAndValues[1][1]
            ]);
        }, difference.changed);
        return Object.assign({}, testResult, {
            errorMessage: [...message.slice(0, -2), "~ details ~", ...subMessages]
        });
    };
    publicExports.clearSummaryState = function TK_DebugTestResults_clearSummaryState(inputs = {}) {
        timeStart = Date.now();
        testResults = [];
        if (inputs.clearSuspects === true) {
            testSuspects = new Set();
        }
    };
    const getAllMethods = function TK_DebugTestResults_getAllMethods(data) {
        const result = [];
        if (typeof data === "function") {
            result[0] = data;
        }
        else if (typeof data !== "object" || data === null) {
            return result;
        }
        Object.values(data).forEach(function (value) {
            result.push(...getAllMethods(value));
        });
        return result;
    };
    publicExports.getSummary = function TK_DebugTestResults_getSummary(callback) {
        const result = {
            testCount: testResults.length,
            timeTotal: 0,
            successes: new Map(),
            failures: [],
            pending: new Set(),
            missingSuspects: new Set(testSuspects),
            callback
        };
        testResults.forEach(summaryRegisterResult.bind(null, result));
        if (result.pending.size === 0) {
            getSummaryFinal(result);
        }
        return result;
    };
    const getSummaryFinal = function TK_DebugTestResults_getSummaryFinal(summary) {
        summary.timeTotal = Date.now() - timeStart;
        const { callback } = summary;
        if (typeof callback === "function") {
            delete summary.callback;
            callback(summary);
        }
    };
    const getSuspects = function TK_DebugTestResults_getSuspects(inputs) {
        if (inputs.mode === "allMethods") {
            return getAllMethods(inputs.suspect);
        }
        else {
            return inputs.suspect;
        }
        ;
    };
    publicExports.loadSummaryState = function TK_DebugTestResults_loadSummaryState(stateID) {
        ({ timeStart, testResults, testSuspects } = summaryHistory[stateID]);
    };
    const isSuspectConfig = function TK_DebugTestResults_issuspectConfig(inputs) {
        return typeof inputs === "object" && inputs.suspect !== undefined && typeof inputs.mode === "string";
    };
    const summaryRegisterResult = function TK_DebugTest_summaryRegisterResults(summary, testResult) {
        if (testResult instanceof Promise) {
            summary.pending.add(testResult);
            testResult.then(function (result) {
                summary.pending.delete(testResult);
                summaryRegisterResult(summary, result);
                if (summary.pending.size === 0) {
                    getSummaryFinal(summary);
                }
            });
            return;
        }
        summary.missingSuspects.delete(testResult.subject);
        if (testResult.errorMessage !== undefined) {
            summary.failures.push(beautifyErrorMessage(testResult));
        }
        else {
            summaryRegisterSuccess({
                list: summary.successes, testResult
            });
        }
    };
    const summaryRegisterSuccess = function TK_DebugTest_summaryRegisterSuccess(inputs) {
        const { testResult } = inputs;
        const subjectDetails = inputs.list.get(testResult.subject);
        const data = {
            name: testResult.name,
            time: testResult.time
        };
        if (subjectDetails === undefined) {
            inputs.list.set(testResult.subject, [data]);
        }
        else {
            subjectDetails.push(data);
        }
    };
    publicExports.registerTestResult = function TK_DebugTestResults_registerTestResult(...results) {
        testResults.push(...results);
    };
    publicExports.registerTestSuspect = function TK_DebugTestResults_registerTestSuspectLoop(...inputs) {
        if (inputs.length === 1 && isSuspectConfig(inputs[0])) {
            inputs = getSuspects(inputs[0]);
        }
        inputs.forEach(testSuspects.add.bind(testSuspects));
    };
    const summaryHistory = [];
    publicExports.saveSummaryState = function TK_DebugTestResults_saveSummaryState() {
        const state = {
            timeStart,
            testResults: testResults.slice(0),
            testSuspects: new Set(testSuspects)
        };
        summaryHistory.push(state);
        return summaryHistory.length - 1;
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();
registeredFiles["TK_DebugTestResults.js"] = module.exports;

(function TK_DebugTest_init() {
    const { registerTestResult } = registeredFiles["TK_DebugTestResults.js"];
    const publicExports = module.exports = {};
    const createResultBase = function TK_DebugTest_createResultBase(config) {
        return {
            subject: config.subject,
            name: config.execute.name,
            time: 0
        };
    };
    const isObjectWithExecute = function TK_DebutTest_isObjectWithExecute(value) {
        return typeof value === "object"
            && value !== null
            && typeof value.execute === "function";
    };
    const isValidSubject = function TK_DebugTest_isValidSubject(subject) {
        if (typeof subject === "function") {
            return subject.name.length !== 0;
        }
        else {
            return typeof subject === "string" && subject.length !== 0;
        }
    };
    publicExports.test = function TK_DebugTest_testInterface(...inputs) {
        if (inputs.length === 0) {
            throw ["TK_DebugTest_test - no config received"];
        }
        const testResults = inputs.map(testSingle);
        registerTestResult(...testResults);
        return testResults;
    };
    const testSingle = function TK_DebugTest_testSingle(config) {
        if (!isObjectWithExecute(config)
            || !isValidSubject(config.subject)) {
            throw ["TK_DebugTest_test - invalid config:", config];
        }
        const testResult = createResultBase(config);
        return testExecute({ config, result: testResult });
    };
    const testExecute = function Test_testExecute(inputs) {
        const { result } = inputs;
        const startTime = Date.now();
        try {
            const returned = inputs.config.execute();
            if (returned instanceof Promise) {
                return testWatchPromise({
                    result, startTime, promise: returned
                });
            }
        }
        catch (error) {
            result.errorMessage = error;
        }
        result.time = Date.now() - startTime;
        return result;
    };
    const testWatchPromise = function TK_DebugTest_testWatchPromise(inputs) {
        const { result } = inputs;
        let resolver;
        const promise = new Promise(function (resolve) {
            resolver = resolve;
        });
        const bound = { result, startTime: inputs.startTime, resolver };
        inputs.promise.then(testPromiseSuccess.bind(null, bound), testPromiseFailure.bind(null, bound));
        return promise;
    };
    const testPromiseSuccess = function TK_DebugTest_testPromiseSuccess(bound) {
        bound.result.time = Date.now() - bound.startTime;
        bound.resolver(bound.result);
    };
    const testPromiseFailure = function TK_DebugTest_testPromiseFailure(bound, reason) {
        bound.result.errorMessage = reason;
        bound.result.time = Date.now() - bound.startTime;
        if (reason === undefined) {
            reason = "Unspecified Error";
        }
        bound.result.errorMessage = reason;
        bound.resolver(bound.result);
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();
registeredFiles["TK_DebugTest.js"] = module.exports;

(function TK_DebugTestAssertions_init() {
    const publicExports = module.exports = {};
    publicExports.assertEquality = function TK_DebugTestAssertions_assertEqualityLoop(...inputs) {
        if (inputs.length === 1) {
            const firstInputs = inputs[0];
            if (firstInputs.name === undefined) {
                assertEqualityMode2(firstInputs);
                return;
            }
        }
        inputs.forEach(assertEquality);
    };
    const assertEqualityMode2 = function TK_DebugTestAssertions_testForEquealityMode2(inputs) {
        Object.entries(inputs).forEach(function (keyValue) {
            const reworked = Object.assign({}, keyValue[1], { name: keyValue[0] });
            assertEquality(reworked);
        });
    };
    const assertEquality = function TK_DebugTestAssertions_assertEquality(inputs) {
        const { value, shouldBe } = inputs;
        if (isIdentical(value, shouldBe)) {
            return;
        }
        else if (isDifferentAndSimple(value, shouldBe)) {
            throw report({
                name: inputs.name,
                message: ["value is:", inputs.value, "but should be equal to:", inputs.shouldBe]
            });
        }
        else if (inputs.toleranceDepth === 0) {
            throw report({
                name: inputs.name,
                message: ["value is:", inputs.value, "but should be identical with:", inputs.shouldBe]
            });
        }
        assertEqualityDeep({
            inputs,
            toleranceDepth: inputs.toleranceDepth || 1
        });
    };
    const assertEqualityDeep = function TK_DebugTestAssertions_assertEqualityDeep(inputs) {
        const difference = ToolKid.object.compareDeep(inputs.inputs.value, inputs.inputs.shouldBe);
        if (difference.count !== 0) {
            throw report({
                name: inputs.inputs.name,
                message: ["value is:", inputs.inputs.value, "but should be equal to:", inputs.inputs.shouldBe, "difference:", difference]
            });
        }
    };
    publicExports.assertFailure = function TK_DebugTestAssertions_assertFailure(...inputs) {
        const promisedResults = inputs
            .map(assertFailureSingle)
            .filter(isPromised);
        if (promisedResults.length === 0) {
            return;
        }
        let rejecter, resolver;
        const resultPromise = new Promise(function (resolve, reject) {
            rejecter = reject;
            resolver = resolve;
        });
        promisedResults.forEach(assertFailureWatchPromise.bind(null, {
            count: promisedResults.length,
            rejecter,
            resolver
        }));
        return resultPromise;
    };
    const assertFailureWatchPromise = function (bound, inputs) {
        inputs.promise.then(function (reason) {
            bound.rejecter(report({
                name: inputs.inputs.name,
                message: ["promise did not reject as expected"]
            }));
        }, function (reason) {
            const failureMessage = assertFailureCheck(inputs.inputs, reason);
            if (failureMessage !== undefined) {
                bound.rejecter(failureMessage);
            }
            bound.count -= 1;
            if (bound.count === 0) {
                bound.resolver();
            }
        });
    };
    const assertFailureSingle = function UnitTest_assertFailureSingle(inputs) {
        if (inputs.execute instanceof Promise) {
            return {
                inputs,
                promise: inputs.execute
            };
        }
        else if (typeof inputs.execute !== "function") {
            throw report({
                name: inputs.name,
                message: ["execute is not a function, instead is:", inputs.execute]
            });
        }
        try {
            const returned = assertFailureExecute({
                execute: inputs.execute,
                withInputs: inputs.withInputs
            });
            if (returned instanceof Promise) {
                return {
                    inputs,
                    promise: returned
                };
            }
        }
        catch (error) {
            const failureMessage = assertFailureCheck(inputs, error);
            if (failureMessage !== undefined) {
                throw failureMessage;
            }
            return;
        }
        throw report({
            name: inputs.name,
            message: ["and did not fail as expected"]
        });
    };
    const assertFailureExecute = function TK_DebugTest_assertFailure(inputs) {
        const { withInputs } = inputs;
        if (withInputs === undefined) {
            return inputs.execute();
        }
        else if (withInputs instanceof Array) {
            return inputs.execute(...withInputs);
        }
        else {
            return inputs.execute(withInputs);
        }
    };
    const assertFailureCheck = function (bound, error) {
        if (bound.shouldThrow === undefined) {
            return;
        }
        return assertFailureError({
            name: bound.name,
            error,
            shouldThrow: bound.shouldThrow
        });
    };
    const assertFailureError = function TK_DebugTestAssertions_assertFailureError(inputs) {
        const { error, shouldThrow } = inputs;
        if (shouldThrow === Error) {
            if (!(error instanceof Error)) {
                return report({
                    name: inputs.name,
                    message: ["did not throw an error-object but threw:", error]
                });
            }
        }
        else {
            if (shouldThrow === error) {
                return;
            }
            if (typeof shouldThrow !== "object" || typeof error !== "object") {
                return report({
                    name: inputs.name,
                    message: [
                        "did not throw expected message. threw:", error,
                        "  instead of:", shouldThrow
                    ]
                });
            }
            const difference = ToolKid.object.compareDeep(error, shouldThrow);
            if (difference.count !== 0) {
                return report({
                    name: inputs.name,
                    message: ["did not throw expected message. threw:", error, "~details~", difference]
                });
            }
        }
        return undefined;
    };
    publicExports.createPromise = function TK_DebugTestAssertions_createPromise(inputs) {
        const result = createPromiseControllable();
        if (inputs === undefined) {
            return result;
        }
        if (typeof inputs === "number") {
            inputs = [inputs, "timeout"];
        }
        else if (!(inputs instanceof Array)) {
            return result;
        }
        watchPromiseDuration({
            duration: inputs[0],
            reason: inputs[1],
            promise: result
        });
        return result;
    };
    const createPromiseControllable = function TK_DebugTestAssertions_createPromiseControllable() {
        let resolve, reject;
        const result = new Promise(function createPromise_setup(resolveFunction, rejectFunction) {
            resolve = function TK_DebugTestAssertions_PromiseResolve(value) {
                result.done = true;
                resolveFunction(value);
            };
            reject = function TK_DebugTestAssertions_PromiseReject(reason) {
                result.done = true;
                rejectFunction(reason);
            };
        });
        result.resolve = resolve;
        result.reject = reject;
        return result;
    };
    const isDifferentAndSimple = function TK_DebugTestAssertions_isDifferentAndSimple(valueA, valueB) {
        return typeof valueA !== typeof valueB
            || !isList(valueA);
    };
    const isIdentical = function TK_DebugTestAssertions_isIdentical(valueA, valueB) {
        return valueA === valueB
            || (Number.isNaN(valueB) && Number.isNaN(valueA));
    };
    const isList = function TK_DebugTestAssertions_isList(value) {
        return typeof value === "object" && value !== null || typeof value === "function";
    };
    const isPromised = function (inputs) {
        return inputs !== undefined && inputs.promise instanceof Promise;
    };
    const report = function TK_DebugTestAssertions_report(inputs) {
        const { message } = inputs;
        return [
            "~ " + inputs.name + " ~ " + message[0],
            ...message.slice(1)
        ];
    };
    const watchPromiseDuration = function TK_DEBUG_TestAssertions_watchPromiseDuration(inputs) {
        setTimeout(function TK_DEBUG_TestAssertions_watchPromiseDurationCheck() {
            if (inputs.promise.done !== true) {
                inputs.promise.reject(inputs.reason);
            }
        }, inputs.duration);
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();
registeredFiles["TK_DebugTestAssertions.js"] = module.exports;

(function TK_DebugTestFull_init() {
    const publicExports = module.exports = {};
    const colors = {
        positive: "\u001b[32m",
        default: "\u001b[97m",
        negative: "\u001b[31m" //red
    };
    const colorText = function TK_DebugTestFull_colorString(color, text) {
        return colors[color] + text + colors.default;
    };
    const getChangeDetail = function TK_DebugTestFull_getChangeDetail(inputs) {
        const result = [];
        Object.entries(inputs.data).forEach(function (entry) {
            const [key, value] = entry;
            const values = inputs.inputMask(value);
            result.push("   proptery " + key + " is:", values.current, "   and should have been:", values.wanted);
        });
        return result;
    };
    const isDifferenceFailure = function TK_DebugTestFull_isDifferenceFailure(failure) {
        return failure[failure.length - 2] === "difference:";
    };
    const logFailure = function TK_DebugTestFull_logFailure(result) {
        console.warn(colorText("negative", ">> failed test \"" + result.name + "\" for " + result.subject.name), logFailureNice(result.errorMessage));
    };
    const logFailureNice = function TK_DebugTestFull_logFailureNice(failure) {
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
    const logFazit = function TK_DebugTestFull_logFazit(summary) {
        const counts = {
            failures: summary.failures.length,
            suspects: summary.missingSuspects.size
        };
        const message = colorText((counts.failures === 0) ? "positive" : "negative", ">> " + counts.failures + " Error" + (counts.failures === 1 ? "" : "s"))
            + " / "
            + colorText("positive", summary.testCount + " test groups")
            + " / "
            + colorText((counts.suspects === 0) ? "positive" : "negative", counts.suspects + " untested suspects")
            + " / "
            + colorText("positive", summary.timeTotal + " milliseconds");
        console.warn(message);
    };
    const logMissingSuspects = function TK_DebugTestFull_logMissingSuspects(summary) {
        const { missingSuspects } = summary;
        if (missingSuspects.size !== 0) {
            console.error(colorText("negative", ">> the following suspects have not been tested:"), Array.from(missingSuspects));
        }
    };
    const masks = {
        changed: function (value) {
            return { current: value[0], wanted: value[1] };
        },
        missing: function (value) {
            return { current: undefined, wanted: value };
        },
        exceeding: function (value) {
            return { current: value, wanted: undefined };
        }
    };
    publicExports.testFull = function TK_DebugTestFull_testFull(inputs) {
        ToolKid.debug.test.clearSummaryState();
        ToolKid.nodeJS.loopFiles(Object.assign({}, inputs, {
            execute: require
        }));
        const summary = ToolKid.debug.test.getSummary(function (summary) {
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
registeredFiles["TK_DebugTestFull.js"] = module.exports;

(function RS_h_object_init() {
    const publicExports = module.exports = {};
    publicExports.compareDeep = function RS_helpers_object_compareDeep(objA = {}, objB = {}) {
        const result = {
            count: 0, changed: {}, onlyA: {}, onlyB: Object.assign({}, objB)
        };
        Object.keys(objA).forEach(compareDeepSub.bind(null, result, objA, objB));
        result.count += Object.keys(result.onlyB).length;
        return result;
    };
    const compareDeepSub = function RS_helpers_object_compareDeepSub(result, objA, objB, key) {
        delete result.onlyB[key];
        const valA = objA[key];
        const valB = objB[key];
        if (valA === valB || (Number.isNaN(valA) && Number.isNaN(valB))) {
            return;
        }
        if (valB === undefined) {
            result.count += 1;
            result.onlyA[key] = valA;
            return;
        }
        else if (typeof valA !== typeof valB || typeof valA !== "object" || valA === null || valB === null) {
            result.count += 1;
            result.changed[key] = [valA, valB];
            return;
        }
        const subs = publicExports.compareDeep(valA, valB);
        if (subs.count === 0) {
            return;
        }
        Object.entries(subs.onlyA).forEach(function (data) {
            result.count += 1;
            result.onlyA[key + "." + data[0]] = data[1];
        });
        Object.entries(subs.onlyB).forEach(function (data) {
            result.onlyB[key + "." + data[0]] = data[1];
        });
        Object.entries(subs.changed).forEach(function (data) {
            result.count += 1;
            result.changed[key + "." + data[0]] = data[1];
        });
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "object", functions: publicExports });
    }
})();
registeredFiles["h_objectCompare.js"] = module.exports;

(function TK_nodeJSDirectory_init() {
    const { readdirSync: readDirectory, existsSync: isUsedPath } = require("fs");
    const { resolve: resolvePath } = require("path");
    const publicExports = module.exports = {};
    publicExports.loopDirectory = function TK_nodeJSDirectory_loopDirectorySetup(inputs) {
        const { path } = inputs;
        if (path instanceof Array) {
            path.forEach(loopDirectoryLayer.bind(null, inputs.execute));
        }
        else {
            loopDirectoryLayer(inputs.execute, path);
        }
    };
    const loopDirectoryLayer = function TK_nodeJSDirectory_loopDirectoryLayer(execute, root) {
        const files = publicExports.readDirectory(root);
        let isDir;
        let path;
        const { isDirectory } = ToolKid.nodeJS;
        files.forEach(function (name) {
            path = resolvePath(root, name);
            isDir = isDirectory(path);
            execute({
                name, root, path, isDirectory: isDir
            });
            if (isDir) {
                loopDirectoryLayer(execute, path);
            }
        });
    };
    publicExports.readDirectory = function TK_nodeJSDirectory_readDirectory(path) {
        path = resolvePath(path);
        if (!isUsedPath(path)) {
            return [];
        }
        else if (!ToolKid.nodeJS.isDirectory(path)) {
            throw ["TK_nodeJSDirectory_read - path is a file, not a directory:", path];
        }
        return readDirectory(path);
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "nodeJS", functions: publicExports });
    }
})();
registeredFiles["TK_NodeJSDirectory.js"] = module.exports;

(function TK_nodeJSFile_init() {
    const { existsSync: isUsedPath, readFileSync: readFile } = require("fs");
    const { resolve: resolvePath } = require("path");
    const publicExports = module.exports = {};
    publicExports.readFile = function TK_nodeJSFile_read(inputs) {
        let { path, checkExistance, encoding } = inputs;
        path = resolvePath(path);
        if (checkExistance !== false) {
            if (!isUsedPath(path)) {
                return undefined;
            }
            else if (ToolKid.nodeJS.isDirectory(path)) {
                throw ["TK_nodeJSFile_read - path is a directory, not a file:", path];
            }
        }
        if (typeof encoding !== "string") {
            const type = ToolKid.connection.HTTP.readMediaType(path);
            if (type === undefined || type === "application/json" || type.slice(0, 5) === "text/") {
                encoding = "utf8";
            }
        }
        return {
            encoding: encoding || "dictionary",
            content: readFile(path, encoding)
        };
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "nodeJS", functions: publicExports });
    }
})();
registeredFiles["TK_NodeJSFile.js"] = module.exports;

(function TK_nodeJSPath_init() {
    const FS = require("fs");
    const Path = require("path");
    const publicExports = module.exports = {};
    publicExports.isDirectory = function TK_nodeJSPath_file_isDirectory(path) {
        return FS.lstatSync(path).isDirectory();
    };
    publicExports.isUsedPath = function TK_nodeJSPath_file_isUsedPath(path) {
        return FS.existsSync(path);
    };
    publicExports.resolvePath = function TK_nodeJSPath_file_resolvePath(...path) {
        return Path.resolve(...path);
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "nodeJS", functions: publicExports });
    }
})();
registeredFiles["TK_NodeJSPath.js"] = module.exports;

(function T_pathList_init() {
    const root = "ToolKidFiles/nodeJS/";
    module.exports = {
        directoryMixedContents: root + "T_fileDirectory",
        directoryEmpty: root + "T_fileDirectory/T_empty",
        directoryNonExisting: root + "T_nonExistant",
        file: root + "T_fileDirectory/T_file.json",
        fileEmpty: root + "T_fileDirectory/T_empty.txt",
        fileNonExisting: root + "T_fileDirectory/T_nonExistant.json",
        fileTypeScript: root + "T_fileDirectory/T_pathList.ts"
    };
})();
registeredFiles["T_pathList.js"] = module.exports;

(function LibraryTools_init() {
    const FS = require("fs");
    const { existsSync: isUsedPath, lstatSync: readPathStats, readdirSync: readDirectory } = FS;
    const Path = require("path");
    const { normalize, resolve: resolvePath } = Path;
    const publicExports = module.exports = {};
    publicExports.easyExpression = function LibrarBuilder_easyExpression(expression) {
        expression = expression.replaceAll("\\", "\\\\");
        expression = expression.replaceAll(".", "\\.");
        expression = expression.replaceAll("\*", ".+");
        return new RegExp("^" + expression + "$");
    };
    const isDirectory = function TK_LibraryTools_file_isDirectory(path) {
        return readPathStats(path).isDirectory();
    };
    const isIncluded = function LibraryTools_isIncluded(privateData, path) {
        const test = testPath.bind(null, path);
        return (privateData.include.length === 0
            || privateData.include.find(test) !== undefined) && privateData.exclude.find(test) === undefined;
    };
    publicExports.loopFiles = function LibraryTools_loopFiles(inputs) {
        const pathChecker = isIncluded.bind(null, {
            include: toRegExp(inputs.include || []),
            exclude: toRegExp(inputs.exclude || []),
        });
        const privateData = {
            isIncluded: pathChecker,
            execute: inputs.execute
        };
        const { path } = inputs;
        if (path instanceof Array) {
            path.forEach(loopFilesFrom.bind(null, privateData));
        }
        else {
            loopFilesFrom(privateData, path);
        }
    };
    const testPath = function LibraryTools_testPath(path, expression) {
        return expression.test(path);
    };
    const loopFilesFrom = function LibraryTools_loopFilesFrom(privateData, path) {
        path = resolvePath(path);
        if (!isUsedPath(path)) {
            return;
        }
        if (isDirectory(path)) {
            loopFilesFromDirectory(privateData, path);
        }
        else {
            loopFilesExecute(privateData, "", path);
        }
    };
    const loopFilesFromDirectory = function LibraryTools_loopFilesFromDirectory(privateData, path) {
        readDirectory(path)
            .forEach(loopFilesExecute.bind(null, privateData, path));
    };
    const loopFilesExecute = function LibraryTools_loopFilesExecute(privateData, root, path) {
        path = resolvePath(root, path);
        if (isDirectory(path)) {
            loopFilesFromDirectory(privateData, path);
            return;
        }
        if (privateData.isIncluded(path)) {
            privateData.execute(path);
        }
    };
    const toRegExp = function (expressionList) {
        if (typeof expressionList === "string") {
            expressionList = [expressionList];
        }
        else if (!(expressionList instanceof Array)) {
            return [];
        }
        return expressionList
            .map(normalize)
            .map(publicExports.easyExpression);
    };
    const writeDirectory = function LibraryTools_writeDirectory(path) {
        if (isUsedPath(path)) {
            return;
        }
        const rootPath = Path.dirname(path);
        if (!isUsedPath(rootPath)) {
            writeDirectory(rootPath);
        }
        try {
            FS.mkdirSync(path);
        }
        catch (err) {
            console.warn(err);
        }
    };
    publicExports.writeFile = function LibraryTools_writeFile(inputs) {
        const path = resolvePath(inputs.path);
        writeDirectory(Path.dirname(path));
        FS.writeFileSync(inputs.path, inputs.content, { encoding: inputs.encoding });
    };
})();
registeredFiles["LibraryTools.js"] = module.exports;

ToolKid.registerFunction({section:"nodeJS", functions: {
            loopFiles:module.exports.loopFiles
        }})

global.log = ToolKid.debug.terminal.logImportant;
module.exports = ToolKid;
})();