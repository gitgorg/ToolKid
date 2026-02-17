// regExp flags:
// g = to store .lastIndex inside the regExp
// s = to make . match really EVERY character...
// v = to support all the new unicode stuff

interface LibraryCore_file {
    getCoreModule(name: "parsing"): LibraryParsing_file
}

type LibraryParsing_file = {
    createTextParser(inputs: {
        layerDefinition: TextLayerDefinition,
        parsers: Map<
            TextParserForOpenings | TextParserForClosings | "SKIP" | "REMOVE",
            string[] | string
        >,
    }): TextParser | Error,

    createTextReplacer(inputs: {
        layerDefinition: TextLayerDefinition,
        parseOpenings?: TextParserForOpenings,
        parseClosings: TextParserForClosings
    }): { (inputs: TextParserInputs): string[] },
    createTextReplacer(inputs: {
        layerDefinition: TextLayerDefinition,
        parseOpenings: TextParserForOpenings,
        parseClosings?: TextParserForClosings
    }): { (inputs: TextParserInputs): string[] },

    getLayerDefinition(): TextLayerDefinition,

    readLayerContent(
        inputs: IArguments | Parameters<TextParserForClosings>
    ): string
}

type TextLayerDefinition = {
    [layerName: string]: {
        patterns: (
            [string | RegExp, string | RegExp]
            | string
            | RegExp
        )[],
        contains?: string[],
        isROOTLayer?: false,
        layerData?: Dictionary,
    }
}

type TextParserInputs = string | { text: string } & Dictionary
type TextParserForOpenings = {
    (
        RXResult: RegExpExecArray,
        layerData: { name: string } & Dictionary,
        inputs: { text: string } & Dictionary,
        layerDepth: number,
    ): void | string | string[]
}
type TextParserForClosings = {
    (
        RXResultClosing: RegExpExecArray,
        layerData: { name: string } & Dictionary,
        inputs: { text: string } & Dictionary,
        layerDepth: number,
        RXResultOpening: RegExpExecArray,
    ): void | string | string[] | [
        positionStart: number, positionEnd: number, replacement: string
    ]
}

type TextParser = { (
    inputs: string | { text: string } & Dictionary
): void | Error }



(function LibraryParsing_init() {
    type LayerDataSlim = {
        data: { name: string } & Dictionary,
        directions: (
            [layer: LayerDataSlim, expectedID: number] | undefined
        )[],
        pattern: RegExp,
        parseOpening: TextParserForOpenings,
        parseClosing: TextParserForClosings,
    }
    type LayerData = LayerDataSlim & {
        openings: string[],
        closings: (string | undefined)[],
        contains?: string[],
        signals: (string | undefined)[],
    }



    const publicExports = module.exports = <LibraryParsing_file>{};
    const skipLayer = function LibraryParsing_skipLayer() { };

    publicExports.createTextParser = function LibraryParsing_createTextParser(inputs) {
        const analysed = a_analyseTextParserConfig(<any>inputs);
        if (analysed instanceof Error) {
            return analysed;
        }

        const layers = <{ [key: string]: LayerData }>{
            ROOT: <LayerData><any>{
                data: { name: "ROOT" },
                openings: [],
                closings: [],
                contains: []
            }
        };
        const { layerDefinition } = inputs;
        const { removedLayers } = analysed;
        for (const [layerName, parsers] of Object.entries(analysed.layerParsers)) {
            b_createTextParserLayer(
                <any>layerDefinition[layerName],
                layers, removedLayers,
                layerName, parsers
            );
        }
        Object.values(layers).forEach(
            c_connectTextParserLayers.bind(null, layers, removedLayers)
        );
        Object.values(layers).forEach(
            d_cleanUpTextParserLayer
        );
        return e_parseTextLayer.bind(null, layers.ROOT);
    };



    const a_analyseTextParserConfig = function LibraryParsing_analyseTextParserConfig(
        inputs: Parameters<LibraryParsing_file["createTextParser"]>[0],
    ) {
        const { layerDefinition } = inputs;
        const layerParsers = {} as {
            [layerName: string]: [
                opening: TextParserForOpenings,
                closing: TextParserForClosings
            ]
        };
        const removedLayers = <Set<string>>new Set();

        let parserSet: [
            opening: TextParserForOpenings,
            closing: TextParserForClosings
        ];
        let layerName = "";
        for (let [parser, names] of inputs.parsers.entries()) {
            if (parser === "SKIP") {
                parser = skipLayer;
            } else if (typeof parser !== "function" && parser !== "REMOVE") {
                const error = new Error("invalid parser");
                (<Dictionary>error).details = {
                    names, parser
                };
                return error;
            }

            if (typeof names === "string") {
                names = [names];
            } else if (!(names instanceof Array)) {
                const error = new Error("invalid layer names");
                (<Dictionary>error).details = {
                    parser, layerNames: names,
                };
                return error;
            }

            for (layerName of names) {
                if (layerName[0] === "<") {
                    layerName = layerName.slice(1);
                    parserSet = layerParsers[layerName] || [parser, skipLayer];
                    parserSet[0] = <TextParserForOpenings>parser;
                } else if (layerName[0] === ">") {
                    layerName = layerName.slice(1);
                    parserSet = layerParsers[layerName] || [skipLayer, parser];
                    parserSet[1] = <TextParserForClosings>parser;
                } else {
                    parserSet = layerParsers[layerName] || [parser, parser];
                }
                if (
                    layerDefinition[layerName] !== undefined
                    || layerName === "*"
                ) {
                    layerParsers[layerName] = parserSet;
                    continue
                }

                const error = new Error("unknown layer name");
                (<Dictionary>error).details = {
                    layerName, validLayerNames: Object.keys(layerDefinition)
                };
                return error;
            }
        }

        const wildCards = layerParsers["*"];
        delete layerParsers["*"];
        const error = <Error & { details: string }>new Error("missing parser");
        for (const name of Object.keys(layerDefinition)) {
            parserSet = layerParsers[name];
            if (parserSet === undefined) {
                if (wildCards === undefined) {
                    error.details = "parsers for: " + name;
                    return error;
                }

                parserSet = <any>wildCards.slice(0);
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
            if ((<any>parserSet).includes("REMOVE")) {
                removedLayers.add(name);
            } else {
                layerParsers[name] = parserSet;
            }
        }
        // oder according to layerDefinition
        const orderedParsers = <Dictionary>{};
        for (layerName of Object.keys(layerDefinition)) {
            if (layerParsers[layerName] !== undefined) {
                orderedParsers[layerName] = layerParsers[layerName];
            }
        }
        return {
            layerParsers: orderedParsers,
            removedLayers,
        }
    };

    const b_createTextParserLayer = function LibraryParsing_createTextParserLayer(
        layerConfig: Dictionary,
        layers: { [name: string]: LayerData },
        removedLayers: Set<string>,
        layerName: string,
        parsers: [TextParserForOpenings, TextParserForClosings]
    ) {
        if (removedLayers.has(layerName)) {
            return;
        }

        const layer = layers[layerName] = <any>{
            openings: [],
            closings: [],
            parseOpening: parsers[0],
            parseClosing: parsers[1],
            contains: layerConfig.contains,
            data: (typeof layerConfig.layerData === "object")
                ? Object.assign({}, layerConfig.layerData, { name: layerName })
                : { name: layerName }
        };
        layerConfig.patterns.forEach(function LibraryParsing_createTextParserLayerBrackets(
            pattern: any
        ) {
            if (pattern instanceof Array) {
                layer.openings.push(getTextFromRX(pattern[0]));
                layer.closings.push(getTextFromRX(pattern[1]));
            } else {
                layer.openings.push(getTextFromRX(pattern));
                layer.closings.push(undefined);
            }
        });
        if (layerConfig.isROOTLayer !== false) {
            (<string[]>layers.ROOT.contains).push(layerName);
        }
    };

    const c_connectTextParserLayers = function LibraryParsing_connectTextParserLayers(
        layers: { [key: string]: LayerData },
        removedLayers: Set<string>,
        layer: LayerData,
    ) {
        layer.signals = layer.closings.slice(0);
        const directions = layer.directions = Array(layer.signals.length);
        if (!(layer.contains instanceof Array) || layer.contains.length === 0) {
            // regExp flags explained on top /\
            layer.pattern = new RegExp("(" + layer.signals.join(")|(") + ")", "gs");
            return;
        }

        layer.contains.forEach(function LibraryParsing_connectTextParserLayer(
            name: string
        ) {
            if (removedLayers.has(name)) {
                return;
            }

            if (name === "ROOT") {
                layer.signals.push(...layers.ROOT.signals);
                directions.push(...layers.ROOT.directions);
            } else {
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

    const d_cleanUpTextParserLayer = function LibraryParsing_cleanUpTextParserLayer(
        layer: Dictionary
    ) {
        delete layer.openings;
        delete layer.closings;
        delete layer.signals;
        delete layer.contains;
        Object.freeze(layer.data);
    };

    const e_parseTextLayer = function LibraryParsing_parseTextLayer(
        layer: LayerDataSlim,
        inputs: { text: string },
    ): void | Error {
        if (typeof inputs === "string") {
            inputs = { text: inputs }
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
        let found: any;
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
                found = layer.directions[signalIndex]
                layer = found[0];
                layerDepth += 1;
                layerStack[layerDepth] = layer;
                resultStack[layerDepth] = RXResult;
                wantedSignalIDs[layerDepth] = found[1];
                if (resultString === "") {
                    layer.pattern.lastIndex += 1;
                } else {
                    layer.parseOpening(
                        RXResult, layer.data,
                        inputs, layerDepth,
                    );
                    layer.pattern.lastIndex = lastIndex;
                }
                RXResult = <any>layer.pattern.exec(text);
                continue;
            }

            //closing

            //    unexpected
            if (wantedSignalIDs[layerDepth] !== signalIndex) {
                if (resultString === "") {
                    layer.pattern.lastIndex += 1;
                }
                RXResult = <any>layer.pattern.exec(text);
                continue;
            }

            //    expected

            layer.parseClosing(
                RXResult, layerStack[layerDepth].data,
                inputs, layerDepth,
                resultStack[layerDepth],
            );

            layerDepth -= 1;
            layer = layerStack[layerDepth];
            layer.pattern.lastIndex = lastIndex;
            RXResult = <any>layer.pattern.exec(text);
        }
        if (layerDepth === 0) {
            return;
        }

        const error = <any>new Error("not all layers closed");
        error.layerStack = layerStack.slice(1, layerDepth + 1);
        error.resultStack = resultStack.slice(1, layerDepth + 1);
        return error;
    };



    publicExports.createTextReplacer = function LibraryParsing_createTextReplacer(
        inputs
    ) {
        const parsers = new Map();
        if (inputs.parseOpenings !== undefined) {
            parsers.set(
                replaceOpening.bind(null, inputs.parseOpenings),
                "<*"
            );
        }
        if (inputs.parseClosings !== undefined) {
            parsers.set(
                replaceClosing.bind(null, inputs.parseClosings),
                ">*"
            );
        }
        const parser = publicExports.createTextParser({
            layerDefinition: inputs.layerDefinition,
            parsers
        });
        return replaceTextLayered.bind(null, parser);
    };

    const replaceOpening = function LibraryParsing_replaceOpening(
        parser: TextParserForOpenings,
        RXResult: RegExpExecArray,
        layerData: { name: string } & Dictionary,
        inputs: { text: string, result: string[], position: number },
        layerDepth: number
    ) {
        const returned = parser(
            RXResult, layerData,
            inputs, layerDepth,
        );
        if (returned instanceof Array && returned.length !== 0) {
            inputs.result.push(
                inputs.text.slice(inputs.position, RXResult.index),
                ...<string[]>returned
            );
            inputs.position = RXResult.index + RXResult[0].length;
            return;
        } else if (typeof returned !== "string") {
            return;
        }

        inputs.result.push(inputs.text.slice(
            inputs.position, RXResult.index
        ), returned);
        inputs.position = RXResult.index + RXResult[0].length;
    };

    const replaceClosing = function LibraryParsing_replaceClosing(
        parser: TextParserForClosings,
        RXResult: RegExpExecArray,
        layerData: { name: string } & Dictionary,
        inputs: { text: string, result: string[], position: number },
        layerDepth: number,
        RXOpening: RegExpExecArray
    ) {
        const returned = parser(
            RXResult, layerData,
            inputs, layerDepth,
            RXOpening
        );
        if (returned instanceof Array && returned.length !== 0) {
            if (typeof returned[0] === "number") {
                inputs.result.push(inputs.text.slice(
                    inputs.position, returned[0]
                ), returned[2]);
                inputs.position = <number>returned[1];
            } else {
                inputs.result.push(
                    inputs.text.slice(inputs.position, RXOpening.index),
                    ...<string[]>returned
                );
                inputs.position = RXResult.index + RXResult[0].length;
            }
            return;
        } else if (typeof returned !== "string") {
            return;
        }

        inputs.result.push(inputs.text.slice(
            inputs.position, RXOpening.index
        ), returned);
        inputs.position = RXResult.index + RXResult[0].length;
    };

    const replaceTextLayered = function LibraryParsing_replaceTextLayered(
        parser: { (inputs: TextParserInputs): void },
        inputs: TextParserInputs
    ) {
        if (typeof inputs === "string") {
            inputs = { text: inputs, result: [], position: 0 };
        } else {
            inputs = Object.assign({ result: [], position: 0 }, inputs);
        }
        parser(inputs);
        inputs.result.push(inputs.text.slice(inputs.position))
        return inputs.result;
    };



    // regExp flags explained on top /\
    const escapeCharsRX = new RegExp([
        "\\.", "*", "+", "?", "{", "}", "(", ")", "[", "]", "\\"
    ].join("|\\"), "g");
    const escapeRX = function LibraryParsing_escapeRX(text: string) {
        return text.replace(escapeCharsRX, escapeRXReplacer);
    };

    const escapeRXReplacer = function LibraryParsing_escapeRXReplacer(match: string) {
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

    const getTextFromRX = function LibraryParsing_getTextFromRX(value: string | RegExp) {
        if (value instanceof RegExp) {
            return value.source;
        } else if (typeof value === "string") {
            return escapeRX(value);
        } else {
            return value;
        }
    };

    publicExports.readLayerContent = function LibraryParsing_readLayerContent(inputs): string {
        if (typeof inputs[4] === undefined) {
            throw ["LibraryParsing_readLayerContent - inputs missing 5. argument (opening)"];
        }
        return inputs[2].text.slice(
            inputs[4].index + inputs[4][0].length,
            inputs[0].index
        );
    };



    Object.freeze(publicExports);
})();