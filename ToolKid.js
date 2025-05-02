"use strict";
(function ToolKid_init () {
const registeredFiles = {};


(function LibraryCore_init() {
    let LibraryTools;
    const publicExports = module.exports = {};
    const addAsReadOnly = function LibraryCore_addAsReadOnly(inputs) {
        Object.defineProperty(inputs.container, inputs.name, {
            enumerable: true,
            value: inputs.property,
            writable: false
        });
    };
    const addAsReadOnlyHidden = function LibraryCore_addAsReadOnlyHidden(inputs) {
        Object.defineProperty(inputs.container, inputs.name, {
            enumerable: false,
            value: inputs.property,
            writable: false
        });
    };
    publicExports.createInstance = function LibraryCore_createInstance() {
        const result = {};
        const registerWithContext = registerFunction.bind(null, result);
        addAsReadOnlyHidden({
            container: result,
            name: "registerFunction",
            property: registerWithContext
        });
        return result;
    };
    const isValidInput = function LibraryCore_isValidInput(inputs) {
        return (typeof inputs.name !== "string"
            || typeof inputs.helperFunction !== "function");
    };
    publicExports.getTools = function LibraryCore_getTools() {
        if (LibraryTools === undefined) {
            const toolsPath = require("path").resolve(__dirname, "./LibraryTools_nodeJS.js");
            LibraryTools = require(toolsPath);
        }
        return LibraryTools;
    };
    const printRegisterError = function LibraryCore_printRegisterError(inputs) {
        console.error(["LibraryCore_registerHelperToSection - invalid inputs:", inputs]);
    };
    const registerFunction = function LibraryCore_registerFunction(library, inputs) {
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
    const registerHelperToSectionLoop = function LibraryCore_registerHelperToSectionLoop(inputs) {
        const { section, helpers } = inputs;
        for (let name in helpers) {
            registerHelperToSection({
                section, name, helperFunction: helpers[name]
            });
        }
    };
    const registerHelperToSection = function LibraryCore_registerHelperToSection(inputs) {
        if (isValidInput(inputs)) {
            printRegisterError(inputs);
            return;
        }
        const { section, name } = inputs;
        if (section[name] !== undefined) {
            throw ["overwriting library methods is forbidden. tried to overwrite ." + inputs.name + "." + name + ": ", section[name], " with: ", inputs.helperFunction];
        }
        addAsReadOnly({
            container: inputs.section,
            name: inputs.name,
            property: inputs.helperFunction
        });
    };
    const registerSection = function LibraryCore_registerSection(inputs) {
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
registeredFiles["LibraryCore.js"] = module.exports;

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

(function TK_DataTypesArray_init() {
    const publicExports = module.exports = {};
    publicExports.iterateBatch = function TK_DataTypesArray_iterateBatch(inputs) {
        const privateData = Object.assign({
            batchSize: 10,
            callback: function () { },
            maxBlockDuration: 100,
            stopSignal: {},
            startIndex: 0,
        }, inputs, {
            dataPosition: 0,
        });
        if (typeof privateData.startIndex !== "number" || Number.isNaN(privateData.startIndex)) {
            throw ["TK_DataTypesArray_iterateBatch - .startIndex should be a number:", inputs];
        }
        privateData.boundIterator = iterateBatchLoop.bind(null, privateData);
        iterateBatchLoop(privateData);
    };
    const iterateBatchLoop = function db_TLSTools_iterateBatchLoop(inputs) {
        const { data, parser, stopSignal } = inputs;
        const indexEnd = Math.min(inputs.startIndex + inputs.batchSize, data.length);
        for (let i = inputs.startIndex; i < indexEnd; i += 1) {
            if (parser(data[i], i) === stopSignal) {
                inputs.callback(i);
                return;
            }
        }
        if (indexEnd === data.length) {
            inputs.callback(indexEnd - 1);
            return;
        }
        inputs.startIndex = indexEnd;
        setTimeout(inputs.boundIterator, 0);
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "dataTypes", subSection: "array", functions: publicExports });
    }
})();
registeredFiles["TK_DataTypesArray.js"] = module.exports;

(function TK_DataTypesChecks_init() {
    const publicExports = module.exports = {};
    publicExports.getDataType = function TK_DataTypesChecks_getDataType(value) {
        return dataTypeConverters[typeof value](value);
    };
    const dataTypeConverters = {
        bigint: function RS_h_checks_isEmptyBigint() { return "bigint"; },
        boolean: function RS_h_checks_isEmptyBoolean() { return "boolean"; },
        function: function RS_h_checks_isEmptyFunction() { return "function"; },
        number: function RS_h_checks_isEmptyNumber(data) {
            return Number.isNaN(data) ? "undefined" : "number";
        },
        object: function RS_h_checks_isEmptyObject(data) {
            if (data === null) {
                return "undefined";
            }
            else if (data instanceof Array) {
                return "array";
            }
            else {
                return "object";
            }
        },
        string: function RS_h_checks_isEmptyString() { return "string"; },
        symbol: function RS_h_checks_isEmptySymbol() { return "symbol"; },
        undefined: function RS_h_checks_isEmptyUndefined() { return "undefined"; }
    };
    if (typeof Element === "function") {
        const standard = dataTypeConverters.object;
        dataTypeConverters.object = function RS_h_checks_isEmptyObjectDOM(data) {
            if (data instanceof Element) {
                return "HTML";
            }
            else if (data instanceof DOMTokenList) {
                return "HTMLClassList";
            }
            else {
                return standard(data);
            }
        };
    }
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
    publicExports.handleDataType = function TK_DataTypesChecks_handleDataType(inputs) {
        const { typeHandlers } = inputs;
        if (typeof typeHandlers !== "object") {
            throw ["TK_DataTypesChecks_handleDataType - invalid DataTypeParsers passed:", typeHandlers];
        }
        const { value } = inputs;
        const type = publicExports.getDataType(value);
        const handler = typeHandlers[type];
        if (handler === false) {
            return;
        }
        const withInputs = inputs.withInputs || [value];
        if (typeof handler === "function") {
            return handler(...withInputs);
        }
        else if (typeof typeHandlers.any === "function") {
            return typeHandlers.any(...withInputs);
        }
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "dataTypes", subSection: "checks", functions: publicExports });
    }
})();
registeredFiles["TK_DataTypesChecks.js"] = module.exports;

(function TK_DataTypesChecksEquality_init() {
    const publicExports = module.exports = {};
    publicExports.areEqual = function TK_DataTypesChecksEquality_areEqual(inputs) {
        if (arguments.length === 2) {
            return assertEqualityLoose([], arguments[0], arguments[1], 1, false);
        }
        else {
            return assertEqualityLoose([], inputs.value, inputs.shouldBe, (typeof inputs.toleranceDepth === "number") ? inputs.toleranceDepth : 1, inputs.allowAdditions === true);
        }
    };
    const differentiators = {
        set: function TK_DataTypesChecksEquality_diffSet(path, value, shouldBe) {
            if (!(shouldBe instanceof Set)) {
                return [{
                        type: "different", value, shouldBe, path
                    }];
            }
            const differences = [];
            shouldBe.forEach(function (entry) {
                if (!value.has(entry)) {
                    differences.push({
                        type: "different",
                        value: undefined,
                        shouldBe: entry,
                        path: [...path, entry]
                    });
                }
            });
            value.forEach(function (entry) {
                if (!shouldBe.has(entry)) {
                    differences.push({
                        type: "unwanted",
                        value: entry,
                        path: [...path, entry]
                    });
                }
            });
            return differences.length === 0
                ? true : differences;
        }
    };
    const assertEqualityLoose = function TK_DataTypesChecksEquality_assertEqualityLoose(path, value, shouldBe, toleranceDepth, allowAdditions) {
        if (isIdentical(value, shouldBe)) {
            return true;
        }
        else if (typeof shouldBe === "function"
            && shouldBe.valueChecks instanceof Array) {
            if (shouldBe(value) === true) {
                return true;
            }
            else {
                return [{ path, type: "invalid", value, shouldBe }];
            }
        }
        else if (toleranceDepth === 0) {
            return [{ path, type: "tooDeep", value, shouldBe }];
        }
        const simpleTestResult = isSimpleAndEqual(value, shouldBe, toleranceDepth);
        if (simpleTestResult === true) {
            return true;
        }
        else if (simpleTestResult !== false) {
            simpleTestResult.path = path;
            return [simpleTestResult];
        }
        toleranceDepth -= 1;
        if (value instanceof Set) {
            return differentiators.set(path, value, shouldBe);
        }
        let reader = readProperty.basic;
        if (shouldBe instanceof Map) {
            reader = readProperty.Map;
        }
        else if (shouldBe instanceof Set) {
            reader = readProperty.Set;
        }
        return equalLoop(path, value, shouldBe, toleranceDepth, allowAdditions, reader);
    };
    const equalLoop = function (path, value, shouldBe, toleranceDepth, allowAdditions, reader) {
        const additionalKeys = new Set(getKeys(value));
        let differences = [];
        let returned;
        getKeys(shouldBe).forEach(function (key) {
            additionalKeys.delete(key);
            returned = assertEqualityLoose(path.concat(key), reader(value, key), reader(shouldBe, key), toleranceDepth, allowAdditions);
            if (returned !== true) {
                differences.push(...returned);
            }
        });
        if (additionalKeys.size !== 0 && allowAdditions === false) {
            additionalKeys.forEach(function (key) {
                returned = reader(value, key);
                if (returned !== undefined) {
                    differences.push({
                        path: path.concat(key),
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
    const isSimpleAndEqual = function TK_DataTypesChecksEquality_isSimpleAndEqual(value, shouldBe, toleranceDepth) {
        if (isSimpleAndDifferent(value, shouldBe)) {
            return { type: "different", value, shouldBe };
        }
        return false;
    };
    const readProperty = {
        basic: function (container, key) {
            return container[key];
        },
        Set: function (container, key) {
            return container.has(key) ? key : undefined;
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

(function TK_DataTypesNumber_init() {
    const publicExports = module.exports = {};
    publicExports.addUnderscores = function TK_DataTypesNuber_addUnderscores(value) {
        if (typeof value === "string") {
            if (isNaN(value)) {
                return "";
            }
            value = parseFloat(value);
            if (isNaN(value)) {
                return "";
            }
        }
        else if (typeof value !== "number" || Number.isNaN(value)) {
            return "";
        }
        let result = "";
        if (value < 0) {
            result = "-";
            value *= -1;
        }
        ;
        const textBase = String(value);
        const scoreCount = Math.floor((textBase.length - 1) / 3);
        if (scoreCount === 0) {
            return result + textBase;
        }
        let offset = Math.round(textBase.length % 3) || 3;
        result += textBase.slice(0, offset);
        for (let i = 0; i < scoreCount; i += 1) {
            result += "_" + textBase.slice(offset, offset + 3);
            offset += 3;
        }
        return result;
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "dataTypes", subSection: "number", functions: publicExports });
    }
})();
registeredFiles["TK_DataTypesNumber.js"] = module.exports;

(function TK_DataTypesPromise_init() {
    const publicExports = module.exports = {};
    publicExports.combinePromises = function TK_DataTypesPromise_combinePromises(...promises) {
        if (promises.length === 0) {
            return Promise.resolve();
        }
        let missing = promises.length;
        const datas = new Array(promises.length);
        const result = publicExports.createPromise();
        const handleSucces = function TK_DataTypesPromise_combinePromisesSuccess(position, data) {
            datas[position] = data;
            missing -= 1;
            if (missing === 0) {
                result.resolve(datas);
            }
        };
        const handleFailure = function TK_DataTypesPromise_combinePromisesFailure(data) {
            if (result.state === "pending") {
                result.reject(data);
            }
        };
        promises.forEach(function TK_DataTypesPromise_combinePromisesWatch(promise, position) {
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

(function TK_DebugCallstack_init() {
    const publicExports = module.exports = {};
    publicExports.readFrames = function TK_DebugCallstack_readCallstack(inputs = {}) {
        const start = Math.max(1, inputs.position || 1);
        return new Error().stack.split("\n").slice(start, start + (inputs.amount || 1)).map(extractFileName);
    };
    const regExpAfterLastSlash = /[^\/\\]+$/;
    const extractFileName = publicExports.extractFileName = function TK_DebugCallstack_extractFileName(part) {
        const filePart = part.slice(part.search(regExpAfterLastSlash));
        return filePart.split(":")[0];
    };
    ;
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "callstack", functions: publicExports });
    }
})();
registeredFiles["TK_DebugCallstack.js"] = module.exports;

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
    let disableCount = 0;
    let originalLog;
    publicExports.disableLogs = function TK_DebugTerminalLog_disableLogs(amount) {
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
    const resultGroups = new Map([["default", {
                name: "default",
                results: []
            }]]);
    let currentResultGroup = resultGroups.get("default");
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
    publicExports.getResultGroup = function TK_DebugTest_getResultGroup(name) {
        if (typeof name !== "string") {
            return {
                name: currentResultGroup.name,
                results: currentResultGroup.results
            };
        }
        const results = resultGroups.get(name);
        return (results === undefined)
            ? undefined
            : { name, results };
    };
    publicExports.setFailureHandler = function TK_DebugTest_setFailureHandler(handler) {
        currentResultGroup.failureHandler = handler;
    };
    publicExports.switchResultGroup = function TK_DebugTest_selectTestGroup(name) {
        if (typeof name !== "string" || name.length === 0) {
            throw ["TK_DebugTest_selectTestGroup - invalid name:", name];
        }
        const found = resultGroups.get(name);
        if (found === undefined) {
            currentResultGroup = {
                name,
                results: [],
            };
            resultGroups.set(name, currentResultGroup);
        }
        else {
            currentResultGroup = found;
        }
        return currentResultGroup.results;
    };
    publicExports.test = function TK_DebugTest_testInterface(...inputs) {
        if (inputs.length === 0) {
            throw ["TK_DebugTest_test - no config received"];
        }
        const testResults = inputs.map(testSingle.bind(null, currentResultGroup));
        currentResultGroup.results.push(...testResults);
        return testResults;
    };
    const testSingle = function TK_DebugTest_testSingle(resultGroup, config) {
        if (!isObjectWithExecute(config)
            || !isValidSubject(config.subject)) {
            throw ["TK_DebugTest_test - invalid config:", config];
        }
        return testExecute({
            config,
            testResult: createResultBase(config),
            resultGroup
        });
    };
    // TODO: unit tests for callback function
    const testExecute = function Test_testExecute(inputs) {
        const { testResult } = inputs;
        const startTime = Date.now();
        const scope = {};
        try {
            const returned = inputs.config.execute(scope);
            if (returned instanceof Promise) {
                const promise = testWatchPromise({
                    testResult,
                    startTime,
                    promise: returned,
                    resultGroup: inputs.resultGroup,
                    source: ToolKid.debug.callstack.readFrames({ position: 6 })[0],
                });
                promise.then(function Test_testExecute_handlePromise() {
                    if (typeof inputs.config.callback === "function") {
                        inputs.config.callback({ scope, testResult });
                    }
                    const { results } = inputs.resultGroup;
                    const index = results.indexOf(promise);
                    results[index] = testResult;
                });
                return promise;
            }
            testResult.time = Date.now() - startTime;
        }
        catch (error) {
            testResult.time = Date.now() - startTime;
            testResult.errorMessage = error;
            testResult.errorSource = ToolKid.debug.callstack.readFrames({ position: 6 })[0];
            if (inputs.resultGroup.failureHandler !== undefined) {
                inputs.resultGroup.failureHandler(testResult);
            }
        }
        if (typeof inputs.config.callback === "function") {
            inputs.config.callback({ scope, testResult });
        }
        return Object.freeze(testResult);
    };
    const testWatchPromise = function TK_DebugTest_testWatchPromise(inputs) {
        let resolver;
        const promise = new Promise(function TK_DebugTest_testWatchPromiseCreate(resolve) {
            resolver = resolve;
        });
        inputs.resolver = resolver;
        inputs.promise.then(testPromiseSuccess.bind(null, inputs), testPromiseFailure.bind(null, inputs));
        return promise;
    };
    const testPromiseSuccess = function TK_DebugTest_testPromiseSuccess(bound) {
        bound.testResult.time = Date.now() - bound.startTime;
        bound.resolver(bound.testResult);
    };
    const testPromiseFailure = function TK_DebugTest_testPromiseFailure(bound, reason) {
        const { testResult } = bound;
        testResult.errorMessage = reason;
        testResult.time = Date.now() - bound.startTime;
        if (reason === undefined) {
            reason = "Unspecified Error";
        }
        testResult.errorMessage = reason;
        testResult.errorSource = bound.source;
        if (bound.resultGroup.failureHandler !== undefined) {
            bound.resultGroup.failureHandler(testResult);
        }
        bound.resolver(Object.freeze(testResult));
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
        const errors = [];
        inputs.forEach(function TK_DebugTestAssertion_testForEquealityPerInput(inputs) {
            Object.entries(inputs).forEach(assertEqualityPerName.bind(null, errors));
        });
        if (errors.length !== 0) {
            throw errors;
        }
    };
    const assertEqualityPerName = function TK_Debug_assertEqualityPerName(errors, nameAndValue) {
        const settings = Object.assign({}, nameAndValue[1]);
        if (typeof settings.toleranceDepth !== "number") {
            settings.toleranceDepth = 1;
        }
        const returned = ToolKid.dataTypes.checks.areEqual(settings);
        if (returned !== true) {
            const errorMessage = ["~ " + nameAndValue[0] + " ~ value did not meet expectations:", ...returned];
            if (typeof settings.catchFailure === "function") {
                settings.catchFailure(errorMessage);
            }
            else {
                errors.push(errorMessage);
            }
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
        if (typeof inputs === "number") {
            inputs = { timeToResolve: inputs };
        }
        const result = conditionCreate();
        if (typeof inputs.timeToResolve === "number" || typeof inputs.timeToReject === "number") {
            watchPromiseDuration(inputs, result);
        }
        if (typeof inputs.registerWithName === "string") {
            registeredConditions.set(inputs.registerWithName, result);
        }
        return result;
    };
    const conditionCreate = function TK_DebugTestCondition_conditionCreate() {
        let resolve, reject;
        const result = new Promise(function createPromise_setup(resolveFunction, rejectFunction) {
            resolve = function TK_DebugTestCondition_PromiseResolve(value) {
                result.timePassed = Date.now() - startTime;
                result.done = true;
                if (arguments.length === 0) {
                    value = result.timePassed;
                }
                resolveFunction(value);
            };
            reject = function TK_DebugTestCondition_PromiseReject(reason) {
                result.timePassed = Date.now() - startTime;
                result.done = true;
                if (arguments.length === 0) {
                    reason = result.timePassed;
                }
                rejectFunction(reason);
            };
        });
        result.resolve = resolve;
        result.reject = reject;
        result.done = false;
        result.timePassed = 0;
        const startTime = Date.now();
        return result;
    };
    const watchPromiseDuration = function TK_DebugTestCondition_watchPromiseDuration(inputs, promise) {
        if (typeof inputs.timeToResolve === "number") {
            setTimeout(function TK_DebugTestCondition_watchPromiseDurationCheck() {
                if (promise.done !== true) {
                    promise.resolve(inputs.overTimeMessage || "timeout");
                }
            }, inputs.timeToResolve);
        }
        else {
            setTimeout(function TK_DebugTestCondition_watchPromiseDurationCheck() {
                if (promise.done !== true) {
                    promise.reject(inputs.overTimeMessage || "timeout");
                }
            }, inputs.timeToReject);
        }
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
        positive: "\u001b[32m", default: "\u001b[97m", negative: "\u001b[31m"
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
    const logFailure = function TK_DebugTestFull_logFailure(summaryName, result) {
        console.warn("\n" +
            colorText("negative", ">> " + summaryName
                + " >> " + result.errorSource
                + " >> " + result.subject.name
                + " >> \"" + result.name + "\"\n"), ...logFailureNice(result.errorMessage).map(shortenValue));
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
    const summarizeFazitSync = function TK_DebugTestFull_summarizeFazitSync(inputs) {
        const { summary } = inputs;
        const counts = {
            failures: summary.failures.length,
            suspects: summary.missingSuspects.size
        };
        return "\n" +
            colorText((counts.failures === 0) ? "positive" : "negative", ">> " + summary.name + " >> " + counts.failures + " Error" + (counts.failures === 1 ? "" : "s"))
            + " / "
            + colorText("positive", summary.testCount + " test groups")
            + " / "
            + colorText("positive", "sync " + inputs.timeInitial + " ms");
    };
    const summarizeFazit = function TK_DebugTestFull_summarizeFazit(inputs) {
        const { summary } = inputs;
        const counts = {
            failures: summary.failures.length,
            suspects: summary.missingSuspects.size
        };
        return summarizeFazitSync(inputs) +
            colorText("positive", " + async " + inputs.timeFinal + " ms")
            + " / "
            + colorText((counts.suspects === 0) ? "positive" : "negative", counts.suspects + " untested suspects");
    };
    const logMissingSuspects = function TK_DebugTestFull_logMissingSuspects(summary) {
        const { missingSuspects } = summary;
        if (missingSuspects.size !== 0) {
            console.error("\n" +
                colorText("negative", ">> " + summary.name + " >> the following suspects have not been tested:"), Array.from(missingSuspects));
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
        const TKTest = ToolKid.debug.test;
        if (typeof inputs.title === "string") {
            TKTest.switchResultGroup(inputs.title);
        }
        let timeStart = Date.now();
        TKTest.setFailureHandler(logFailure.bind(null, TKTest.getResultGroup().name));
        ToolKid.nodeJS.loopFiles(Object.assign({}, inputs, {
            execute: require
        }));
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
            console.log(summarizeFazitSync({ summary, timeInitial })
                + " ... waiting for at least " + summary.pending.size + " more tests");
        }
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();
registeredFiles["TK_DebugTestFull.js"] = module.exports;

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

(function TK_DebugTestSummary_init() {
    const publicExports = module.exports = {};
    const beautifyDifferences = function TK_DebugTestSummary_beautifyDifferences(testResult) {
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
    const getAllMethods = function TK_DebugTestSummary_getAllMethods(suspect) {
        const result = [];
        if (typeof suspect === "function") {
            result[0] = suspect;
        }
        else if (typeof suspect !== "object" || suspect === null) {
            return result;
        }
        Object.values(suspect).forEach(function (value) {
            result.push(...getAllMethods(value));
        });
        return result;
    };
    const registerSuspect = function TK_DebugTestSummary_registerSuspect(suspectList, suspect) {
        const methods = getAllMethods(suspect);
        if (methods.length === 0) {
            suspectList.add(suspect);
        }
        else {
            methods.forEach(suspectList.add.bind(suspectList));
        }
    };
    let pendingSummaries = [];
    publicExports.getSummary = function TK_DebugTestSummary_getSummary(inputs = {}) {
        const { suspects, callback } = inputs;
        let missingSuspects = new Set();
        if (suspects !== undefined) {
            suspects.forEach(registerSuspect.bind(null, missingSuspects));
        }
        const summary = createSummary(Object.assign({}, ToolKid.debug.test.getResultGroup(), { missingSuspects }));
        if (typeof callback !== "function") {
            return summary;
        }
        if (summary.pending.size === 0) {
            callback(summary);
            return summary;
        }
        const boundData = {
            inputs,
            pendingCount: summary.pending.size
        };
        summary.pending.forEach(function TK_DebugTestSummary_watchPromise(promise) {
            promise.then(summaryCallback.bind(null, boundData));
        });
        return summary;
    };
    const summaryCallback = function TK_DebugTestSummary_summaryCallback(boundData) {
        boundData.pendingCount -= 1;
        if (boundData.pendingCount === 0) {
            publicExports.getSummary(boundData.inputs);
        }
    };
    const createSummary = function (inputs) {
        const resultGroupName = inputs.name;
        const summary = {
            name: resultGroupName,
            testCount: 0,
            failures: [],
            successes: new Map(),
            pending: new Set(),
            missingSuspects: inputs.missingSuspects,
            testedSuspects: new Set()
        };
        inputs.results.forEach(summaryRegisterResult.bind(null, summary));
        return summary;
    };
    const getSummaryFinal = function TK_DebugTestSummary_getSummaryFinal(summary) {
        const pos = pendingSummaries.indexOf(summary);
        if (pos !== -1) {
            pendingSummaries.splice(pos, 1);
        }
        const { callback } = summary;
        if (typeof callback === "function") {
            delete summary.callback;
            callback(summary);
        }
    };
    const summaryHandlePromise = function TK_DebugTestSummary_summaryHandlePromise(bound, result) {
        const { summary } = bound;
        summary.pending.delete(bound.promise);
        summary.testCount -= 1;
        summaryRegisterResult(summary, result);
        if (summary.pending.size === 0) {
            getSummaryFinal(summary);
        }
    };
    const summaryRegisterResult = function TK_DebugTest_summaryRegisterResult(summary, testResult) {
        summary.testCount += 1;
        if (testResult instanceof Promise) {
            summary.pending.add(testResult);
            const handleResolve = summaryHandlePromise.bind(null, {
                summary,
                promise: testResult
            });
            testResult.then(handleResolve);
            return;
        }
        removeSuspect(summary, testResult.subject);
        if (testResult.errorMessage === undefined) {
            summaryRegisterSuccess({
                list: summary.successes, testResult
            });
        }
        else {
            summary.failures.push(beautifyDifferences(testResult));
        }
    };
    // TODO: find the duplicate for TK_nodeJS_writeFile and remove this
    const removeSuspect = function TK_DebugTestSummary_removeSuspect(summary, subject) {
        if (summary.testedSuspects.has(subject)) {
            return;
        }
        summary.testedSuspects.add(subject);
        const { missingSuspects } = summary;
        if (missingSuspects.delete(subject) === false
            && typeof subject === "function") {
            const { name } = subject;
            missingSuspects.forEach(function TK_DebugTestSummary_removeSuspectFind(suspect) {
                if (typeof suspect === "function"
                    && suspect.name === name
                    && suspect.toString() === subject.toString()) {
                    summary.missingSuspects.delete(suspect);
                }
            });
        }
    };
    const summaryRegisterSuccess = function TK_DebugTest_summaryRegisterSuccess(inputs) {
        const { testResult } = inputs;
        const data = {
            name: testResult.name,
            time: testResult.time
        };
        const subjectDetails = inputs.list.get(testResult.subject);
        if (subjectDetails === undefined) {
            inputs.list.set(testResult.subject, [data]);
        }
        else {
            subjectDetails.push(data);
        }
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "test", functions: publicExports });
    }
})();
registeredFiles["TK_DebugTestSummary.js"] = module.exports;

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
    const { appendFileSync: extendFile, existsSync: isUsedPath, readFileSync: readFile, rmSync: deleteFolder, unlinkSync: deleteFile } = require("fs");
    const { resolve: resolvePath } = require("path");
    const publicExports = module.exports = {};
    publicExports.deleteFile = function TK_nodeJSFile_deleteFile(inputs) {
        if (typeof inputs === "string") {
            inputs = { path: inputs };
        }
        if (!isUsedPath(inputs.path)) {
            return;
        }
        if (ToolKid.nodeJS.isDirectory(inputs.path)) {
            deleteFolder(inputs.path, { recursive: true });
        }
        else {
            deleteFile(inputs.path);
        }
    };
    publicExports.extendFile = function TK_nodeJSFile_extendFile(inputs) {
        if (isUsedPath(inputs.path)) {
            extendFile(inputs.path, inputs.content);
        }
        else {
            ToolKid.nodeJS.writeFile(inputs);
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
    const publicExports = module.exports = {};
    publicExports.createStringCheck = function LibraryTools_createStringCheck(inputs) {
        const hasIncludes = publicExports.isArray(inputs.include);
        const hasExcludes = publicExports.isArray(inputs.exclude);
        if (hasIncludes && hasExcludes) {
            return publicExports.partial(checkStringConditions, inputs);
        }
        else if (hasIncludes) {
            return publicExports.partial(checkStringInclusion, inputs.include);
        }
        else if (hasExcludes) {
            return publicExports.partial(checkStringExclusion, inputs.exclude);
        }
        else {
            return function LibraryTools_checkNothing() { return true; };
        }
    };
    const checkString = function LibraryTools_checkString(value, expression) {
        return expression.test(value);
    };
    const checkStringConditions = function LibraryTools_checkStringConditions(conditions, value) {
        const test = publicExports.partial(checkString, value);
        return conditions.include.find(test) !== undefined
            && conditions.exclude.find(test) === undefined;
    };
    const checkStringExclusion = function checkStringExclusion(exclude, value) {
        const test = publicExports.partial(checkString, value);
        return exclude.find(test) === undefined;
    };
    const checkStringInclusion = function checkStringInclusion(include, value) {
        const test = publicExports.partial(checkString, value);
        return include.find(test) !== undefined;
    };
    // TODO: replacements more structured, maybe backwards compatible
    // const replacements = {
    //     "\\": "\\\\",
    //     ".": "\\.",
    //     "\*": ".+"
    // };
    publicExports.createSimpleRegxp = function LibraryTools_createSimpleRegxp(expression) {
        expression = expression.replaceAll("\\", "\\\\");
        expression = expression.replaceAll(".", "\\.");
        expression = expression.replaceAll("\*", ".+");
        //expression = expression.replace(replaceRegex, createSimpleRegxpReplacer);
        return new RegExp("^" + expression + "$");
    };
    // var replaceRegex = new RegExp('[' + Object.keys(replacements).join('') + ']', 'ig');
    // const createSimpleRegxpReplacer = function (old:string) {
    //     return replacements[<".">old];
    // };
    publicExports.isArray = function LibraryTools_isArray(value) {
        return value instanceof Array && value.length !== 0;
    };
    publicExports.partial = function LibraryTools_partial(baseFunction, ...inputs) {
        if (inputs.length === 0) {
            throw ["LibraryTools_partial - no inputs to preset for:", baseFunction];
        }
        const result = baseFunction.bind(null, ...inputs);
        if (baseFunction.presetInputs instanceof Array) {
            result.presetInputs = [...baseFunction.presetInputs, ...inputs];
        }
        else {
            result.presetInputs = inputs;
        }
        return result;
    };
    Object.freeze(publicExports);
})();
registeredFiles["LibraryTools.js"] = module.exports;

ToolKid.registerFunction({section:"dataTypes", subSection:"checks", functions: {
            isArray:module.exports.isArray,
        }});

(function LibraryTools_nodeJS_init() {
    const FS = require("fs");
    const Path = require("path");
    const isCalledFromLibrary = (Path.basename(__dirname) === "LibraryFiles");
    const LibraryTools = isCalledFromLibrary
        ? require(Path.resolve(__dirname, "./LibraryTools.js"))
        //@ts-ignore
        : registeredFiles["LibraryTools.js"];
    const { createSimpleRegxp } = LibraryTools;
    const { existsSync: isUsedPath, lstatSync: readPathStats, readdirSync: readDirectory } = FS;
    const { normalize, resolve: resolvePath } = Path;
    const publicExports = module.exports = Object.assign({}, LibraryTools);
    publicExports.isDirectory = function LibraryTools_nodeJS_isDirectory(path) {
        return readPathStats(path).isDirectory();
    };
    const listPaths = function LibraryTools_nodeJS_listPaths(expressions) {
        if (typeof expressions === "string") {
            expressions = [expressions];
        }
        else if (!(expressions instanceof Array)) {
            return [];
        }
        return expressions.map(normalize);
    };
    publicExports.loopFiles = function LibraryTools_nodeJS_loopFiles(inputs) {
        const pathCheck = publicExports.createStringCheck({
            include: listPaths(inputs.include).map(createSimpleRegxp),
            exclude: listPaths(inputs.exclude).map(createSimpleRegxp),
        });
        const privateData = {
            isIncluded: pathCheck,
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
    const loopFilesFrom = function LibraryTools_nodeJS_loopFilesFrom(privateData, path) {
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
    const loopFilesFromDirectory = function LibraryTools_nodeJS_loopFilesFromDirectory(privateData, path) {
        readDirectory(path).forEach(publicExports.partial(loopFilesExecute, privateData, path));
    };
    const loopFilesExecute = function LibraryTools_nodeJS_loopFilesExecute(boundInputs, root, path) {
        path = resolvePath(root, path);
        if (publicExports.isDirectory(path)) {
            loopFilesFromDirectory(boundInputs, path);
            return;
        }
        if (boundInputs.isIncluded(path)) {
            boundInputs.execute(path);
        }
    };
    publicExports.readFileName = function LibraryTools_nodeJS_readFileName(path) {
        if (typeof path !== "string" || path === "") {
            throw ["LibraryTools_nodeJS_readFileName - invalid path argument:", path];
        }
        return Path.basename(path);
    };
    publicExports.resolvePath = function LibraryTools_nodeJS_resolvePath(...parts) {
        return Path.resolve(...parts);
    };
    const writeDirectory = function LibraryTools_nodeJS_writeDirectory(path) {
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
    publicExports.writeFile = function LibraryTools_nodeJS_writeFile(inputs) {
        const path = resolvePath(inputs.path);
        writeDirectory(Path.dirname(path));
        FS.writeFileSync(inputs.path, inputs.content, { encoding: inputs.encoding });
    };
    Object.freeze(publicExports);
})();
registeredFiles["LibraryTools_nodeJS.js"] = module.exports;

ToolKid.registerFunction({section:"nodeJS", functions: {
            loopFiles:module.exports.loopFiles,
            writeFile:module.exports.writeFile,
        }});

global.log = ToolKid.debug.terminal.logImportant;
module.exports = ToolKid;
})();