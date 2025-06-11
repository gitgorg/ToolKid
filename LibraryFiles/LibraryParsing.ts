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
        parseOpenings?: TextParserForOpenings,
        parseClosings: TextParserForClosings
    }): { (inputs: TextParserInputs): void | Error },
    createTextParser(inputs: {
        layerDefinition: TextLayerDefinition,
        parseOpenings: TextParserForOpenings,
        parseClosings?: TextParserForClosings
    }): { (inputs: TextParserInputs): void | Error },

    createTextReplacer(inputs: {
        layerDefinition: TextLayerDefinition,
        parseOpenings?: TextParserForOpenings,
        parseClosings: TextParserForClosings
    }): { (inputs: TextParserInputs): string },
    createTextReplacer(inputs: {
        layerDefinition: TextLayerDefinition,
        parseOpenings: TextParserForOpenings,
        parseClosings?: TextParserForClosings
    }): { (inputs: TextParserInputs): string },

    getLayerDefinition(): TextLayerDefinition,

    readLayerContent(inputs: IArguments): string
}

type TextLayerDefinition = {
    [layerName: string]: {
        patterns: (
            [string | RegExp, string | RegExp]
            | string
            | RegExp
        )[],
        contains?: string[],
        isMAINLayer?: false,
        layerData?: Dictionary,
    }
}

type TextParserInputs = string | ({ text: string } & Dictionary)
type TextParserForOpenings = {
    (
        RXResult: RegExpExecArray,
        layerData: { name: string } & Dictionary,
        inputs: { text: string } & Dictionary,
        layerDepth: number,
    ): void | string
}
type TextParserForClosings = {
    (
        RXResultClosing: RegExpExecArray,
        layerData: { name: string } & Dictionary,
        inputs: { text: string } & Dictionary,
        layerDepth: number,
        RXResultOpening: RegExpExecArray,
    ): void | string
}



(function LibraryParsing_init() {
    type LayerDataSlim = {
        data: {
            name: string
        } & Dictionary,
        directions: (
            [layer: LayerDataSlim, expectedID: number]
            | undefined
        )[],
        pattern: RegExp,
    }
    type LayerData = LayerDataSlim & {
        isMain?: false,
        openings: string[],
        closings: (string | undefined)[],
        contains?: string[],
        signals: (string | undefined)[],
    }
    type StateForReplacing = {
        parseTextLayered(text: string): void,
        position: number,
        result: string,
    }



    const publicExports = module.exports = <LibraryParsing_file>{};
    const doNothing = function LibraryParsing_doNothing() { };

    publicExports.createTextParser = function LibraryParsing_createTextParser(inputs) {
        const layers = <{ [key: string]: LayerData }>{
            MAIN: <LayerData><any>{
                data: { name: "MAIN" },
                openings: [],
                closings: [],
                contains: []
            }
        };
        Object.entries(inputs.layerDefinition).forEach(a_createTextParserLayer.bind(null, layers));
        Object.values(layers).forEach(b_connectTextParserLayers.bind(null, layers));
        Object.values(layers).forEach(c_cleanUpTextParserLayer);
        return d_parseTextLayered.bind(null,
            layers.MAIN,
            inputs.parseOpenings || doNothing,
            inputs.parseClosings || doNothing
        );
    };

    const a_createTextParserLayer = function LibraryParsing_createTextParserLayer(
        layers: { [key: string]: LayerData }, [key, layerData]: [string, Dictionary]
    ) {
        const layer = <any>{
            openings: [],
            closings: [],
            contains: layerData.contains,
            data: (typeof layerData.layerData === "object")
                ? Object.assign({}, layerData.layerData, { name: key })
                : { name: key }
        };
        layers[key] = layer;
        layerData.patterns.forEach(function LibraryParsing_createTextParserLayerBrackets(
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
        if (layerData.isMAINLayer !== false) {
            (<string[]>layers.MAIN.contains).push(key);
        }
    };

    const b_connectTextParserLayers = function LibraryParsing_connectTextParserLayers(
        layers: { [key: string]: LayerData }, layer: LayerData
    ) {
        layer.signals = layer.closings.slice(0);
        const count = layer.signals.length;
        const directions = layer.directions = Array(count);
        if (layer.contains instanceof Array) {
            layer.contains.forEach(function LibraryParsing_connectTextParserLayer(key: string) {
                if (key === "MAIN") {
                    layer.signals.push(...layers.MAIN.signals);
                    directions.push(...layers.MAIN.directions);
                } else {
                    const subLayer = layers[key];
                    layer.signals.push(...subLayer.openings);
                    let count = subLayer.openings.length;
                    for (let i = 0; i < count; i += 1) {
                        directions.push([subLayer, i]);
                    }
                }
            });
        }
        // regExp flags explained on top /\
        layer.pattern = new RegExp("(" + layer.signals.join(")|(") + ")", "gs");
    };

    const c_cleanUpTextParserLayer = function LibraryParsing_cleanUpTextParserLayer(
        layer: Dictionary
    ) {
        delete layer.openings;
        delete layer.closings;
        delete layer.signals;
        delete layer.contains;
        Object.freeze(layer.data);
    };

    const d_parseTextLayered = function LibraryParsing_parseTextLayered(
        layer: LayerDataSlim,
        parseOpenings: TextParserForOpenings,
        parseClosings: TextParserForClosings,
        inputs: { text: string },
    ): void | Error {
        if (typeof inputs === "string") {
            inputs = { text: inputs }
        }
        const text = inputs.text;
        let layerDepth = 0;
        let lastIndex = layer.pattern.lastIndex = 0;
        let RXResult = <RegExpExecArray & { wantedSignalID: number }>layer.pattern.exec(text);
        const layerStack = new Array(20);
        layerStack[0] = layer;
        const resultStack = new Array(20);
        resultStack[0] = RXResult;
        let resultString = "";
        let signalID = 0;
        let found: any;
        while (RXResult !== null) {
            lastIndex = layer.pattern.lastIndex;
            resultString = RXResult[0];
            signalID = RXResult.indexOf(resultString, 1) - 1;
            //opening
            if (layer.directions[signalID] !== undefined) {
                found = layer.directions[signalID]
                layer = found[0];
                layerDepth += 1;
                layerStack[layerDepth] = layer;
                resultStack[layerDepth] = RXResult;
                RXResult.wantedSignalID = found[1];
                if (resultString !== "") {
                    parseOpenings(
                        RXResult, layer.data,
                        inputs, layerDepth,
                    );
                }
                if (resultString === "") {
                    layer.pattern.lastIndex += 1;
                } else {
                    layer.pattern.lastIndex = lastIndex;
                }
                RXResult = <any>layer.pattern.exec(text);
                continue;
            }

            //closing

            //    unexpected
            if (resultStack[layerDepth].wantedSignalID !== signalID) {
                if (resultString === "") {
                    layer.pattern.lastIndex += 1;
                } else {
                    layer.pattern.lastIndex = lastIndex;
                }
                RXResult = <any>layer.pattern.exec(text);
                continue;
            }

            //    expected
            if (resultString !== "") {
                parseClosings(
                    RXResult, layerStack[layerDepth].data,
                    inputs, layerDepth,
                    resultStack[layerDepth],
                );
            }
            layerDepth -= 1;
            layer = layerStack[layerDepth];
            layer.pattern.lastIndex = lastIndex;
            RXResult = <any>layer.pattern.exec(text);
        }
        if (layerDepth !== 0) {
            const error = <Error & {
                layerStack: any[],
                resultStack: any[]
            }>new Error("not all layers closed");
            error.layerStack = layerStack.slice(1, layerDepth + 1);
            error.resultStack = resultStack.slice(1, layerDepth + 1);
            // log(777, "not all layers closed inside:", inputs.text.slice(0, 50))
            // for (let i = 1; i <= layerDepth; i += 1) {
            //     layer = layerStack[i];
            //     RXResult = resultStack[i];
            //     log("depth", i, layer.data.name, [RXResult[0]], RXResult.index, [inputs.text.slice(RXResult.index, RXResult.index + 23)]
            //     )
            // }
            return error;
        }
    };



    publicExports.createTextReplacer = function LibraryParsing_createTextReplacer(
        inputs
    ) {
        const state = <StateForReplacing>{ result: "", position: 0 };
        state.parseTextLayered = publicExports.createTextParser({
            layerDefinition: inputs.layerDefinition,
            parseOpenings: (inputs.parseOpenings === undefined)
                ? undefined
                : replaceOpening.bind(null, state, inputs.parseOpenings),
            parseClosings: (inputs.parseClosings === undefined)
                ? undefined
                : replaceClosing.bind(null, state, inputs.parseClosings)
        });
        return replaceTextLayered.bind(null, state);
    };

    const replaceOpening = function LibraryParsing_replaceOpening(
        state: StateForReplacing,
        parser: TextParserForOpenings,
        RXResult: RegExpExecArray,
        layerData: { name: string } & Dictionary,
        inputs: { text: string },
        layerDepth: number
    ) {
        const returned = parser(
            RXResult, layerData,
            inputs, layerDepth,
        );
        if (typeof returned !== "string") {
            return;
        }

        state.result += inputs.text.slice(
            state.position, RXResult.index
        ) + returned;
        state.position = RXResult.index + RXResult[0].length;
    };

    const replaceClosing = function LibraryParsing_replaceClosing(
        state: StateForReplacing,
        parser: TextParserForClosings,
        RXResult: RegExpExecArray,
        layerData: { name: string } & Dictionary,
        inputs: { text: string },
        layerDepth: number,
        RXOpening: RegExpExecArray
    ) {
        const returned = parser(
            RXResult, layerData,
            inputs, layerDepth,
            RXOpening
        );
        if (typeof returned !== "string") {
            return;
        }

        state.result += inputs.text.slice(
            state.position, RXOpening.index
        ) + returned;
        state.position = RXResult.index + RXResult[0].length;
    };

    const replaceTextLayered = function LibraryParsing_replaceTextLayered(
        state: StateForReplacing, textInput: string
    ) {
        state.position = 0;
        state.result = "";
        state.parseTextLayered(textInput);
        return state.result + textInput.slice(state.position);
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
                isMAINLayer: false,
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