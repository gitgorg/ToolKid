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
            const toolsPath = require("path").resolve(__dirname, "./LibraryTools");
            LibraryTools = require(toolsPath);
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
        const { section, name } = inputs;
        if (section[name] !== undefined) {
            throw ["overwriting methods is forbidden. tried to overwrite ." + name + ":", section[name], " with:", inputs.helperFunction];
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

(function TK_DataTypesChecks_init() {
    const publicExports = module.exports = {};
    publicExports.isBoolean = function TK_DataTypesChecks_isBoolean(value) {
        return typeof value === "boolean";
    };
    publicExports.isError = function TK_DataTypesChecks_isError(value) {
        return value instanceof Error;
    };
    publicExports.isFunction = function TK_DataTypesChecks_isFunction(value) {
        return typeof value === "function";
    };
    publicExports.isInteger = function TK_DataTypesChecks_isInteger(value) {
        return Number.isInteger(value);
    };
    publicExports.isMap = function TK_DataTypesChecks_isMap(value) {
        return value instanceof Map && value.size !== 0;
    };
    publicExports.isNumber = function TK_DataTypesChecks_isNumber(value) {
        return typeof value === "number" && !Number.isNaN(value);
    };
    publicExports.isPromise = function TK_DataTypesChecks_isPromise(value) {
        return value instanceof Promise;
    };
    publicExports.isString = function TK_DataTypesChecks_isString(value) {
        return typeof value === "string" && value !== "";
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "dataTypes", subSection: "checks", functions: publicExports });
    }
})();
registeredFiles["TK_DataTypesChecks.js"] = module.exports;

(function TK_DataTypesChecksEquality_init() {
    const publicExports = module.exports = {};
    publicExports.areEqual = function TK_DataTypesChecksEquality_areEqual(...inputs) {
        if (inputs.length === 2) {
            return assertEqualityLoose({
                path: [], toleranceDepth: 1, value: inputs[0], shouldBe: inputs[1]
            });
        }
        else {
            return assertEqualityLoose(Object.assign({
                path: [], toleranceDepth: 1
            }, inputs[0]));
        }
    };
    const assertEqualityLoose = function TK_DataTypesChecksEquality_assertEqualityLoose(inputs) {
        const { value, shouldBe } = inputs;
        if (isIdentical(value, shouldBe)) {
            return true;
        }
        const simpleTestResult = isSimpleAndEqual(inputs);
        if (simpleTestResult === true) {
            return true;
        }
        else if (simpleTestResult !== false) {
            simpleTestResult.path = inputs.path;
            return [simpleTestResult];
        }
        const toleranceDepth = inputs.toleranceDepth - 1;
        const additionalKeys = new Set(getKeys(value));
        let reader = readProperty.basic;
        if (shouldBe instanceof Map) {
            reader = readProperty.Map;
        }
        else if (shouldBe instanceof Set) {
            reader = readProperty.Set;
        }
        let differences = [];
        let returned;
        getKeys(shouldBe).forEach(function (key) {
            additionalKeys.delete(key);
            returned = assertEqualityLoose(Object.assign({}, inputs, {
                path: inputs.path.concat(key),
                value: reader(value, key),
                shouldBe: reader(shouldBe, key),
                toleranceDepth
            }));
            if (returned !== true) {
                differences.push(...returned);
            }
        });
        if (additionalKeys.size !== 0 && inputs.allowAdditions !== true) {
            additionalKeys.forEach(function (key) {
                returned = reader(value, key);
                if (returned !== undefined) {
                    differences.push({
                        path: inputs.path.concat(key),
                        type: "unwanted",
                        value: returned
                    });
                }
            });
        }
        return (differences.length === 0)
            ? true
            : differences;
    };
    const getKeys = function TK_DataTypesChecksEquality_getKeys(value) {
        if (value instanceof Array) {
            return value.map(getKeysArray);
        }
        else if (value instanceof Map) {
            return Array.from(value.keys());
        }
        else if (value instanceof Set) {
            return Array.from(value);
        }
        else {
            return Object.keys(value);
        }
    };
    const getKeysArray = function TK_DebugTestAssertions(value, key) {
        return key;
    };
    const isIdentical = function TK_DataTypesChecksEquality_isIdentical(valueA, valueB) {
        return valueA === valueB
            || (Number.isNaN(valueB) && Number.isNaN(valueA));
    };
    const isList = function TK_DataTypesChecksEquality_isList(value) {
        return typeof value === "object" && value !== null || typeof value === "function";
    };
    const isSimpleAndDifferent = function TK_DataTypesChecksEquality_isSimpleAndDifferent(valueA, valueB) {
        return typeof valueA !== typeof valueB
            || !isList(valueA) || !isList(valueB)
            || valueA instanceof Error || valueB instanceof Error;
    };
    const isSimpleAndEqual = function TK_DataTypesChecksEquality_isSimpleAndEqual(inputs) {
        const { value, shouldBe } = inputs;
        if (typeof shouldBe === "function" && shouldBe.valueChecks instanceof Array) {
            if (shouldBe(value) === true) {
                return true;
            }
            else {
                return { type: "invalid", value, shouldBe };
            }
        }
        ;
        if (isSimpleAndDifferent(value, shouldBe)) {
            return { type: "different", value, shouldBe };
        }
        else if (inputs.toleranceDepth === 0) {
            return { type: "tooDeep", value };
        }
        return false;
    };
    const readProperty = {
        basic: function (container, key) {
            return container[key];
        },
        Set: function (container, key) {
            return container.has(key);
        },
        Map: function (container, key) {
            return container.get(key);
        }
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "dataTypes", subSection: "checks", functions: publicExports });
    }
})();
registeredFiles["TK_DataTypesChecksEquality.js"] = module.exports;

(function TK_DataTypesPromise_init() {
    const publicExports = module.exports = {};
    publicExports.combine = function TK_DataTypesPromise_combine(...promises) {
        if (promises.length === 0) {
            return Promise.resolve();
        }
        let missing = promises.length;
        const datas = new Array(promises.length);
        const result = publicExports.createPromise();
        const handleSucces = function TK_DataTypesPromise_combineSuccess(position, data) {
            datas[position] = data;
            missing -= 1;
            if (missing === 0) {
                result.resolve(datas);
            }
        };
        const handleFailure = function TK_DataTypesPromise_combineFailure(data) {
            if (result.state === "pending") {
                result.reject(data);
            }
        };
        promises.forEach(function (promise, position) {
            promise.then(handleSucces.bind(null, position), handleFailure);
        });
        return result.promise;
    };
    publicExports.createPromise = function TK_DataTypesPromise_createPromise() {
        const result = {
            state: "pending"
        };
        result.promise = new Promise(function TK_DataTypesPromise_createPromiseInternal(resolve, reject) {
            result.resolve = promiseDecide.bind(null, {
                promiseData: result,
                method: resolve,
                state: "fulfilled"
            });
            result.reject = promiseDecide.bind(null, {
                promiseData: result,
                method: reject,
                state: "rejected"
            });
        });
        return result;
    };
    const promiseDecide = function TK_DataTypesPromise_promiseDecide(bound, data) {
        const { promiseData } = bound;
        if (promiseData.state !== "pending") {
            console.error([
                "TK_DataTypesPromise_createPromiseReject - promise allready " + promiseData.state + " with:",
                promiseData.data,
                " then tried " + bound.state + " with:",
                data
            ]);
            return;
        }
        bound.method(data);
        promiseData.data = data;
        promiseData.state = bound.state;
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "dataTypes", subSection: "promise", functions: publicExports });
    }
})();
registeredFiles["TK_DataTypesPromise.js"] = module.exports;

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

(function TK_DebugTest_init() {
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
        ToolKid.debug.test.registerTestResult(...testResults);
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
        const bound = {
            resolver,
            result,
            startTime: inputs.startTime
        };
        inputs.promise.then(testPromiseSuccess.bind(null, bound), testPromiseFailure.bind(null, bound));
        return promise;
    };
    const testPromiseSuccess = function TK_DebugTest_testPromiseSuccess(bound) {
        bound.result.time = Date.now() - bound.startTime;
        bound.resolver(bound.result);
    };
    const testPromiseFailure = function TK_DebugTest_testPromiseFailure(bound, reason) {
        const { result } = bound;
        result.errorMessage = reason;
        result.time = Date.now() - bound.startTime;
        if (reason === undefined) {
            reason = "Unspecified Error";
        }
        result.errorMessage = reason;
        bound.resolver(result);
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();
registeredFiles["TK_DebugTest.js"] = module.exports;

(function TK_DebugTestAssertFailure_init() {
    const { areEqual } = ToolKid.dataTypes.checks;
    const publicExports = module.exports = {};
    publicExports.assertFailure = function TK_DebugTestAssertFailure_assertFailure(...inputs) {
        const promisedResults = inputs
            .map(assertFailureSingle)
            .filter(isPromised);
        if (promisedResults.length === 0) {
            return Promise.resolve();
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
    const assertFailureError = function TK_DebugTestAssertFailure_assertFailureError(inputs) {
        const { error, shouldThrow } = inputs;
        if (shouldThrow === Error) {
            if (!(error instanceof Error)) {
                return report({
                    name: inputs.name,
                    message: ["did not throw a real error object but threw:", error]
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
            const differences = areEqual({
                value: error,
                shouldBe: shouldThrow
            });
            if (differences !== true) {
                return report({
                    name: inputs.name,
                    message: ["did not throw expected message. threw:", error, "~details~", differences]
                });
            }
        }
        return undefined;
    };
    const isPromised = function (inputs) {
        return inputs !== undefined && inputs.promise instanceof Promise;
    };
    const report = function TK_DebugTestAssertFailure_report(inputs) {
        const { message } = inputs;
        return [
            "~ " + inputs.name + " ~ " + message[0],
            ...message.slice(1)
        ];
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();
registeredFiles["TK_DebugTestAssertFailure.js"] = module.exports;

(function TK_DebugTestAssertion_init() {
    const publicExports = module.exports = {};
    publicExports.assertEquality = function TK_Debug_assertEquality(...inputs) {
        inputs.forEach(function TK_DebugTestAssertion_testForEquealityPerInput(inputs) {
            Object.entries(inputs).forEach(assertEqualityPerName);
        });
    };
    const assertEqualityPerName = function TK_Debug_assertEqualityPerName(nameAndValue) {
        const settings = Object.assign({}, nameAndValue[1]);
        if (typeof settings.toleranceDepth !== "number") {
            settings.toleranceDepth = 1;
        }
        const returned = ToolKid.dataTypes.checks.areEqual(settings);
        if (returned !== true) {
            throw ["~ " + nameAndValue[0] + " ~ value did not meet expectations:", ...returned];
        }
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();
registeredFiles["TK_DebugTestAssertion.js"] = module.exports;

(function TK_DebugTestCondition_init() {
    const publicExports = module.exports = {};
    const registeredConditions = new Map();
    publicExports.condition = function TK_DebugTestCondition_condition(inputs) {
        if (typeof inputs === "string") {
            const found = registeredConditions.get(inputs);
            if (found !== undefined) {
                return found;
            }
            const result = conditionCreate();
            result.reject("unregistered condition: \"" + inputs + "\"");
            return result;
        }
        if (inputs === undefined) {
            return conditionCreate();
        }
        inputs = conditionInputs(inputs);
        const result = conditionCreate();
        watchPromiseDuration({
            timeLimit: inputs.timeLimit,
            overTimeMessage: inputs.overTimeMessage,
            promise: result
        });
        if (typeof inputs.registerWithName === "string") {
            registeredConditions.set(inputs.registerWithName, result);
        }
        return result;
    };
    const conditionCreate = function TK_DebugTestCondition_conditionCreate() {
        let resolve, reject;
        const result = new Promise(function createPromise_setup(resolveFunction, rejectFunction) {
            resolve = function TK_DebugTestCondition_PromiseResolve(value) {
                result.done = true;
                resolveFunction(value);
            };
            reject = function TK_DebugTestCondition_PromiseReject(reason) {
                result.done = true;
                rejectFunction(reason);
            };
        });
        result.resolve = resolve;
        result.reject = reject;
        result.done = false;
        return result;
    };
    const conditionInputs = function TK_DebugTestCondition_conditionInputs(inputs) {
        if (typeof inputs === "number") {
            return {
                timeLimit: inputs,
                overTimeMessage: "timeout"
            };
        }
        if (inputs.overTimeMessage === undefined) {
            inputs.overTimeMessage = "timeout";
        }
        return inputs;
    };
    const watchPromiseDuration = function TK_DEBUG_TestAssertion_watchPromiseDuration(inputs) {
        setTimeout(function TK_DEBUG_TestAssertion_watchPromiseDurationCheck() {
            if (inputs.promise.done !== true) {
                inputs.promise.reject(inputs.overTimeMessage);
            }
        }, inputs.timeLimit);
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();
registeredFiles["TK_DebugTestCondition.js"] = module.exports;

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
        console.warn(colorText("negative", ">> failed test \"" + result.name + "\" for " + result.subject.name), logFailureNice(result.errorMessage).map(shortenValue));
    };
    const logFailureNice = function TK_DebugTestFull_logFailureNice(failure) {
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
    const shortenValue = function TK_DebugTestFull_shortenValue(value) {
        if (typeof value === "string") {
            if (value.length > 200) {
                return value.slice(0, 100)
                    + ">>[...]<<"
                    + value.slice(-100)
                    + ">>total length:" + value.length + "<<";
            }
        }
        else if (value instanceof Array) {
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
        ToolKid.debug.test.clearSummaryState();
        ToolKid.nodeJS.loopFiles(Object.assign({}, inputs, {
            execute: require
        }));
        const summary = ToolKid.debug.test.getSummary(function (summary) {
            // TODO: real test for .testFull
            summary.missingSuspects.delete(publicExports.testFull);
            console.log(colorText("positive", "\n>> testing done"
                + ((typeof inputs.title === "string")
                    ? " for " + inputs.title
                    : "")));
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

(function TK_DebugTestResults_init() {
    let timeStart = Date.now();
    let testResults = [];
    let testSuspects = new Set();
    const publicExports = module.exports = {};
    const beautifyDifferences = function TK_DebugTestResults_beautifyDifferences(testResult) {
        const { errorMessage } = testResult;
        if (!(errorMessage instanceof Array)
            || errorMessage[0] !== "string"
            || errorMessage[0].slice(-13) !== "expectations:") {
            return testResult;
        }
        const differences = errorMessage.slice(1);
        let path;
        const subMessages = differences.map(function (difference) {
            path = ["value", ...difference.path].join(".");
            if (difference.type === "different") {
                return [
                    path + " should have been:", difference.shouldBe,
                    "but instead is:", difference.value
                ];
            }
            else if (difference.type === "tooDeep") {
                return [
                    path + " is exceeding comparison depth"
                ];
            }
            else if (difference.type === "invalid") {
                return [
                    path + " did not pass test:", difference.shouldBe,
                    "with value:", difference.value
                ];
            }
            else if (difference.type === "unwanted") {
                return [
                    "unwanted property " + path + ":", difference.value
                ];
            }
            return difference;
        });
        // const difference = <EqualityDifference>message[length - 1];
        // let part = difference.onlyA;
        // if (Object.keys(part).length !== 0) { //extensive properties
        //     subMessages.push(["unwanted properties: ", part]);
        // }
        // part = difference.onlyB;
        // if (Object.keys(part).length !== 0) { //missing properties
        //     subMessages.push(["missing properties: ", part]);
        // }
        // Object.entries(difference.changed).forEach(function (keyAndValues) { //changed properties
        //     subMessages.push([
        //         "   property " + keyAndValues[0] + "is :",
        //         keyAndValues[1][0],
        //         "   and should have been:",
        //         keyAndValues[1][1]
        //     ]);
        // }, difference.changed);
        // return Object.assign({}, testResult, {
        //     errorMessage: [...message.slice(0, -2), "~ details ~", ...subMessages]
        // });
        return Object.assign({}, testResult, {
            errorMessage: [testResult.errorMessage[0], ...subMessages]
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
    let pendingSummaries = [];
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
        else {
            pendingSummaries.push(result);
        }
        return result;
    };
    const getSummaryFinal = function TK_DebugTestResults_getSummaryFinal(summary) {
        const pos = pendingSummaries.indexOf(summary);
        if (pos !== -1) {
            pendingSummaries.splice(pos, 1);
        }
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
    const summaryHandlePromise = function TK_DebugTestResults_summaryHandlePromise(bound, result) {
        const { summary } = bound;
        summary.pending.delete(bound.promise);
        summaryRegisterResult(summary, result);
        if (summary.pending.size === 0) {
            getSummaryFinal(summary);
        }
    };
    const summaryRegisterResult = function TK_DebugTest_summaryRegisterResults(summary, testResult) {
        if (testResult instanceof Promise) {
            summary.pending.add(testResult);
            const handleResolve = summaryHandlePromise.bind(null, {
                summary,
                promise: testResult
            });
            testResult.then(handleResolve);
            return;
        }
        summary.missingSuspects.delete(testResult.subject);
        if (testResult.errorMessage !== undefined) {
            summary.failures.push(beautifyDifferences(testResult));
            return false;
        }
        else {
            summaryRegisterSuccess({
                list: summary.successes, testResult
            });
            return true;
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
        pendingSummaries.forEach(registerResultsDelayed.bind(null, results));
        testResults.push(...results);
    };
    const registerResultsDelayed = function TK_DebugTestResults_registerResultsDelayed(results, summary) {
        results.forEach(summaryRegisterResult.bind(null, summary));
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

(function TK_DebugTestShouldPass_init() {
    const publicExports = module.exports = {};
    const createValueChecker = function TD_DebugTestShouldPass_createValueChecker(mode, value) {
        return (mode === "fail")
            ? testFailure.bind(null, value)
            : testSuccess.bind(null, value);
    };
    publicExports.shouldPass = function TK_DebugTestShouldPass_shouldPass(...checks) {
        if (checks.length === 0) {
            throw ["TK_DebugTestShouldPass_shouldPass - needs at least one check function"];
        }
        const fails = checks.filter(function (entry) { return typeof entry !== "function"; });
        if (fails.length !== 0) {
            throw ["TK_DebugTestShouldPass_shouldPass - can only check with functions but got:", checks];
        }
        return ValueAsserter({
            checks,
            want: "none",
            to: "fail"
        });
    };
    publicExports.shouldPassAny = function TK_DebugTestShouldPass_shouldPassAny(...checks) {
        if (checks.length < 2) {
            throw ["TK_DebugTestShouldPass_shouldPassAny - needs at least two check functions"];
        }
        return ValueAsserter({
            checks,
            want: "any",
            to: "pass"
        });
    };
    const testFailure = function TD_DebugTestShouldPass_testFailure(value, check) {
        return check(value) !== true;
    };
    const testSuccess = function TD_DebugTestShouldPass_testSuccess(value, check) {
        return check(value) === true;
    };
    const ValueAsserter = function TK_DebugTestShouldPass_ValueAsserter(inputs) {
        const asserter = (inputs.want === "none")
            ? wantsNone.bind(null, inputs)
            : wantsAny.bind(null, inputs);
        asserter.valueChecks = inputs.checks;
        asserter.wants = inputs.want;
        asserter.to = inputs.to;
        return asserter;
    };
    const wantsAny = function TK_DebugTestShouldPass_wantsAny(bound, value) {
        return bound.checks.findIndex(wantsAnySub.bind(null, createValueChecker(bound.to, value), value)) !== -1;
    };
    const wantsAnySub = function TK_DebugTestShouldPass_wantsAnySub(checker, value, shouldBe) {
        if (typeof shouldBe === "function") {
            return checker(shouldBe);
        }
        else {
            return shouldBe === value;
        }
    };
    const wantsNone = function TK_DebugTestShouldPass_wantsNone(bound, value) {
        return bound.checks.findIndex(createValueChecker(bound.to, value)) === -1;
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();
registeredFiles["TK_DebugTestShouldPass.js"] = module.exports;

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
    const { existsSync: isUsedPath, readFileSync: readFile, unlink: deleteFile } = require("fs");
    const { resolve: resolvePath } = require("path");
    const publicExports = module.exports = {};
    publicExports.deleteFile = function TK_nodeJSFile_deleteFile(inputs) {
        if (typeof inputs === "string") {
            inputs = { path: inputs };
        }
        deleteFile(inputs.path, deleteFileHandler.bind(null, inputs));
    };
    const deleteFileHandler = function TK_nodeJSFile_deleteFileHandler(boundInputs, error) {
        if (error !== null) {
            if (error.code !== "ENOENT"
                || boundInputs.ignoreMissingFile !== true) {
                throw error;
            }
        }
    };
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
    const publicExports = module.exports = {};
    publicExports.isUsedPath = function TK_nodeJSPath_file_isUsedPath(path) {
        return FS.existsSync(path);
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "nodeJS", functions: publicExports });
    }
})();
registeredFiles["TK_NodeJSPath.js"] = module.exports;

(function LibraryTools_init() {
    const FS = require("fs");
    const { existsSync: isUsedPath, lstatSync: readPathStats, readdirSync: readDirectory } = FS;
    const Path = require("path");
    const { normalize, resolve: resolvePath } = Path;
    const publicExports = module.exports = {};
    // TODO: replacements more structured, maybe backwards compatible
    // const replacements = {
    //     "\\": "\\\\",
    //     ".": "\\.",
    //     "\*": ".+"
    // };
    publicExports.easyExpression = function LibraryTools_easyExpression(expression) {
        expression = expression.replaceAll("\\", "\\\\");
        expression = expression.replaceAll(".", "\\.");
        expression = expression.replaceAll("\*", ".+");
        //expression = expression.replace(replaceRegex, easyExpressionReplacer);
        return new RegExp("^" + expression + "$");
    };
    // var replaceRegex = new RegExp('[' + Object.keys(replacements).join('') + ']', 'ig');
    // const easyExpressionReplacer = function (old:string) {
    //     return replacements[<".">old];
    // };
    publicExports.isArray = function LibraryTools_isArray(value) {
        return value instanceof Array && value.length !== 0;
    };
    publicExports.isDirectory = function LibraryTools_isDirectory(path) {
        return readPathStats(path).isDirectory();
    };
    const buildPathChecker = function LibraryTools_buildPathChecker(inputs) {
        const hasIncludes = publicExports.isArray(inputs.include);
        const hasExcludes = publicExports.isArray(inputs.exclude);
        if (hasIncludes && hasExcludes) {
            return publicExports.partial(pathCheckerBoth, inputs.include, inputs.exclude);
        }
        else if (hasIncludes) {
            return publicExports.partial(pathCheckerIncludes, inputs.include);
        }
        else if (hasExcludes) {
            return publicExports.partial(pathCheckerExcludes, inputs.exclude);
        }
        else {
            return function LibraryTools_pathCheckerNone() { return true; };
        }
    };
    const pathCheckerBoth = function LibraryTools_pathCheckerBoth(include, exclude, path) {
        const test = publicExports.partial(testPath, path);
        return exclude.find(test) === undefined && include.find(test) !== undefined;
    };
    const pathCheckerIncludes = function pathCheckerIncludes(include, path) {
        const test = publicExports.partial(testPath, path);
        return include.find(test) !== undefined;
    };
    const pathCheckerExcludes = function pathCheckerExcludes(exclude, path) {
        const test = publicExports.partial(testPath, path);
        return exclude.find(test) === undefined;
    };
    publicExports.loopFiles = function LibraryTools_loopFiles(inputs) {
        const pathChecker = buildPathChecker({
            include: toRegExp(inputs.include || []),
            exclude: toRegExp(inputs.exclude || []),
        });
        const privateData = {
            isIncluded: pathChecker,
            execute: inputs.execute
        };
        const { path } = inputs;
        if (path instanceof Array) {
            path.forEach(publicExports.partial(loopFilesFrom, privateData));
        }
        else {
            loopFilesFrom(privateData, path);
        }
    };
    publicExports.resolvePath = function LibraryTools_resolvePath(...parts) {
        return Path.resolve(...parts);
    };
    const loopFilesFrom = function LibraryTools_loopFilesFrom(privateData, path) {
        path = resolvePath(path);
        if (!isUsedPath(path)) {
            return;
        }
        if (publicExports.isDirectory(path)) {
            loopFilesFromDirectory(privateData, path);
        }
        else {
            loopFilesExecute(privateData, "", path);
        }
    };
    const loopFilesFromDirectory = function LibraryTools_loopFilesFromDirectory(privateData, path) {
        readDirectory(path).forEach(publicExports.partial(loopFilesExecute, privateData, path));
    };
    const loopFilesExecute = function LibraryTools_loopFilesExecute(privateData, root, path) {
        path = resolvePath(root, path);
        if (publicExports.isDirectory(path)) {
            loopFilesFromDirectory(privateData, path);
            return;
        }
        if (privateData.isIncluded(path)) {
            privateData.execute(path);
        }
    };
    publicExports.partial = function LibraryTools_partial(baseFunction, ...inputs) {
        if (inputs.length === 0) {
            throw ["LibraryTools_partial - no inputs to preset for:", baseFunction];
        }
        const result = baseFunction.bind(null, ...inputs);
        if (result.presetInputs instanceof Array) {
            result.presetInputs.push(...inputs);
        }
        else {
            result.presetInputs = inputs;
        }
        return result;
    };
    const testPath = function LibraryTools_testPath(path, expression) {
        return expression.test(path);
    };
    const toRegExp = function LibraryTools_toRegExp(expressions) {
        if (typeof expressions === "string") {
            expressions = [expressions];
        }
        else if (!(expressions instanceof Array)) {
            return [];
        }
        return expressions
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
    Object.freeze(publicExports);
})();
registeredFiles["LibraryTools.js"] = module.exports;

ToolKid.registerFunction({section:"nodeJS", functions: {
            loopFiles:module.exports.loopFiles
        }})

ToolKid.registerFunction({section:"DataTypes", subSection:"checks", functions: {
            isArray:module.exports.isArray
        }})

global.log = ToolKid.debug.terminal.logImportant;
module.exports = ToolKid;
})();