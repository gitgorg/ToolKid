"use strict";
(function Library_bundledFiles_init() {
const fileCollection = new Map();


console.log("\u001b[96m>>  activating ToolKid");
"use strict";
(function LibraryCore_init() {
    const coreModuleNames = {
        "building": "LibraryBuild.js",
        "files": "LibraryFiles.js",
        "regularExpression": "LibraryRegularExpression.js",
        "parsing": "LibraryParsing.js",
    };
    const coreModules = {};
    const publicExports = module.exports = {};
    publicExports.createInstance = function LibraryCore_createInstance() {
        const result = {};
        addAsReadOnly({
            container: result,
            key: "register",
            value: register.bind(null, result)
        });
        addAsReadOnly({
            container: result,
            key: "getCoreModule",
            value: getCoreModule.bind(null, result)
        });
        return result;
    };
    const addAsReadOnly = function LibraryCore_addAsReadOnly(inputs) {
        Object.defineProperty(inputs.container, inputs.key, {
            enumerable: false,
            value: inputs.value,
            writable: false
        });
    };
    const addAsReadOnlyEnumerable = function LibraryCore_addAsReadOnlyEnumerable(inputs) {
        Object.defineProperty(inputs.container, inputs.key, {
            enumerable: true,
            value: inputs.value,
            writable: false
        });
    };
    publicExports.freezeDeep = function TK_LiraryCore_freezeDeep(object) {
        if (Object.isFrozen(object)) {
            return object;
        }
        Object.freeze(object);
        for (let key in object) {
            publicExports.freezeDeep(object[key]);
        }
        return object;
    };
    const getCoreModule = function LibraryCore_getCoreModule(library, moduleName) {
        if (coreModules[moduleName] !== undefined) {
            return coreModules[moduleName];
        }
        const path = coreModuleNames[moduleName];
        if (path === undefined) {
            throw [
                "LibraryCore_getCoreModule - unknonw core module name:", moduleName,
                "allowed extensions are:", Object.keys(coreModuleNames)
            ];
        }
        const module = coreModules[moduleName] = require(require("path").resolve(__dirname, "./" + path));
        if (typeof module === "function") {
            module(library);
        }
        return module;
    };
    publicExports.getCoreModule = getCoreModule.bind(null, publicExports);
    publicExports.registerCoreModule = function LibraryCore_registerCoreModule(inputs) {
        const { name, module } = inputs;
        if (coreModules[name] === undefined) {
            coreModules[name] = module;
            if (typeof module === "function") {
                module(publicExports);
            }
        }
        else {
            throw [
                "LibraryCore_registerCoreModule - tried to overwrite " + name + ": current value = ", coreModules[name], " new value = ", inputs.module
            ];
        }
    };
    const register = function LibraryCore_register(library, inputs) {
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
        const { entries } = inputs;
        for (let name in entries) {
            registerEntryToSection({
                section, name, entry: entries[name]
            });
        }
    };
    const registerEntryToSection = function LibraryCore_registerEntryToSection(inputs) {
        if (typeof inputs.name !== "string") {
            throw ["LibraryCore_registerEntryToSection - invalid name: ", inputs.name, "inside: ", inputs];
        }
        const { entry } = inputs;
        if (entry === null || ["function", "object"].indexOf(typeof entry) === -1) {
            throw ["LibraryCore_registerEntryToSection - invalid helper: ", entry, "inside: ", inputs];
        }
        const { section, name } = inputs;
        if (section[name] !== undefined) {
            throw ["overwriting library methods is forbidden. tried to overwrite ." + name + ": ", section[name], " with: ", entry];
        }
        addAsReadOnlyEnumerable({
            container: section,
            key: name,
            value: publicExports.freezeDeep(entry),
        });
    };
    const registerSection = function LibraryCore_registerSection(inputs) {
        let section = inputs.container[inputs.name];
        if (section !== undefined) {
            return section;
        }
        section = {};
        addAsReadOnlyEnumerable({
            container: inputs.container,
            key: inputs.name,
            value: section
        });
        return section;
    };
})();
global.ToolKid = module.exports.createInstance();
fileCollection.set("LibraryCore.js", module.exports);

"use strict";
(function LibraryRegularExpression_init() {
    const publicExports = module.exports = {};
    const checkString = function LibraryRegularExpression_checkString(value, expression) {
        return expression.test(value);
    };
    const checkStringConditions = function LibraryRegularExpression_checkStringConditions(conditions, value) {
        const test = checkString.bind(null, value);
        return conditions.includes.find(test) !== undefined
            && conditions.excludes.find(test) === undefined;
    };
    const checkStringExclusion = function checkStringExclusion(exclude, value) {
        const test = checkString.bind(null, value);
        return exclude.find(test) === undefined;
    };
    const checkStringInclusion = function checkStringInclusion(include, value) {
        const test = checkString.bind(null, value);
        return include.find(test) !== undefined;
    };
    const escapeSimpleRX = new RegExp("(\\*\\*)|(\\*)|\\" + [
        ".", "+", "?", "{", "}", "[", "]", "\\"
    ].join("|\\"), "g");
    publicExports.createSimpleRX = function LibraryRegularExpression_createSimpleRX(inputs) {
        if (typeof inputs === "string") {
            inputs = { pattern: inputs };
        }
        let pattern = inputs.pattern;
        pattern = pattern.replace(escapeSimpleRX, function LibraryRegularExpression_createSimpleRXEscape(match, doubleStar, star) {
            if (doubleStar !== undefined) {
                return ".*";
            }
            else if (star !== undefined) {
                return ".*?";
            }
            return "\\" + match;
        });
        if (inputs.isFromStartToEnd === true) {
            pattern = "^" + pattern + "$";
        }
        // regExp flags explained on top /\
        let flags = "s";
        if (inputs.isRepeatable === true) {
            flags += "g";
        }
        return new RegExp(pattern, flags);
    };
    // TODO: replacements more structured, maybe backwards compatible
    // const replacements = {
    //     "\\": "\\\\",
    //     ".": "\\.",
    //     "\*": ".+"
    // };
    publicExports.createStringChecker = function LibraryRegularExpression_createStringChecker(inputs) {
        const hasIncludes = isArray(inputs.includes);
        const hasExcludes = isArray(inputs.excludes);
        if (hasIncludes && hasExcludes) {
            return checkStringConditions.bind(null, inputs);
        }
        else if (hasIncludes) {
            return checkStringInclusion.bind(null, inputs.includes);
        }
        else if (hasExcludes) {
            return checkStringExclusion.bind(null, inputs.excludes);
        }
        else {
            return function LibraryRegularExpression_checkNothing() { return true; };
        }
    };
    const isArray = function LibraryRegularExpression_isArray(value) {
        return value instanceof Array && value.length !== 0;
    };
    Object.freeze(publicExports);
})();
fileCollection.get("LibraryCore.js").registerCoreModule({
    name: "regularExpression", module: module.exports
});
fileCollection.set("LibraryRegularExpression.js", module.exports);

"use strict";
(function LibraryFiles_init() {
    const { existsSync: isUsedPath, mkdirSync: createDirectory, lstatSync: readPathStats, readdirSync: readDirectory, readFileSync: readFile, writeFileSync: createFile, } = require("fs");
    const { dirname: directoryName, normalize: normalizePath, resolve: resolvePath, } = require("path");
    let { createSimpleRX, createStringChecker } = {};
    const publicExports = module.exports = function LibraryFiles_setup(core) {
        ({ createSimpleRX, createStringChecker } = core.getCoreModule("regularExpression"));
    };
    const collectPaths = function LibraryFiles_collectPaths(expressions) {
        if (!(expressions instanceof Array)) {
            return [];
        }
        const result = [];
        expressions.map(collectPathsFilter.bind(null, result));
        return result;
    };
    const collectPathsFilter = function LibraryFiles_collectPathsFilter(validated, expression) {
        if (typeof expression === "string") {
            validated.push(createSimpleRX({
                pattern: normalizePath(expression),
                isFromStartToEnd: true,
            }));
        }
        else if (expression instanceof RegExp) {
            validated.push(expression);
        }
    };
    publicExports.createPathChecker = function (inputs) {
        return createStringChecker({
            includes: collectPaths(inputs.includes),
            excludes: collectPaths(inputs.excludes),
        });
    };
    const isDirectory = function LibraryFiles_isDirectory(path) {
        return readPathStats(path).isDirectory();
    };
    publicExports.loopFiles = function LibraryFiles_loopFiles(inputs) {
        const privateData = {
            isIncluded: inputs.pathChecker || publicExports.createPathChecker(inputs),
            execute: inputs.execute,
        };
        const { path } = inputs;
        if (path instanceof Array) {
            path.forEach(loopFilesFrom.bind(null, privateData));
        }
        else {
            loopFilesFrom(privateData, path);
        }
    };
    const loopFilesFrom = function LibraryFiles_loopFilesFrom(privateData, path) {
        path = resolvePath(path);
        if (!isUsedPath(path)) {
            throw ["LibraryFiles_loopFiles - no such path exists:", path];
        }
        if (isDirectory(path)) {
            loopFilesFromDirectory(privateData, path);
        }
        else {
            loopFilesExecute(privateData, "", path);
        }
    };
    const loopFilesFromDirectory = function LibraryFiles_loopFilesFromDirectory(privateData, path) {
        readDirectory(path).forEach(loopFilesExecute.bind(null, privateData, path));
    };
    const loopFilesExecute = function LibraryFiles_loopFilesExecute(privateData, root, path) {
        path = resolvePath(root, path);
        if (isDirectory(path)) {
            loopFilesFromDirectory(privateData, path);
            return;
        }
        if (privateData.isIncluded(path)) {
            privateData.execute(path);
        }
    };
    publicExports.readFile = function LibraryFiles_readFile(inputs) {
        if (typeof inputs === "string") {
            inputs = { path: inputs };
        }
        let path = resolvePath(inputs.path);
        if (inputs.checkExistance !== false) {
            if (!isUsedPath(path)) {
                return { content: undefined };
            }
            else if (isDirectory(path)) {
                throw ["LibraryFiles_readFile - path is a directory, not a file:", path];
            }
        }
        let { encoding } = inputs;
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
    publicExports.resolvePath = resolvePath;
    const writeDirectory = function LibraryFiles_writeDirectory(path) {
        if (isUsedPath(path)) {
            return;
        }
        const rootPath = directoryName(path);
        if (!isUsedPath(rootPath)) {
            writeDirectory(rootPath);
        }
        try {
            createDirectory(path);
        }
        catch (err) {
            console.warn(err);
        }
    };
    publicExports.writeFile = function LibraryFiles_writeFile(inputs) {
        const path = resolvePath(inputs.path);
        writeDirectory(directoryName(path));
        try {
            createFile(inputs.path, inputs.content, { encoding: inputs.encoding });
        }
        catch (error) {
            console.error(["LibraryFiles_writeFile failed - path:", path, "content:", inputs.content, "encoding:", inputs.encoding, "error:", error]);
            return error;
        }
    };
    Object.freeze(publicExports);
})();
fileCollection.get("LibraryCore.js").registerCoreModule({
    name: "files", module: module.exports
});
fileCollection.set("LibraryFiles.js", module.exports);

"use strict";
// regExp flags:
// g = to store .lastIndex inside the regExp
// s = to make . match really EVERY character...
// v = to support all the new unicode stuff
(function LibraryParsing_init() {
    const publicExports = module.exports = {};
    const skipLayer = function LibraryParsing_skipLayer() { };
    publicExports.createTextParser = function LibraryParsing_createTextParser(inputs) {
        const analysed = a_analyseTextParserConfig(inputs);
        if (analysed instanceof Error) {
            return analysed;
        }
        const layers = {
            ROOT: {
                data: { name: "ROOT" },
                openings: [],
                closings: [],
                contains: []
            }
        };
        const { layerDefinition } = inputs;
        const { removedLayers } = analysed;
        for (const [layerName, parsers] of Object.entries(analysed.layerParsers)) {
            b_createTextParserLayer(layerDefinition[layerName], layers, removedLayers, layerName, parsers);
        }
        Object.values(layers).forEach(c_connectTextParserLayers.bind(null, layers, removedLayers));
        Object.values(layers).forEach(d_cleanUpTextParserLayer);
        return e_parseTextLayer.bind(null, layers.ROOT);
    };
    const a_analyseTextParserConfig = function LibraryParsing_analyseTextParserConfig(inputs) {
        const { layerDefinition } = inputs;
        const layerParsers = {};
        const removedLayers = new Set();
        let parserSet;
        let layerName = "";
        for (let [parser, names] of inputs.parsers.entries()) {
            if (parser === "SKIP") {
                parser = skipLayer;
            }
            else if (typeof parser !== "function" && parser !== "REMOVE") {
                const error = new Error("invalid parser");
                error.details = {
                    names, parser
                };
                return error;
            }
            if (typeof names === "string") {
                names = [names];
            }
            else if (!(names instanceof Array)) {
                const error = new Error("invalid layer names");
                error.details = {
                    parser, layerNames: names,
                };
                return error;
            }
            for (layerName of names) {
                if (layerName[0] === "<") {
                    layerName = layerName.slice(1);
                    parserSet = layerParsers[layerName] || [parser, skipLayer];
                    parserSet[0] = parser;
                }
                else if (layerName[0] === ">") {
                    layerName = layerName.slice(1);
                    parserSet = layerParsers[layerName] || [skipLayer, parser];
                    parserSet[1] = parser;
                }
                else {
                    parserSet = layerParsers[layerName] || [parser, parser];
                }
                if (layerDefinition[layerName] !== undefined
                    || layerName === "*") {
                    layerParsers[layerName] = parserSet;
                    continue;
                }
                const error = new Error("unknown layer name");
                error.details = {
                    layerName, validLayerNames: Object.keys(layerDefinition)
                };
                return error;
            }
        }
        const wildCards = layerParsers["*"];
        delete layerParsers["*"];
        const error = new Error("missing parser");
        for (const name of Object.keys(layerDefinition)) {
            parserSet = layerParsers[name];
            if (parserSet === undefined) {
                if (wildCards === undefined) {
                    error.details = "parsers for: " + name;
                    return error;
                }
                parserSet = wildCards.slice(0);
            }
            if (parserSet[0] === undefined) {
                if (wildCards[0] === undefined) {
                    error.details = "opening for: " + name;
                    return error;
                }
                parserSet[0] = wildCards[0];
            }
            if (parserSet[1] === undefined) {
                if (wildCards[1] === undefined) {
                    error.details = "closing for:" + name;
                    return error;
                }
                parserSet[1] = wildCards[1];
            }
            if (parserSet.includes("REMOVE")) {
                removedLayers.add(name);
            }
            else {
                layerParsers[name] = parserSet;
            }
        }
        // oder according to layerDefinition
        const orderedParsers = {};
        for (layerName of Object.keys(layerDefinition)) {
            if (layerParsers[layerName] !== undefined) {
                orderedParsers[layerName] = layerParsers[layerName];
            }
        }
        return {
            layerParsers: orderedParsers,
            removedLayers,
        };
    };
    const b_createTextParserLayer = function LibraryParsing_createTextParserLayer(layerConfig, layers, removedLayers, layerName, parsers) {
        if (removedLayers.has(layerName)) {
            return;
        }
        const layer = layers[layerName] = {
            openings: [],
            closings: [],
            parseOpening: parsers[0],
            parseClosing: parsers[1],
            contains: layerConfig.contains,
            data: (typeof layerConfig.layerData === "object")
                ? Object.assign({}, layerConfig.layerData, { name: layerName })
                : { name: layerName }
        };
        layerConfig.patterns.forEach(function LibraryParsing_createTextParserLayerBrackets(pattern) {
            if (pattern instanceof Array) {
                layer.openings.push(getTextFromRX(pattern[0]));
                layer.closings.push(getTextFromRX(pattern[1]));
            }
            else {
                layer.openings.push(getTextFromRX(pattern));
                layer.closings.push(undefined);
            }
        });
        if (layerConfig.isROOTLayer !== false) {
            layers.ROOT.contains.push(layerName);
        }
    };
    const c_connectTextParserLayers = function LibraryParsing_connectTextParserLayers(layers, removedLayers, layer) {
        layer.signals = layer.closings.slice(0);
        const directions = layer.directions = Array(layer.signals.length);
        if (!(layer.contains instanceof Array) || layer.contains.length === 0) {
            // regExp flags explained on top /\
            layer.pattern = new RegExp("(" + layer.signals.join(")|(") + ")", "gs");
            return;
        }
        layer.contains.forEach(function LibraryParsing_connectTextParserLayer(name) {
            if (removedLayers.has(name)) {
                return;
            }
            if (name === "ROOT") {
                layer.signals.push(...layers.ROOT.signals);
                directions.push(...layers.ROOT.directions);
            }
            else {
                const subLayer = layers[name];
                if (subLayer === undefined) {
                    throw [
                        "LibraryParsing_connectTextParserLayer - unknown layer key: ", name, "inside: ", layer
                    ];
                }
                layer.signals.push(...subLayer.openings);
                const count = subLayer.openings.length;
                for (let i = 0; i < count; i += 1) {
                    directions.push([
                        subLayer, //next layer
                        subLayer.closings.indexOf(subLayer.closings[i]) //expected index for closing
                    ]);
                }
            }
        });
        // regExp flags explained on top /\
        layer.pattern = new RegExp("(" + layer.signals.join(")|(") + ")", "gs");
    };
    const d_cleanUpTextParserLayer = function LibraryParsing_cleanUpTextParserLayer(layer) {
        delete layer.openings;
        delete layer.closings;
        delete layer.signals;
        delete layer.contains;
        Object.freeze(layer.data);
    };
    const e_parseTextLayer = function LibraryParsing_parseTextLayer(layer, inputs) {
        if (typeof inputs === "string") {
            inputs = { text: inputs };
        }
        const { text } = inputs;
        let layerDepth = 0;
        let lastIndex = layer.pattern.lastIndex = 0;
        let RXResult = layer.pattern.exec(text);
        const layerStack = new Array(20);
        layerStack[0] = layer;
        const resultStack = new Array(20);
        resultStack[0] = RXResult;
        let resultString = "";
        let signalIndex = 1;
        const wantedSignalIDs = new Array(20);
        let found;
        while (RXResult !== null) {
            signalIndex = 1;
            while (RXResult[signalIndex] === undefined) {
                signalIndex += 1;
            }
            lastIndex = layer.pattern.lastIndex;
            resultString = RXResult[0];
            signalIndex -= 1;
            //opening
            if (layer.directions[signalIndex] !== undefined) {
                found = layer.directions[signalIndex];
                layer = found[0];
                layerDepth += 1;
                layerStack[layerDepth] = layer;
                resultStack[layerDepth] = RXResult;
                wantedSignalIDs[layerDepth] = found[1];
                if (resultString === "") {
                    layer.pattern.lastIndex += 1;
                }
                else {
                    layer.parseOpening(RXResult, layer.data, inputs, layerDepth);
                    layer.pattern.lastIndex = lastIndex;
                }
                RXResult = layer.pattern.exec(text);
                continue;
            }
            //closing
            //    unexpected
            if (wantedSignalIDs[layerDepth] !== signalIndex) {
                if (resultString === "") {
                    layer.pattern.lastIndex += 1;
                }
                RXResult = layer.pattern.exec(text);
                continue;
            }
            //    expected
            layer.parseClosing(RXResult, layerStack[layerDepth].data, inputs, layerDepth, resultStack[layerDepth]);
            layerDepth -= 1;
            layer = layerStack[layerDepth];
            layer.pattern.lastIndex = lastIndex;
            RXResult = layer.pattern.exec(text);
        }
        if (layerDepth === 0) {
            return;
        }
        const error = new Error("not all layers closed");
        error.layerStack = layerStack.slice(1, layerDepth + 1);
        error.resultStack = resultStack.slice(1, layerDepth + 1);
        return error;
    };
    publicExports.createTextReplacer = function LibraryParsing_createTextReplacer(inputs) {
        const parsers = new Map();
        if (inputs.parseOpenings !== undefined) {
            parsers.set(replaceOpening.bind(null, inputs.parseOpenings), "<*");
        }
        if (inputs.parseClosings !== undefined) {
            parsers.set(replaceClosing.bind(null, inputs.parseClosings), ">*");
        }
        const parser = publicExports.createTextParser({
            layerDefinition: inputs.layerDefinition,
            parsers
        });
        return replaceTextLayered.bind(null, parser);
    };
    const replaceOpening = function LibraryParsing_replaceOpening(parser, RXResult, layerData, inputs, layerDepth) {
        const returned = parser(RXResult, layerData, inputs, layerDepth);
        if (returned instanceof Array && returned.length !== 0) {
            inputs.result.push(inputs.text.slice(inputs.position, RXResult.index), ...returned);
            inputs.position = RXResult.index + RXResult[0].length;
            return;
        }
        else if (typeof returned !== "string") {
            return;
        }
        inputs.result.push(inputs.text.slice(inputs.position, RXResult.index), returned);
        inputs.position = RXResult.index + RXResult[0].length;
    };
    const replaceClosing = function LibraryParsing_replaceClosing(parser, RXResult, layerData, inputs, layerDepth, RXOpening) {
        const returned = parser(RXResult, layerData, inputs, layerDepth, RXOpening);
        if (returned instanceof Array && returned.length !== 0) {
            if (typeof returned[0] === "number") {
                inputs.result.push(inputs.text.slice(inputs.position, returned[0]), returned[2]);
                inputs.position = returned[1];
            }
            else {
                inputs.result.push(inputs.text.slice(inputs.position, RXOpening.index), ...returned);
                inputs.position = RXResult.index + RXResult[0].length;
            }
            return;
        }
        else if (typeof returned !== "string") {
            return;
        }
        inputs.result.push(inputs.text.slice(inputs.position, RXOpening.index), returned);
        inputs.position = RXResult.index + RXResult[0].length;
    };
    const replaceTextLayered = function LibraryParsing_replaceTextLayered(parser, inputs) {
        if (typeof inputs === "string") {
            inputs = { text: inputs, result: [], position: 0 };
        }
        else {
            inputs = Object.assign({ result: [], position: 0 }, inputs);
        }
        parser(inputs);
        inputs.result.push(inputs.text.slice(inputs.position));
        return inputs.result;
    };
    // regExp flags explained on top /\
    const escapeCharsRX = new RegExp([
        "\\.", "*", "+", "?", "{", "}", "(", ")", "[", "]", "\\"
    ].join("|\\"), "g");
    const escapeRX = function LibraryParsing_escapeRX(text) {
        return text.replace(escapeCharsRX, escapeRXReplacer);
    };
    const escapeRXReplacer = function LibraryParsing_escapeRXReplacer(match) {
        return "\\" + match;
    };
    publicExports.getLayerDefinition = function LibraryParsing_getLayerDefinition() {
        return {
            comment: {
                patterns: [
                    ["//", /\n|$/],
                    ["/*", "*/"]
                ],
            },
            text: {
                patterns: [
                    ["\"", "\""],
                    ["'", "'"],
                    ["`", "`"]
                ],
                contains: ["escape"],
            },
            escape: {
                isROOTLayer: false,
                patterns: [
                    /\\./s
                ],
            },
        };
    };
    const getTextFromRX = function LibraryParsing_getTextFromRX(value) {
        if (value instanceof RegExp) {
            return value.source;
        }
        else if (typeof value === "string") {
            return escapeRX(value);
        }
        else {
            return value;
        }
    };
    publicExports.readLayerContent = function LibraryParsing_readLayerContent(inputs) {
        if (typeof inputs[4] === undefined) {
            throw ["LibraryParsing_readLayerContent - inputs missing 5. argument (opening)"];
        }
        return inputs[2].text.slice(inputs[4].index + inputs[4][0].length, inputs[0].index);
    };
    Object.freeze(publicExports);
})();
fileCollection.get("LibraryCore.js").registerCoreModule({
    name: "parsing", module: module.exports
});
fileCollection.set("LibraryParsing.js", module.exports);

"use strict";
(function TK_CodeCDW_init() {
    const { readLayerContent } = ToolKid.getCoreModule("parsing");
    const publicExports = module.exports = {};
    publicExports.textLayerDefinition = {
        cdw_comment: {
            patterns: [["//", /\n|$/], ["/*", "*/"]],
        },
        //text
        cdw_text: {
            patterns: [["'", "'"]],
            contains: ["cdw_textEscape", "cdw_textParse"]
        },
        cdw_textEscape: {
            patterns: [["\\", /./]],
            isROOTLayer: false
        },
        cdw_textParse: {
            patterns: [["{{", "}}"]],
            contains: ["ROOT"],
            isROOTLayer: false
        },
        cdw_funkDeclare: {
            patterns: [["{:", ":}"]],
            contains: ["ROOT"]
        },
        cdw_funkCall: {
            patterns: [["(", ")"]],
            contains: ["ROOT"]
        },
        cdw_closure: {
            patterns: [["{{", "}}"]],
            contains: ["ROOT"]
        },
        cdw_list: {
            patterns: [["[", "]"]],
            contains: ["ROOT"]
        },
        // file connections
        cdw_import: {
            patterns: [["#import(", ")"]],
            layerData: { fileConnection: "insert" },
        },
        cdw_importMaybe: {
            patterns: [["#load(", ")"]],
            contains: ["ROOT"],
            layerData: {
                fileConnection: "optional",
                readLayerContent: function TK_CodeCDW_readImportMaybe(inputs) {
                    const content = readLayerContent(inputs)
                        .split(",")[0].trim();
                    return (content[0] === "'"
                        && content.length > 2
                        && content[content.length - 1] === "'") ? content.slice(1, -1) : undefined;
                }
            },
        },
        cdw_insertAfter: {
            patterns: [["#insertAfter(", ")"]],
            layerData: { fileConnection: "optional" },
        },
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "CDW", entries: publicExports });
    }
})();

fileCollection.set("TK_CodeCDW.js", module.exports);

"use strict";
(function TK_CodeCSS_init() {
    const { readLayerContent } = ToolKid.getCoreModule("parsing");
    const publicExports = module.exports = {};
    publicExports.textLayerDefinition = {
        css_comment: {
            patterns: [["/*", "*/"]]
        },
        css_string: {
            patterns: [["\"", "\""], ["'", "'"]]
        },
        css_url: {
            patterns: [["url(", ")"]],
            layerData: {
                fileConnection: "optional",
                readLayerContent: function TK_CodeCSS_readURL(inputs) {
                    const content = readLayerContent(inputs).trim();
                    const firstChar = content[0];
                    if (content.length > 2
                        && (firstChar === "'" || firstChar === '"')
                        && content[content.length - 1] === firstChar) { //removing quotes
                        return content.slice(1, -1);
                    }
                    else {
                        return content.length > 1 ? content : undefined;
                    }
                }
            }
        },
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "CSS", entries: publicExports });
    }
})();

fileCollection.set("TK_CodeCSS.js", module.exports);

"use strict";
(function TK_CodeCSV_init() {
    // const { readLayerContent } = ToolKid.getCoreModule("parsing");
    const publicExports = module.exports = {};
    // publicExports.textLayerDefinition = {
    //     csv_text: {
    //         patterns: [["\"", "\""], ["'", "'"]],
    //         contains: ["csv_escape"],
    //     },
    //     csv_escape: {
    //         patterns: [/\\./s],
    //         isROOTLayer: false,
    //     },
    //     csv_newLine: {
    //         patterns: [/\r\n|\r|\n/],
    //     },
    //     csv_newValue: {
    //         patterns: [","],
    //     },
    // };
    // const parser = ToolKid.getCoreModule("parsing").createTextParser({
    //     layerDefinition: publicExports.textLayerDefinition,
    //     parseOpenings: function (opening, layerData, inputs): any {
    //         if (layerData.name === "csv_newValue") {
    //             inputs.line.push(inputs.text.slice(inputs.position, opening.index).trim());
    //             inputs.position = opening.index + 1;
    //         } else if (layerData.name === "csv_newLine") {
    //             inputs.line.push(inputs.text.slice(inputs.position, opening.index).trim());
    //             inputs.result.push(inputs.line);
    //             inputs.line = [];
    //             inputs.position = opening.index;
    //         }
    //     },
    // });
    // publicExports.parse = function (text: string) {
    //     const inputs = {
    //         text,
    //         position: 0,
    //         line: [],
    //         result: [],
    //     }
    //     parser(inputs);
    //     return inputs.result;
    // };
    const RX_newLine = /\r\n|\r|\n/;
    publicExports.parse = function TK_CodeCSV_parse(text) {
        const linesText = text.trim().split(RX_newLine);
        const length = linesText.length;
        let lineArray = parseLine(linesText[0]);
        const columnCount = lineArray.length;
        const linesArray = new Array(linesText.length);
        let x = 0;
        let value;
        for (let y = 0; y < length; y += 1) {
            lineArray = parseLine(linesText[y]);
            if (lineArray.length !== columnCount) {
                console.warn("line count differs from head line " + (y + 1), ":", [linesText[y]], columnCount + " needed columns", lineArray);
                return linesArray;
            }
            for (x = 0; x < columnCount; x += 1) {
                value = lineArray[x].trim();
                if (value.length === 0) {
                    lineArray[x] = undefined;
                }
                else if (!isNaN(value)) {
                    lineArray[x] = parseFloat(value);
                }
                else {
                    if (value[0] === '"' && value[value.length - 1] === '"') {
                        lineArray[x] = value.slice(1, -1);
                    }
                    else {
                        lineArray[x] = value;
                    }
                }
            }
            linesArray[y] = lineArray;
        }
        return linesArray;
    };
    const RX_separator = /(,)|(\\")|(")/g;
    const lineParts = new Array(100);
    const parseLine = function (text) {
        RX_separator.lastIndex = 0;
        let index = 0;
        let found = RX_separator.exec(text);
        let position = 0;
        let insideString = false;
        while (found !== null) {
            if (insideString === false) {
                if (found[1] !== undefined) {
                    lineParts[index] = text.slice(position, found.index).trim();
                    index += 1;
                    position = found.index + 1;
                }
                else {
                    insideString = true;
                }
            }
            else {
                if (found[3] !== undefined) {
                    insideString = false;
                }
            }
            found = RX_separator.exec(text);
        }
        const rest = text.slice(position).trim();
        if (rest.length !== 0) {
            lineParts[index] = rest;
        }
        return lineParts.slice(0, index + 1);
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "CSV", entries: publicExports });
    }
})();

fileCollection.set("TK_CodeCSV.js", module.exports);

"use strict";
(function TK_CodeParsing_init() {
    const publicExports = module.exports = {};
    const RXAnyChararcter = /\S/g;
    publicExports.addIndentation = function TK_CodeParsing_addIndentation(text, indentation) {
        if (indentation === 0
            || (typeof indentation === "string" && indentation.length === 0)) {
            return [text];
        }
        const parts = new Array(100);
        const addition = (typeof indentation === "string")
            ? indentation
            : new Array(indentation).join(" ");
        const { length } = text;
        let position = 0;
        let nextPosition = 0;
        let i = 0;
        while (position < length) {
            nextPosition = text.indexOf("\n", position);
            if (nextPosition === -1) {
                break;
            }
            if (nextPosition === position) {
                parts[i] = "\n";
                i += 1;
                position += 1;
                continue;
            }
            nextPosition += 1;
            parts[i] = text.slice(position, nextPosition);
            parts[i + 1] = addition;
            i += 2;
            position = nextPosition;
        }
        if (position !== length) {
            parts[i] = text.slice(position);
            i += 1;
        }
        parts.length = i;
        return parts;
    };
    publicExports.readIndentation = function TK_CodeParsing_readIndentation(text, position) {
        const linestart = text.lastIndexOf("\n", position) + 1;
        RXAnyChararcter.lastIndex = linestart;
        const found = RXAnyChararcter.exec(text);
        return (found === null)
            ? text.slice(linestart)
            : text.slice(linestart, found.index);
    };
    publicExports.removeQuotes = function TK_CodeParsing_removeQuotes(text) {
        if (typeof text !== "string") {
            return "";
        }
        text = text.trim();
        if (text.length === 0) {
            return "";
        }
        if (text[0] === "'") {
            return (text[text.length - 1] === "'")
                ? text.slice(1, -1) : text;
        }
        else if (text[0] === "\"") {
            return (text[text.length - 1] === "\"")
                ? text.slice(1, -1) : text;
        }
        else {
            return text;
        }
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", entries: publicExports });
    }
})();

fileCollection.set("TK_CodeParsing.js", module.exports);

"use strict";
(function TK_DataTypesObject_init() {
    const publicExports = module.exports = {};
    publicExports.filter = function TK_DataTypesObject_filter(inputs) {
        const result = {};
        const { data, byKeys } = inputs;
        let value;
        for (let i = 0; i < byKeys.length; i += 1) {
            value = data[byKeys[i]];
            if (value !== undefined) {
                result[byKeys[i]] = value;
            }
        }
        return result;
    };
    publicExports.merge = function TK_DataTypesObject_merge(base, ...changes) {
        if (changes.length === 0) {
            return Object.assign({}, base);
        }
        const result = Object.assign({}, base);
        const addToResult = mergeLayer.bind(null, result);
        for (let i = 0; i < changes.length; i += 1) {
            Object.entries(changes[i]).forEach(addToResult);
        }
        return result;
    };
    const mergeLayer = function TK_DataTypesObject_mergeLayer(result, [key, newValue]) {
        if (newValue === undefined) {
            delete result[key];
            return;
        }
        const oldValue = result[key];
        if (newValue !== oldValue && isObject(oldValue) && isObject(newValue)) {
            const replacement = Object.assign({}, oldValue);
            Object.entries(newValue).forEach(mergeLayer.bind(null, replacement));
            newValue = replacement;
        }
        result[key] = newValue;
    };
    const isObject = function TK_DataTypesObject_isObject(value) {
        return typeof value === "object" && !(value instanceof Array);
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "dataTypes", subSection: "object", entries: publicExports });
    }
})();

fileCollection.set("TK_DataTypesObject.js", module.exports);

"use strict";
(function TK_CodeHTML_init() {
    const { addIndentation } = fileCollection.get("TK_CodeParsing.js");
    const CodeCDW = fileCollection.get("TK_CodeCDW.js");
    const CodeCSS = fileCollection.get("TK_CodeCSS.js");
    const { merge } = fileCollection.get("TK_DataTypesObject.js");
    const { createTextParser } = fileCollection.get("LibraryParsing.js");
    const publicExports = module.exports = {};
    const nonMainLayer = { isROOTLayer: false };
    publicExports.textLayerDefinition = merge(CodeCSS.textLayerDefinition, CodeCDW.textLayerDefinition, {
        html_comment: {
            patterns: [["<!--", "-->"]],
        },
        html_tagStart: {
            patterns: [[/<\w+/, ">"]],
            contains: [
                "html_href", "html_src", "html_css",
                "html_insert", "html_extend", "html_cdw",
                "html_attribute",
            ]
        },
        html_href: {
            patterns: [["href=\"", "\""]],
            isROOTLayer: false,
            layerData: { fileConnection: "optional" },
        },
        html_src: {
            patterns: [["src=\"", "\""]],
            isROOTLayer: false,
            layerData: { fileConnection: "optional" },
        },
        html_insert: {
            patterns: [[/DATA-INSERT="/i, "\""]],
            isROOTLayer: false,
            layerData: { fileConnection: "insert" },
        },
        html_extend: {
            patterns: [[/DATA-EXTEND="/i, "\""]],
            isROOTLayer: false,
            layerData: { fileConnection: "insert" },
        },
        html_css: {
            isROOTLayer: false,
            patterns: [["style=\"", "\""]],
            contains: ["css_comment", "css_string", "css_url"]
        },
        html_cdw: {
            patterns: [[/DATA-MVC="/i, '"'], [/DATA-CDW="/i, '"']],
            isROOTLayer: false,
            contains: ["cdw_comment", "cdw_import", "cdw_importMaybe", "cdw_insertAfter"]
        },
        html_attribute: {
            isROOTLayer: false,
            patterns: [
                [/\S+="/, '"'],
                [/\S+=/, /\s/],
            ]
        },
        css_comment: nonMainLayer,
        css_string: nonMainLayer,
        css_url: nonMainLayer,
        cdw_comment: nonMainLayer,
        cdw_import: nonMainLayer,
        cdw_importMaybe: nonMainLayer,
        cdw_insertAfter: nonMainLayer,
    });
    publicExports.collectAttributes = function TK_CodeHTML_collectAttributes(text) {
        const result = {
            attributes: new Map(),
            endPosition: undefined,
            error: undefined,
        };
        result.error = collectAttributesParser({
            text, result
        });
        return result;
    };
    let valueIsText = false;
    const collectAttributesParser = createTextParser({
        layerDefinition: {
            html_tagStart: {
                ...publicExports.textLayerDefinition.html_tagStart,
                contains: ["html_attribute"],
            },
            html_attribute: publicExports.textLayerDefinition.html_attribute,
        },
        parsers: new Map([
            [function TK_CodeHTML_collectAttributesParser(closing, layer, inputs, depth, opening) {
                    if (inputs.result.endPosition !== undefined) {
                        return;
                    }
                    else if (layer.name === "html_tagStart") {
                        inputs.result.endPosition = closing.index + closing[0].length;
                        return;
                    }
                    valueIsText = closing[0] === '"';
                    inputs.result.attributes.set(opening[0].slice(0, valueIsText ? -2 : -1).toLocaleLowerCase(), [
                        opening.index + opening[0].length,
                        closing.index,
                        inputs.text.slice(opening.index + opening[0].length, closing.index),
                        valueIsText
                    ]);
                }, ">*"]
        ])
    });
    if (collectAttributesParser instanceof Error) {
        throw [
            "TK_CodeHTML - defining collectAttribuesParser failed:",
            collectAttributesParser
        ];
    }
    publicExports.extendTag = function TK_CodeHTML_extendTag(inputs) {
        let collected = publicExports.collectAttributes(inputs.extensionTag);
        if (collected instanceof Error) {
            ToolKid.debug.terminal.logWarning("TK_CodeHTML_extendTag - DATA-EXTEND failed:", Error);
            return [inputs.baseTag];
        }
        const additions = collected.attributes;
        collected = publicExports.collectAttributes(inputs.baseTag);
        if (collected instanceof Error || collected.endPosition === undefined) {
            ToolKid.debug.terminal.logWarning("TK_CodeHTML_extendTag - DATA-EXTEND failed:", collected);
            return [inputs.baseTag];
        }
        const { baseTag } = inputs;
        const indentBase = inputs.indentBase || "";
        const parts = [];
        let position = 0;
        let newStartStop;
        for (const [key, [start, stop]] of collected.attributes) {
            newStartStop = additions.get(key);
            if (newStartStop === undefined) {
                continue;
            }
            parts.push(...addIndentation(baseTag.slice(position, start), indentBase));
            parts.push(newStartStop[2], " ");
            parts.push(...addIndentation(baseTag.slice(start, stop), indentBase));
            position = stop;
            additions.delete(key);
        }
        parts.push(...addIndentation(baseTag.slice(position, collected.endPosition - 1), indentBase));
        for (const [key, [start, , content, isText]] of additions) {
            const tagStart = start - key.length - (isText ? 2 : 1);
            parts.push(" ", inputs.extensionTag.slice(tagStart, start), content, isText ? '"' : '');
        }
        parts.push(">");
        parts.push(...addIndentation(baseTag.slice(collected.endPosition), indentBase));
        return parts;
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "HTML", entries: publicExports });
    }
})();

fileCollection.set("TK_CodeHTML.js", module.exports);

"use strict";
(function TK_CodeJS_init() {
    const { readLayerContent } = ToolKid.getCoreModule("parsing");
    const publicExports = module.exports = {};
    const stringSignals = ['"', "'", "`"];
    const unconnectedFiles = new Set([
        "fs", "http", "module", "path", "stream"
    ]);
    publicExports.textLayerDefinition = {
        js_comment: {
            patterns: [["//", /\n|$/], ["/*", "*/"]],
        },
        js_text: {
            patterns: [["\"", "\""], ["'", "'"], ["`", "`"]],
            contains: ["js_escape"],
        },
        js_escape: {
            patterns: [/\\./s],
            isROOTLayer: false,
        },
        js_import: {
            patterns: [["require(", ")"]],
            layerData: {
                fileConnection: "preload",
                readLayerContent: function TK_CodeJS_readImport(inputs) {
                    let content = publicExports.removeComments(readLayerContent(inputs))
                        .join("").split(",")[0].trim();
                    const signalID = stringSignals.indexOf(content[0]);
                    if (signalID === -1
                        || content.length < 3
                        || content[content.length - 1] !== stringSignals[signalID]) {
                        return;
                    }
                    content = content.slice(1, -1);
                    return unconnectedFiles.has(content)
                        ? undefined : content;
                }
            },
        },
        js_bracket: {
            patterns: [["(", ")"], ["{", "}"]],
            contains: ["ROOT"],
        },
        js_RX: {
            patterns: [[/[=|:|\(]\s*\//, "/"]],
            contains: ["js_escape"]
        },
    };
    publicExports.removeComments = ToolKid.getCoreModule("parsing").createTextReplacer({
        layerDefinition: {
            js_comment: publicExports.textLayerDefinition.js_comment,
            js_text: publicExports.textLayerDefinition.js_text,
            js_escape: publicExports.textLayerDefinition.js_escape,
        },
        parseClosings: function (result, layerData) {
            if (layerData.name === "js_comment") {
                return "";
            }
        }
    });
    Object.defineProperty(publicExports.removeComments, "name", {
        value: "TK_CodeJS_removeComments",
    });
    const validPathOpenings = new Set(['"', "'", "`"]);
    const validPathClosings = new Set([".js", "jsm"]);
    publicExports.replaceFileConnections = ToolKid.getCoreModule("parsing").createTextReplacer({
        layerDefinition: publicExports.textLayerDefinition,
        parseClosings: function TK_CodeJS_replaceFileConnections(...inputs) {
            if (inputs[1].fileConnection === undefined) {
                return;
            }
            const content = publicExports.removeComments(readLayerContent(inputs)).join("").trim();
            if (validPathOpenings.has(content[0])
                && validPathClosings.has(content.slice(-4, -1))) {
                return inputs[2].replacer(content);
            }
        }
    });
    Object.defineProperty(publicExports.replaceFileConnections, "name", {
        value: "TK_CodeJS_replaceFileConnections",
    });
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "code", subSection: "JS", entries: publicExports });
    }
})();

fileCollection.set("TK_CodeJS.js", module.exports);

"use strict";
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
        ToolKid.register({ section: "connection", subSection: "HTTP", entries: publicExports });
    }
})();

fileCollection.set("TK_ConnectionHTTP.js", module.exports);

"use strict";
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
        ToolKid.register({ section: "connection", subSection: "HTTP", entries: publicExports });
    }
})();

fileCollection.set("TK_ConnectionHTTPFormats.js", module.exports);

"use strict";
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
        ToolKid.register({ section: "dataTypes", subSection: "array", entries: publicExports });
    }
})();

fileCollection.set("TK_DataTypesArray.js", module.exports);

"use strict";
(function TK_DataTypesChecks_init() {
    const publicExports = module.exports = {};
    publicExports.createTypeHandler = function TK_DataTypesChecks_createTypeHandler(typeHandlers) {
        return function TK_DataTypesChecks_typeHandler(value, ...bonus) {
            const handler = typeHandlers[getDataType(value)];
            if (handler === false) {
                return undefined;
            }
            if (typeof handler === "function") {
                return handler(value, ...bonus);
            }
            else if (typeof typeHandlers.any === "function") {
                return typeHandlers.any(value, ...bonus);
            }
        };
    };
    const getDataType = publicExports.getDataType = function TK_DataTypesChecks_getDataType(value) {
        return dataTypeReturns[typeof value](value);
    };
    const dataTypeReturns = {
        bigint: function TK_DataTypesChecks_returnTypeBigint() { return "bigint"; },
        boolean: function TK_DataTypesChecks_returnTypeBoolean() { return "boolean"; },
        function: function TK_DataTypesChecks_returnTypeFunction() { return "function"; },
        number: function TK_DataTypesChecks_returnTypeNumber(data) {
            return Number.isNaN(data) ? "undefined" : "number";
        },
        object: function TK_DataTypesChecks_returnTypeObject(data) {
            if (data === null) {
                return "undefined";
            }
            else if (data instanceof Array) {
                return "array";
            }
            else if (data instanceof Map) {
                return "map";
            }
            else {
                return "object";
            }
        },
        string: function TK_DataTypesChecks_returnTypeString() { return "string"; },
        symbol: function TK_DataTypesChecks_returnTypeSymbol() { return "symbol"; },
        undefined: function TK_DataTypesChecks_returnTypeUndefined() { return "undefined"; }
    };
    if (typeof Element === "function") {
        const standard = dataTypeReturns.object;
        dataTypeReturns.object = function TK_DataTypesChecks_returnTypeObjectDOM(data) {
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
    publicExports.isArray = (typeof Array.isArray === "function")
        ? function TK_DataTypesChecks_isArray(value) {
            return Array.isArray(value) && value.length !== 0;
        }
        : function TK_DataTypesChecks_isArrayLegacy(value) {
            return value instanceof Array && value.length !== 0;
        };
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
    publicExports.isObject = function TK_DataTypesChecks_isObject(value) {
        return typeof value === "object"
            && value !== null
            && !(value instanceof Array)
            && !(value instanceof Map);
    };
    publicExports.isPromise = function TK_DataTypesChecks_isPromise(value) {
        return value instanceof Promise;
    };
    publicExports.isString = function TK_DataTypesChecks_isString(value) {
        return typeof value === "string" && value !== "";
    };
    publicExports.handleDataType = function TK_DataTypesChecks_handleDataType(value, typeHandlers, withParameters) {
        const handler = typeHandlers[getDataType(value)];
        if (handler === false) {
            return undefined;
        }
        if (typeof handler === "function") {
            return handler(...withParameters);
        }
        else if (typeof typeHandlers.any === "function") {
            return typeHandlers.any(...withParameters);
        }
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "dataTypes", subSection: "checks", entries: publicExports });
    }
})();

fileCollection.set("TK_DataTypesChecks.js", module.exports);

"use strict";
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
    const typeHandler = ToolKid.dataTypes.checks.createTypeHandler({
        array: function (shouldBe, value, path, toleranceDepth, allowAdditions) {
            if (!(value instanceof Array)) {
                return [{ path, type: "different", value, shouldBe }];
            }
            else if (toleranceDepth === 0) {
                return [{ path, type: "tooDeep", value, shouldBe }];
            }
            else {
                return equalLoop(path, value, shouldBe, toleranceDepth - 1, allowAdditions, readProperty.basic);
            }
        },
        bigint: function (shouldBe, value, path) {
            return [{ path, type: "different", value, shouldBe }];
        },
        boolean: function (shouldBe, value, path) {
            return [{ path, type: "different", value, shouldBe }];
        },
        function: function (shouldBe, value, path) {
            if (shouldBe.valueChecks instanceof Array) {
                if (shouldBe(value) === true) {
                    return true;
                }
                else {
                    return [{ path, type: "different", value, shouldBe }];
                }
            }
            else if (shouldBe === Error) {
                return value instanceof Error
                    ? true : [{ path, type: "different", value, shouldBe }];
            }
            else {
                return [{ path, type: "different", value, shouldBe }];
            }
        },
        map: function (shouldBe, value, path, toleranceDepth, allowAdditions) {
            if (!(value instanceof Map)) {
                return [{ path, type: "different", value, shouldBe }];
            }
            else if (toleranceDepth === 0) {
                return [{ path, type: "tooDeep", value, shouldBe }];
            }
            else {
                return equalLoop(path, value, shouldBe, toleranceDepth - 1, allowAdditions, readProperty.Map);
                return true;
            }
        },
        number: function (shouldBe, value, path) {
            return [{ path, type: "different", value, shouldBe }];
        },
        object: function (shouldBe, value, path, toleranceDepth, allowAdditions) {
            if (typeof value !== "object" || value === null) {
                return [{ path, type: "different", value, shouldBe }];
            }
            else if (toleranceDepth === 0) {
                return [{ path, type: "tooDeep", value, shouldBe }];
            }
            else {
                if (shouldBe instanceof Error !== value instanceof Error) {
                    return [{ path, type: "different", value, shouldBe }];
                }
                if (shouldBe instanceof Set) {
                    return (value instanceof Set)
                        ? differentiators.set(path, value, shouldBe)
                        : [{ path, type: "different", value, shouldBe }];
                }
                else if (value instanceof Set) {
                    return [{ path, type: "different", value, shouldBe }];
                }
                return equalLoop(path, value, shouldBe, toleranceDepth - 1, allowAdditions, readProperty.basic);
            }
        },
        string: function (shouldBe, value, path) {
            return [{ path, type: "different", value, shouldBe }];
        },
        symbol: function (shouldBe, value, path) {
            return [{ path, type: "different", value, shouldBe }];
        },
        undefined: function (shouldBe, value, path) {
            if (Number.isNaN(shouldBe)) {
                if (Number.isNaN(value)) {
                    return true;
                }
            }
            else if (typeof shouldBe === typeof value) {
                return true;
            }
            return [{ path, type: "different", value, shouldBe }];
        },
    });
    const assertEqualityLoose = function TK_DataTypesChecksEquality_assertEqualityLoosepath(path, value, shouldBe, toleranceDepth, allowAdditions) {
        if (value === shouldBe) {
            return true;
        }
        return typeHandler(shouldBe, value, path, toleranceDepth, allowAdditions);
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
        ToolKid.register({ section: "dataTypes", subSection: "checks", entries: publicExports });
    }
})();

fileCollection.set("TK_DataTypesChecksEquality.js", module.exports);

"use strict";
(function TK_DataTypesList_init() {
    const publicExports = module.exports = {};
    publicExports.shorten = function TK_DataTypesList_shorten(inputs) {
        const { list } = inputs;
        if ((typeof list !== "string" && !(list instanceof Array))
            || list.length <= inputs.maxLength) {
            return list;
        }
        let { omissionSignal } = inputs;
        const limit = Math.floor(inputs.maxLength / 2);
        if (typeof omissionSignal === "function") {
            omissionSignal = omissionSignal(list.slice(limit, -limit));
        }
        return typeof list === "string"
            ? list.slice(0, limit) + omissionSignal + list.slice(-limit)
            : [...list.slice(0, limit), omissionSignal, ...list.slice(-limit)];
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "dataTypes", subSection: "list", entries: publicExports });
    }
})();

fileCollection.set("TK_DataTypesList.js", module.exports);

"use strict";
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
        ToolKid.register({ section: "dataTypes", subSection: "number", entries: publicExports });
    }
})();

fileCollection.set("TK_DataTypesNumber.js", module.exports);

"use strict";
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
            result.resolve = promiseDecide.bind(null, result, resolve, "fulfilled");
            result.reject = promiseDecide.bind(null, result, reject, "rejected");
        });
        return result;
    };
    const promiseDecide = function TK_DataTypesPromise_promiseDecide(promiseData, method, state, data) {
        if (promiseData.state === "pending") {
            method(data);
            promiseData.data = data;
            promiseData.state = state;
            return;
        }
        console.error([
            "TK_DataTypesPromise_createPromiseReject - promise allready " + promiseData.state + " with:",
            promiseData.data,
            " then tried " + state + " with:",
            data
        ]);
        return;
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "dataTypes", subSection: "promise", entries: publicExports });
    }
})();

fileCollection.set("TK_DataTypesPromise.js", module.exports);

"use strict";
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
            name: typeof config.execute === "function"
                ? config.execute.name
                : "assert",
            time: 0
        };
    };
    const fillErrorResult = function TK_DebugTest_fillErrorResult(testResult, error, failureHandler, callstackPosition = 7) {
        testResult.time = 0;
        testResult.errorMessage = error || "Unspecified Error";
        testResult.errorSource = testResult.errorSource || ToolKid.debug.callstack.readFrames({ position: callstackPosition })[0];
        if (failureHandler !== undefined) {
            failureHandler(testResult);
        }
        return testResult;
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
        const group = resultGroups.get(name);
        return (group === undefined)
            ? undefined
            : { name, results: group.results };
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
    publicExports.test = function TK_DebugTest_test(...inputs) {
        if (inputs.length === 0) {
            throw ["TK_DebugTest_test - no config received"];
        }
        const testResults = inputs.map(testSingle.bind(null, currentResultGroup));
        currentResultGroup.results.push(...testResults);
        return testResults;
    };
    const testSingle = function TK_DebugTest_testSingle(resultGroup, config) {
        const testResult = createResultBase(config);
        if (typeof config !== "object" || config === null) {
            return testFinish(config, fillErrorResult(testResult, ["TK_DebugTest_test - config has to be an object but is:", config], resultGroup.failureHandler), resultGroup, {});
        }
        else if (!isValidSubject(config.subject)) {
            return testFinish(config, fillErrorResult(testResult, ["TK_DebugTest_test - config.subject has to be a named function or a string but is:", config.subject], resultGroup.failureHandler), resultGroup, {});
        }
        return testExecute(config, testResult, resultGroup);
    };
    // TODO: unit tests for callback function
    const testExecute = function Test_testExecute(config, testResult, resultGroup) {
        if (typeof config.execute !== "function") {
            if (config.assert === undefined) {
                throw ["TK_DebugTest_test - no valid .execute or .assert defined", config];
            }
            return testFinish(config, testResult, resultGroup, {});
        }
        // if (typeof config.execute !== "function") {
        //     if (config.assert === undefined) {
        //         return testFinish(fillErrorResult(testResult,
        //             ["TK_DebugTest_test - no valid .execute or .assert defined", config],
        //             resultGroup.failureHandler
        //         ), config, {});
        //     } else {
        //         return testFinish(config, testResult, resultGroup, {});
        //     }
        // }
        const startTime = Date.now();
        const scope = {};
        try {
            const executionPromise = config.execute(scope);
            if (executionPromise instanceof Promise) {
                const resultPromiseInputs = {
                    testResult,
                    startTime,
                    promise: executionPromise,
                    resultGroup,
                    source: ToolKid.debug.callstack.readFrames({ position: 6 })[0],
                };
                const resultPromise = new Promise(function TK_DebugTest_testWatchPromiseCreate(resolve, reject) {
                    resultPromiseInputs.resolver = resolve;
                });
                resultPromise.subject = config.subject;
                resultPromise.execution = config.execute;
                executionPromise.then(testPromiseSuccess.bind(null, resultPromiseInputs), testPromiseFailure.bind(null, resultPromiseInputs));
                resultPromise.then(function Test_testExecute_handlePromise() {
                    const { results } = resultGroup;
                    const index = results.indexOf(resultPromise);
                    testResult.time = Date.now() - startTime;
                    results[index] = testFinish(config, testResult, resultGroup, scope);
                });
                return resultPromise;
            }
        }
        catch (error) {
            fillErrorResult(testResult, error, resultGroup.failureHandler);
        }
        testResult.time = Date.now() - startTime;
        return testFinish(config, testResult, resultGroup, scope);
    };
    const testFinish = function (config, testResult, resultGroup, scope) {
        if (testResult.errorMessage === undefined && config.assert !== undefined) {
            if (typeof config.assert !== "function") {
                fillErrorResult(testResult, ["TK_DebugTest_testAssert - the testConfig.assert property has to be a function which returns the inputs for the test.assert function:", config], resultGroup.failureHandler, 8);
            }
            else {
                try {
                    const inputs = config.assert();
                    try {
                        ToolKid.debug.test.assert(inputs);
                    }
                    catch (error) {
                        fillErrorResult(testResult, error, resultGroup.failureHandler, 8);
                    }
                }
                catch (error) {
                    fillErrorResult(testResult, ["TK_DebugTest_testAssert - evaluating assert inputs failed:", error], resultGroup.failureHandler, 8);
                }
            }
        }
        if (typeof config.callback === "function") {
            config.callback({ scope, testResult });
        }
        return Object.freeze(testResult);
    };
    const testPromiseSuccess = function TK_DebugTest_testPromiseSuccess(bound) {
        bound.testResult.time = Date.now() - bound.startTime;
        bound.resolver(bound.testResult);
    };
    const testPromiseFailure = function TK_DebugTest_testPromiseFailure(bound, reason) {
        const { testResult } = bound;
        testResult.errorSource = bound.source;
        fillErrorResult(testResult, reason, bound.resultGroup.failureHandler);
        bound.resolver(testResult);
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();

fileCollection.set("TK_DebugTest.js", module.exports);

"use strict";
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
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();

fileCollection.set("TK_DebugTestAssertFailure.js", module.exports);

"use strict";
(function TK_DebugTestAssertion_init() {
    const defaultConfig = {};
    const publicExports = module.exports = {};
    publicExports.assert = function TK_DebugTestAssertion_assert(...inputs) {
        const errors = [];
        if (inputs.length === 3) {
            assertEqualityPerName(errors, [inputs[0], { value: inputs[1], shouldBe: inputs[2] }]);
            if (errors.length !== 0) {
                throw errors;
            }
            return;
        }
        if (inputs.length !== 1) {
            throw ["TK_DebugTestAssertion_assert - takes 3 arguments (label, value, expectedValue) or one config object, not:", inputs.length, "inputs:", inputs];
        }
        Object.entries(inputs[0]).forEach(assertComplex.bind(null, errors, inputs[0].CONFIG || defaultConfig));
        if (errors.length !== 0) {
            throw errors;
        }
    };
    const assertComplex = function TK_DebugTestAssertion_assertComplex(errors, baseConfig, nameAndConfig) {
        const [, config] = nameAndConfig;
        if (isShortConfig(config)) {
            assertEqualityPerName(errors, [
                nameAndConfig[0], {
                    ...baseConfig,
                    value: config[0],
                    shouldBe: config[1]
                }
            ]);
        }
        else {
            assertEqualityPerName(errors, [
                nameAndConfig[0], {
                    ...baseConfig,
                    ...nameAndConfig[1]
                }
            ]);
        }
    };
    publicExports.assertEquality = function TK_Debug_assertEquality(inputs) {
        const errors = [];
        Object.entries(inputs).forEach(assertEqualityPerName.bind(null, errors));
        if (errors.length !== 0) {
            throw errors;
        }
    };
    const assertEqualityPerName = function TK_Debug_assertEqualityPerName(errors, nameAndConfig) {
        const config = nameAndConfig[1];
        if (config.shouldBe === Error) {
            let returned;
            try {
                returned = config.value();
            }
            catch (error) {
                return;
            }
            errors.push(...["~ " + nameAndConfig[0] + " ~ value did not fail - it returned:", returned]);
            return;
        }
        const returned = ToolKid.dataTypes.checks.areEqual(config);
        if (returned === true) {
            return;
        }
        let errorMessage;
        if (config.passOnDepthExceed !== true) {
            errorMessage = ["~ " + nameAndConfig[0] + " ~ value did not meet expectations:", ...returned];
        }
        else {
            const cleaned = returned.filter(isNotTooDeep);
            if (cleaned.length === 0) {
                return;
            }
            errorMessage = ["~ " + nameAndConfig[0] + " ~ value did not meet expectations:", ...cleaned];
        }
        if (typeof config.catchFailure === "function") {
            config.catchFailure(errorMessage);
        }
        else {
            errors.push(...errorMessage);
        }
    };
    const isNotTooDeep = function TK_DebugTestAssertion_isNotToDeep(difference) {
        return difference.type !== "tooDeep";
    };
    const isShortConfig = (typeof Array.isArray === "function")
        ? function TK_DebugTestAssertion_isShortConfig(value) {
            return Array.isArray(value) && value.length === 2;
        } : function TK_DebugTestAssertion_isShortConfigLegacy(value) {
        return value instanceof Array && value.length === 2;
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();

fileCollection.set("TK_DebugTestAssertion.js", module.exports);

"use strict";
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
        const config = (typeof inputs.timeToResolve === "number")
            ? ["resolve", inputs.timeToResolve]
            : ["reject", inputs.timeToReject];
        setTimeout(function TK_DebugTestCondition_watchPromiseDurationCheck() {
            if (promise.done !== true) {
                promise[config[0]](inputs.timeoutMessage || "timeout");
            }
        }, config[1]);
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();

fileCollection.set("TK_DebugTestCondition.js", module.exports);

"use strict";
(function TK_DebugTestFull_init() {
    const publicExports = module.exports = {};
    const colors = {
        positive: "\u001b[32m", default: "\u001b[97m", negative: "\u001b[31m"
    };
    const colorText = function TK_DebugTestFull_colorString(color, text) {
        return colors[color] + text + colors.default;
    };
    const getChangeDetail = function TK_DebugTestFull_getChangeDetail(difference) {
        if (typeof difference === "string") {
            return "\n" + readErrorName(difference);
        }
        const path = (!(difference.path instanceof Array) || difference.path.length === 0)
            ? "value"
            : "." + difference.path.join(".");
        return [
            "\n > " + path + "\nis:", shortenData(difference.value),
            "\ninstead of:", shortenData(difference.shouldBe)
        ];
    };
    const isDifferenceFailure = function TK_DebugTestFull_isDifferenceFailure(failure) {
        return typeof failure[1] === "object" && failure[1].path instanceof Array;
    };
    const logFailure = function TK_DebugTestFull_logFailure(summaryName, result) {
        const subjectName = (result.subject === undefined)
            ? "?"
            : result.subject.name || result.subject;
        console.warn("\n" +
            colorText("negative", ">>  " + summaryName
                + "  >  " + result.errorSource
                + "  >  " + subjectName
                + "  >  \"" + result.name + "\"\n"), ...shortenData(logFailureNice(result.errorMessage)));
    };
    const logFailureNice = function TK_DebugTestFull_logFailureNice(errorMessage) {
        if (!isDifferenceFailure(errorMessage)) {
            return (errorMessage instanceof Array)
                ? errorMessage
                : [errorMessage];
        }
        return [readErrorName(errorMessage[0])].concat(...errorMessage.slice(1).map(getChangeDetail));
    };
    const readErrorName = function (errorText) {
        return errorText.slice(0, errorText.lastIndexOf("~") + 1);
    };
    const summarizeFazitSync = function TK_DebugTestFull_summarizeFazitSync(inputs) {
        const { summary } = inputs;
        const counts = {
            failures: summary.failures.length,
            suspects: summary.missingSuspects.size
        };
        return "\n" +
            colorText((counts.failures === 0) ? "positive" : "negative", ">>  " + summary.name + "  >  " + counts.failures + " Error" + (counts.failures === 1 ? "" : "s"))
            + "  /  "
            + colorText("positive", summary.testCount + " test groups")
            + "  /  "
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
            + "  /  "
            + colorText((counts.suspects === 0) ? "positive" : "negative", counts.suspects + " untested suspects");
    };
    const logMissingSuspects = function TK_DebugTestFull_logMissingSuspects(summary) {
        const { missingSuspects } = summary;
        if (missingSuspects.size !== 0) {
            console.error("\n" +
                colorText("negative", ">>  " + summary.name + " >> the following suspects have not been tested:"), Array.from(missingSuspects));
        }
    };
    const omissionSignal = function TK_DebugTestFull_omissionSignal(omitted) {
        return "[ ... " + omitted.length + " ... ]";
    };
    publicExports.setupTests = function TK_DebugTestFull_setupTests(inputs) {
        const TKTest = ToolKid.debug.test;
        if (typeof inputs.title === "string") {
            TKTest.switchResultGroup(inputs.title);
        }
        const name = TKTest.getResultGroup().name;
        console.log(colorText("positive", "\n>>  testing " + name));
        TKTest.setFailureHandler(logFailure.bind(null, name));
    };
    const shortenData = function TK_DebugTestFull_shortenValue(list) {
        return ToolKid.dataTypes.list.shorten({
            list,
            maxLength: (typeof list === "string" ? 200 : 30),
            omissionSignal
        });
    };
    publicExports.testFull = function TK_DebugTestFull_testFull(inputs) {
        publicExports.setupTests(inputs);
        let timeStart = Date.now();
        ToolKid.file.loopFiles({
            includes: ["*.test.js"],
            ...inputs,
            execute: require
        });
        const timeInitial = Date.now() - timeStart;
        timeStart = Date.now();
        const summary = ToolKid.debug.test.getSummary({
            suspects: inputs.suspects,
            callback: function TK_DebugTestFull_testFullHandleSummary(summary) {
                // TODO: real test for TK_DebugTestFull
                summary.missingSuspects.delete(publicExports.testFull);
                summary.missingSuspects.delete(publicExports.setupTests);
                const timeFinal = Date.now() - timeStart;
                logMissingSuspects(summary);
                console.log(summarizeFazit({ summary, timeInitial, timeFinal }));
            }
        });
        if (summary.pending.size !== 0) {
            // TODO: display info about pending tests
            console.log(colors.default + ">>  awaiting " + summary.name + " test results (at least " + summary.pending.size + " more)");
        }
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();

fileCollection.set("TK_DebugTestFull.js", module.exports);

"use strict";
(function TK_DebugTestShouldPass_init() {
    const publicExports = module.exports = {};
    const createValueChecker = function TD_DebugTestShouldPass_createValueChecker(mode, value) {
        return (mode === "fail")
            ? testFailure.bind(null, value)
            : testSuccess.bind(null, value);
    };
    publicExports.shouldBeCloseTo = function TK_DebugTestShouldPass_shouldBeCloseTo(tolerance, wanted) {
        return ValueAsserter({
            checks: [shouldBeCloseToCheck.bind(null, wanted, tolerance)],
            want: "none",
            to: "fail"
        });
    };
    const shouldBeCloseToCheck = function TK_DebugTestShouldBeCloseToCheck(wanted, tolerance, value) {
        return typeof value === "number" && value >= wanted - tolerance && value <= wanted + tolerance;
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
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();

fileCollection.set("TK_DebugTestShouldPass.js", module.exports);

"use strict";
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
        const resultGroup = ToolKid.debug.test.getResultGroup(inputs.name);
        const summary = createSummary(Object.assign({}, resultGroup, { missingSuspects }));
        if (typeof callback !== "function") {
            return summary;
        }
        if (summary.pending.size === 0) {
            callback(summary);
            return summary;
        }
        const boundData = {
            name: resultGroup.name,
            inputs,
            pendingCount: summary.pending.size
        };
        summary.pending.forEach(function TK_DebugTestSummary_watchPromise(promise) {
            promise.then(summaryCallbackCheck.bind(null, boundData));
        });
        return summary;
    };
    const summaryCallbackCheck = function TK_DebugTestSummary_summaryCallbackCheck(boundData) {
        boundData.pendingCount -= 1;
        if (boundData.pendingCount === 0 && boundData.pendingCallback === undefined) {
            boundData.pendingCallback = true;
            setTimeout(summaryCallback.bind(null, boundData), 0);
        }
    };
    const summaryCallback = function TK_DebugTestSummary_summaryCallback(boundData) {
        delete boundData.pendingCallback;
        if (boundData.pendingCount === 0) {
            publicExports.getSummary(Object.assign({}, boundData.inputs, {
                name: boundData.name
            }));
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
        ToolKid.register({ section: "debug", subSection: "test", entries: publicExports });
    }
})();

fileCollection.set("TK_DebugTestSummary.js", module.exports);

"use strict";
(function TK_DebugCallstack_init() {
    const publicExports = module.exports = {};
    publicExports.readFrames = function TK_DebugCallstack_readCallstack(inputs = {}) {
        const firstFrameIndex = Math.max(1, inputs.position || 1);
        return new Error().stack.split("\n").slice(firstFrameIndex, firstFrameIndex + (inputs.amount || 1)).map(extractFileName);
    };
    const regExpAfterLastSlash = /[^\/\\]+$/;
    const extractFileName = publicExports.extractFileName = function TK_DebugCallstack_extractFileName(part) {
        const filePart = part.slice(part.search(regExpAfterLastSlash));
        return filePart.split(":")[0];
    };
    ;
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "callstack", entries: publicExports });
    }
})();

fileCollection.set("TK_DebugCallstack.js", module.exports);

"use strict";
(function TK_DebugTerminalLog_init() {
    const isClient = typeof document === "object";
    const publicExports = module.exports = {};
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
    let formatedText;
    let colorCode;
    publicExports.colorStrings = function TK_DebugTerminalLog_colorStringsLoop(inputs) {
        colorCode = publicExports.getColorCode(inputs.colorName);
        formatedText = undefined;
        let resultIndex = 0;
        const values = inputs.values;
        const length = values.length;
        let value;
        for (let i = 0; i < length; i += 1) {
            value = values[i];
            if (typeof value === "string") {
                if (typeof formatedText === "string") {
                    formatedText += value;
                }
                else {
                    formatedText = (isClient === false || i === 0)
                        ? colorCode + value // server can color multiple strings
                        : value; // client can only color first string
                }
            }
            else {
                if (formatedText !== undefined) {
                    formatedValues[resultIndex] = colorStringsFinish(formatedText);
                    formatedText = undefined;
                    resultIndex += 1;
                }
                formatedValues[resultIndex] = value;
                resultIndex += 1;
            }
        }
        if (formatedText !== undefined) {
            formatedValues[resultIndex] = colorStringsFinish(formatedText);
            resultIndex += 1;
        }
        return (isClient && resultIndex > 1)
            ? [formatedValues[0], formatedValues.slice(1, resultIndex)]
            : formatedValues.slice(0, resultIndex);
    };
    const colorStringsFinish = function TK_DebugTerminalLog_colorStringsFinish(unfinishedString) {
        if (isClient) {
            return unfinishedString;
        }
        else {
            return unfinishedString + colorSignals.white;
        }
    };
    let disableCount = 0;
    let originalConsoleLog;
    let originalConsoleEror;
    publicExports.disableLogs = function TK_DebugTerminalLog_disableLogs(amount) {
        console.log(...publicExports.colorStrings({
            colorName: typeColors.basic,
            values: ["TK_DebugTerminalLog_disableLogs - " + amount]
        }));
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
                " only the following colors are known:", Object.keys(colorSignals[typeColors.none])
            ];
        }
        return code;
    };
    const getPrefix = function TK_DebugTerminalLog_getPrefix(inputs) {
        return (typeof inputs[0] === "string")
            ? ">>  " : ">>";
    };
    publicExports.logError = function TK_DebugTerminalLog_logError(...inputs) {
        console.error(...publicExports.colorStrings({
            colorName: typeColors.error,
            values: [getPrefix(inputs), ...inputs]
        }));
    };
    const logWithLevel = function TK_DebugTerminalLog_logWithLevel(type, ...inputs) {
        if (inputs.length === 0) {
            console.log();
            return;
        }
        console.warn(...publicExports.colorStrings({
            colorName: typeColors[type],
            values: [getPrefix(inputs), ...inputs]
        }));
    };
    publicExports.logWarning = logWithLevel.bind(null, "warning");
    publicExports.logImportant = logWithLevel.bind(null, "important");
    publicExports.logBasic = logWithLevel.bind(null, "basic");
    if (typeof process !== "undefined") {
        process.on("unhandledRejection", function TK_DebugTerminalLog_catchPromiseRejection(reason, promise) {
            publicExports.logError("UNHANDLED PROMISE REJECTION");
            publicExports.logError(reason);
        });
    }
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "terminal", entries: publicExports });
    }
})();

fileCollection.set("TK_DebugTerminalLog.js", module.exports);

"use strict";
(function TK_DOMAnimations_init() {
    if (typeof Element === "undefined") {
        return;
    }
    const publicExports = module.exports = {};
    const addFrameHandler = function TK_DOMAnimations_addFrameHandler(funk) {
        frameHandlers[frameHandlerCount] = funk;
        frameHandlerCount += 1;
        if (frameHandlerCount === 1) {
            requestAnimationFrame(handleFrameStart);
        }
    };
    let frameHandlerCount = 0;
    let frameHandlers = new Array(100);
    let frameHandlersAlteration = new Array(100);
    let frameReaderCount = 0;
    const frameReaders = new Array(100);
    const handleFrameStart = function TK_DOMAnimations_handleFrameStart() {
        // operations that force DOM reflow (rendering)
        for (let i = 0; i < frameReaderCount; i += 1) {
            frameReaders[i]();
            frameReaders[i] = undefined;
        }
        frameReaderCount = 0;
        if (frameHandlerCount === 0) {
            return;
        }
        // other operations this frame - switching "active" frameHandlers
        const length = frameHandlerCount;
        const handlers = frameHandlers;
        frameHandlers = frameHandlersAlteration;
        frameHandlerCount = 0;
        for (let i = 0; i < length; i += 1) {
            handlers[i]();
            handlers[i] = undefined;
        }
        frameHandlersAlteration = handlers;
    };
    publicExports.smove = function TK_DOMAnimations_smove(inputs) {
        if (inputs.element._animationTarget === inputs.targetParent) {
            return;
        }
        inputs.element._animationTarget = inputs.targetParent;
        const placeholder = document.createElement("div");
        placeholder.style.opacity = "0";
        placeholder.style.pointerEvents = "none";
        const siblings = inputs.targetParent.children;
        inputs.targetParent.insertBefore(placeholder, siblings[inputs.targetIndex || siblings.length]);
        frameReaders[frameReaderCount] = smoveRead.bind(null, inputs, placeholder);
        frameReaderCount += 1;
        if (frameReaderCount === 1) {
            addFrameHandler(smoveSwap);
        }
    };
    const smoveRead = function TK_DOMAnimations_smoveRead(internals, placeholder) {
        animatedSwitch[animatedSwitchCount] = [
            internals, placeholder,
            internals.element.getBoundingClientRect(),
            placeholder.getBoundingClientRect()
        ];
        animatedSwitchCount += 1;
    };
    let animatedSwitchCount = 0;
    const animatedSwitch = new Array(100);
    const smoveSwap = function TK_DOMAnimations_smoveSwap() {
        let element, elementBCR, placeholder, placeholderBCR, inputs;
        for (let i = 0; i < animatedSwitchCount; i += 1) {
            inputs = animatedSwitch[i][0];
            element = inputs.element;
            elementBCR = animatedSwitch[i][2];
            placeholder = animatedSwitch[i][1];
            placeholderBCR = animatedSwitch[i][3];
            const styleP = placeholder.style;
            placeholder.className = element.className;
            styleP.width = elementBCR.width + "px";
            styleP.height = elementBCR.height + "px";
            element.parentElement.insertBefore(placeholder, element);
            const styleE = element.style;
            const diffY = elementBCR.top - placeholderBCR.top;
            const diffX = elementBCR.left - placeholderBCR.left;
            styleE.margin =
                diffY + "px "
                    + (-diffX - elementBCR.width) + "px "
                    + (-diffY - elementBCR.height) + "px "
                    + diffX + "px";
            const siblings = inputs.targetParent.children;
            inputs.targetParent.insertBefore(element, siblings[inputs.targetIndex || siblings.length + 1]);
            delete element._animationTarget;
            animatedActive[i] = [inputs, placeholder, elementBCR];
        }
        animatedSwitch.length = 0;
        animatedSwitchCount = 0;
        addFrameHandler(smoveAnimate);
    };
    const animatedActive = [];
    const smoveAnimate = function TK_DOMAnimations_smoveAnimate() {
        let element, placeholder, data;
        const length = animatedActive.length;
        for (let i = 0; i < length; i += 1) {
            data = animatedActive[i];
            const inputs = data[0];
            element = inputs.element;
            placeholder = data[1];
            const styleP = placeholder.style;
            styleP.margin = (data[2].height / -2) + "px "
                + (data[2].width / -2) + "px ";
            placeholder.classList.add("--animated");
            const styleE = element.style;
            const duration = (inputs.duration || 1) + "s";
            styleP.setProperty("--animationDuration", duration);
            styleE.setProperty("--animationDuration", duration);
            const delay = (inputs.delay || 0) + "s";
            styleP.setProperty("--animationDelay", delay);
            styleE.setProperty("--animationDelay", delay);
            if (inputs.zIndex !== undefined) {
                styleP.setProperty("--animationZ", inputs.zIndex);
                styleE.setProperty("--animationZ", inputs.zIndex);
            }
            element.classList.add("--animated");
            styleE.margin = "";
            delete element._animationTarget;
            setTimeout(smoveCleanUp.bind(null, element, placeholder), (inputs.duration || 1 + delay) * 1000);
        }
        animatedActive.length = 0;
    };
    const smoveCleanUp = function TK_DOMAnimations_smoveCleanUp(element, placeholder) {
        element.classList.remove("--animated");
        placeholder.remove();
    };
    const style = document.createElement("style");
    style.textContent = `
        .--animated {
            transition-property: margin;
            transition-duration: var(--animationDuration);
            transition-delay: var(--animationDelay);
            z-index: var(--animationZ);
        }`;
    document.head.appendChild(style);
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "DOM", entries: publicExports });
    }
})();

fileCollection.set("TK_DOMAnimations.js", module.exports);

"use strict";
(function TK_File_init() {
    const { createSimpleRX, createStringChecker } = ToolKid.getCoreModule("regularExpression");
    const fileRegistry = new Map();
    const publicExports = module.exports = {};
    const basePathRX = /^\.{0,1}\/{0,1}/;
    const createPathRX = function (path) {
        return new RegExp("^" + path.replace(basePathRX, ""));
    };
    publicExports.getExtension = function TK_File_getExtension(path) {
        const parts = publicExports.getName(path).split(".");
        return (parts.length === 1)
            ? ""
            : parts[parts.length - 1].toLocaleLowerCase();
    };
    publicExports.getName = function TK_File_getName(path) {
        let parts = path.trim().split(/\/|\\/);
        return parts[parts.length - 1];
    };
    if (typeof Element !== "undefined") {
        publicExports.loopFiles = function TK_File_loopFilesClient(inputs) {
            const { includes, excludes, execute } = inputs;
            if (includes instanceof Array) {
                includes.forEach(function (pattern, index) {
                    if (typeof pattern === "string") {
                        includes[index] = createSimpleRX(pattern);
                    }
                });
            }
            if (excludes instanceof Array) {
                excludes.forEach(function (pattern, index) {
                    if (typeof pattern === "string") {
                        excludes[index] = createSimpleRX(pattern);
                    }
                });
            }
            const pathRX = (inputs.path instanceof Array)
                ? new RegExp(inputs.path.map(createPathRX).join("|"))
                : createPathRX(inputs.path);
            const checkExtra = createStringChecker({ includes, excludes });
            fileRegistry.forEach(function TK_File_loopFilesPath(path) {
                if (pathRX.test(path) && checkExtra(path)) {
                    execute(path);
                }
            });
        };
    }
    ;
    publicExports.register = function TK_File_register(path) {
        const fileName = publicExports.getName(path);
        const registeredPath = fileRegistry.get(fileName);
        if (registeredPath === path) {
            return;
        }
        else if (registeredPath === undefined) {
            fileRegistry.set(fileName, path);
        }
        else {
            throw [
                "TK_File_register - fileName allready in use: ", fileName,
                " paths are: ", fileRegistry.get(fileName), path
            ];
        }
    };
    if (typeof ToolKid !== "undefined") {
        if (typeof Element === "undefined") {
            publicExports.loopFiles = ToolKid.getCoreModule("files").loopFiles;
        }
        ToolKid.register({ section: "file", entries: publicExports });
    }
    Object.freeze(publicExports);
})();

fileCollection.set("TK_File.js", module.exports);

"use strict";
(function TK_NodeJSFile_init() {
    const { appendFileSync: extendFile, existsSync: isUsedPath, lstatSync: readPathStats, readdirSync: readDirectory, rmSync: deleteFolder, unlinkSync: deleteFile } = require("fs");
    const publicExports = module.exports = {};
    publicExports.deletePath = function TK_NodeJSFile_deletePath(path) {
        if (!isUsedPath(path)) {
            return;
        }
        if (publicExports.isDirectory(path)) {
            deleteFolder(path, { recursive: true });
        }
        else {
            deleteFile(path);
        }
    };
    publicExports.extendFile = function TK_NodeJSFile_extendFile(inputs) {
        if (isUsedPath(inputs.path)) {
            extendFile(inputs.path, inputs.content);
        }
        else {
            ToolKid.nodeJS.writeFile(inputs);
        }
    };
    publicExports.isDirectory = function TK_NodeJSFile_isDirectory(path) {
        return readPathStats(path).isDirectory();
    };
    publicExports.isUsedPath = isUsedPath;
    publicExports.readDirectory = function TK_NodeJSFile_readDirectory(path) {
        if (!isUsedPath(path) || !publicExports.isDirectory(path)) {
            return [];
        }
        else {
            return readDirectory(path);
        }
    };
    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "nodeJS", entries: publicExports });
        const core = ToolKid.getCoreModule("files");
        ToolKid.register({
            section: "nodeJS",
            entries: {
                readFile: core.readFile,
                resolvePath: core.resolvePath,
                writeFile: core.writeFile,
            }
        });
    }
})();

fileCollection.set("TK_NodeJSFile.js", module.exports);



global.log = ToolKid.debug.terminal.logImportant;
module.exports = ToolKid;
})();