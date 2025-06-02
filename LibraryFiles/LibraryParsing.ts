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
    }): { (text: string): void },
    createTextParser(inputs: {
        layerDefinition: TextLayerDefinition,
        parseOpenings: TextParserForOpenings,
        parseClosings?: TextParserForClosings
    }): { (text: string): void },

    createTextReplacer(inputs: {
        layerDefinition: TextLayerDefinition,
        parseOpenings?: TextParserForOpenings,
        parseClosings: TextParserForClosings
    }): { (text: string): string },
    createTextReplacer(inputs: {
        layerDefinition: TextLayerDefinition,
        parseOpenings: TextParserForOpenings,
        parseClosings?: TextParserForClosings
    }): { (text: string): string },

    getLayerDefinition(): TextLayerDefinition,
}

type TextMatcher = string | RegExp
type TextGenerator = string | TextGeneratorFunction
type TextGeneratorFunction = { (RXResult: RegExpExecArray): string | number }
type TextLayerDefinition = {
    [layerName: string]: {
        patterns: (
            [string | RegExp, string | RegExp]
            | string
            | RegExp
        )[],
        contains?: string[],
        isMAINLayer?: false
    }
}
type TextParserForOpenings = {
    (
        RXResult: RegExpExecArray,
        layerName: string,
        layerDepth: number,
    ): void | string
}
type TextParserForClosings = {
    (
        RXResultClosing: RegExpExecArray,
        layerName: string,
        layerDepth: number,
        RXResultOpening: RegExpExecArray,
    ): void | string
}



(function LibraryParsing_init() {
    type LayerDataSlim = {
        name: string,
        directions: (LayerData | undefined)[],
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
        textInput: string,
    }



    const publicExports = module.exports = <LibraryParsing_file>{};
    const doNothing = function LibraryParsing_doNothing() { };

    publicExports.createTextParser = function LibraryParsing_createTextParser(inputs) {
        const layers = <{ [key: string]: LayerData }>{
            MAIN: <LayerData><any>{
                name: "MAIN",
                openings: [],
                closings: [],
                contains: []
            }
        };
        Object.entries(inputs.layerDefinition).forEach(a_createTextParserLayer.bind(null, layers));
        Object.values(layers).forEach(b_connectTextParserLayer.bind(null, layers));
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
        const layer = <any>{ name: key, openings: [], closings: [], contains: layerData.contains };
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

    const b_connectTextParserLayer = function LibraryParsing_connectTextParserLayer(
        layers: { [key: string]: LayerData }, layer: LayerData
    ) {
        layer.signals = layer.closings.slice(0);
        const directions = layer.directions = Array(layer.signals.length);
        if (layer.contains instanceof Array) {
            layer.contains.forEach(function (key: string) {
                if (key === "MAIN") {
                    layer.signals.push(...layers.MAIN.signals);
                    directions.push(...layers.MAIN.directions);
                } else {
                    const subLayer = layers[key];
                    layer.signals.push(...subLayer.openings);
                    directions.push(...Array(subLayer.openings.length).fill(subLayer));
                }
            });
        }
        // regExp flags explained on top /\
        layer.pattern = new RegExp("(" + layer.signals.join(")|(") + ")", "gsv");
    };

    const c_cleanUpTextParserLayer = function LibraryParsing_cleanUpTextParserLayer(
        layer: Dictionary
    ) {
        delete layer.openings;
        delete layer.closings;
        delete layer.signals;
        delete layer.contains;
    };

    const d_parseTextLayered = function LibraryParsing_parseTextLayered(
        layer: LayerDataSlim,
        parseOpenings: GenericFunction,
        parseClosings: GenericFunction,
        text: string,
    ) {
        let layerDepth = 0;
        let RXResult = <RegExpExecArray>layer.pattern.exec(text);
        const layerStack = new Array(20);
        layerStack[0] = layer;
        const resultStack = new Array(20);
        resultStack[0] = RXResult;
        let lastIndex = 0;
        let resultString = "";
        while (RXResult !== null) {
            lastIndex = layer.pattern.lastIndex;
            resultString = RXResult[0];
            layer = <LayerData>layer.directions[
                RXResult.indexOf(resultString, 1) - 1
            ];
            if (layer === undefined) {
                if (resultString !== "") {
                    parseClosings(RXResult, layerStack[layerDepth].name, layerDepth, resultStack[layerDepth]);
                }
                layerDepth -= 1;
                layer = layerStack[layerDepth];
            } else {
                layerDepth += 1;
                layerStack[layerDepth] = layer;
                resultStack[layerDepth] = RXResult;
                if (resultString !== "") {
                    parseOpenings(RXResult, layer.name, layerDepth);
                }
            }
            layer.pattern.lastIndex = lastIndex;
            RXResult = <RegExpExecArray>layer.pattern.exec(text);
        }
    };



    publicExports.createTextReplacer = function LibraryParsing_createTextReplacer(
        inputs
    ) {
        const state = <StateForReplacing>{ textInput: "", result: "", position: 0 };
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
        parser: GenericFunction,
        RXResult: RegExpExecArray,
        layerName: string,
        layerDepth: number,
    ) {
        const returned = parser(RXResult, layerName, layerDepth);
        if (typeof returned !== "string") {
            return;
        }

        state.result += state.textInput.slice(
            state.position, RXResult.index
        ) + returned;
        state.position = RXResult.index + RXResult[0].length;
    };

    const replaceClosing = function LibraryParsing_replaceClosing(
        state: StateForReplacing,
        parser: GenericFunction,
        RXResult: RegExpExecArray,
        layerName: string,
        layerDepth: number,
        RXOpening: RegExpExecArray,
    ) {
        const returned = parser(RXResult, layerName, layerDepth, RXOpening);
        if (typeof returned !== "string") {
            return;
        }

        state.result += state.textInput.slice(
            state.position, RXOpening.index
        ) + returned;
        state.position = RXResult.index + RXResult[0].length;
    };

    const replaceTextLayered = function LibraryParsing_replaceTextLayered(
        state: StateForReplacing, textInput: string
    ) {
        state.position = 0;
        state.textInput = textInput;
        state.result = "";
        state.parseTextLayered(textInput);
        return state.result + textInput.slice(state.position);
    };



    // regExp flags explained on top /\
    const escapeCharsRX = new RegExp("\\" + [
        ".", "*", "+", "?", "{", "}", "(", ")", "[", "]", "\\"
    ].join("|\\"), "g");
    const escapeRX = function LibraryParsing_escapeRX(text: string) {
        return text.replaceAll(escapeCharsRX, escapeRXReplacer);
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



    Object.freeze(publicExports);
})();