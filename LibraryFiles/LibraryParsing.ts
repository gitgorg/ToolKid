// regExp flags:
// g = to store .lastIndex inside the regExp
// s = to make . match really EVERY character...
// v = to support all the new unicode stuff

interface LibraryParsing_file {
    createSimpleRX(
        pattern: string
    ): RegExp,
    createSimpleRX(inputs: RegExpInputs & {
        isRepeatable?: true,
    }): RegExp,
    createSimpleRX(inputs: RegExpInputs & {
        isFromStartToEnd?: true,
    }): RegExp,

    createTextParser(
        firstPattern: [TextMatcher, { (RXResult: RegExpExecArray): void }],
        ...patterns: [TextMatcher, { (RXResult: RegExpExecArray): void }][]
    ): { (text: string): void },
    createTextParserLayered(inputs: {
        layers: Dictionary,
        parser(): void
    }): { (text: string): void },
    createTextReplacer(
        firstPattern: [TextMatcher, TextGenerator],
        ...patterns: [TextMatcher, TextGenerator][]
    ): { (text: string): string },
}

type TextMatcher = string | RegExp
type TextGenerator = string | TextGeneratorFunction
type TextGeneratorFunction = { (RXResult: RegExpExecArray): string | number }
type RegExpInputs = { pattern: string }



(function LibraryParsing_init() {
    type LayerData = {
        name: string,
        openings: string[],
        closings: (string|undefined)[],
        contains?: string[],
        signals: (string|undefined)[],
        directions: (LayerData | undefined)[],
        pattern: RegExp
    }



    const publicExports = module.exports = <LibraryParsing_file>{};

    const regExSimplify = /(\.|\?)|(\*\*)|(\*)/g;
    publicExports.createSimpleRX = function LibraryParsing_createRegEx(inputs: any) {
        if (typeof inputs === "string") {
            inputs = { pattern: inputs };
        }
        let pattern = <string>inputs.pattern;
        pattern = pattern.replaceAll(regExSimplify, function (
            match, control, doubleStar, star, index
        ) {
            if (control !== undefined) {
                return "\\" + match;
            } else if (doubleStar !== undefined) {
                return ".*";
            } else if (star !== undefined) {
                return ".*?";
            }
            return match;
        });
        if (inputs.isFromStartToEnd === true) {
            pattern = "^" + pattern + "$";
        }

        // regExp flags explained on top /\
        let flags = "sv";
        if (inputs.isRepeatable === true) {
            flags += "g";
        }
        return new RegExp(pattern, flags);
    };

    publicExports.createTextParser = function LibraryParsing_createTextParser(...patterns) {
        return parseText.bind(null, ...setupPatternAndHandler(patterns));
    };

    publicExports.createTextParserLayered = function LibraryParsing_createTextParserLayered(inputs) {
        let layer: LayerData;
        const layers = <{[key:string]: LayerData}>{
            MAIN: <LayerData><any>{
                name: "MAIN",
                openings: [],
                closings: [],
                contains: []
            }
        };
        Object.entries(inputs.layers).forEach(function ([key, layerData]) {
            layer = <LayerData><any>{ name: key, openings: [], closings: [], contains: layerData.contains };
            layers[key] = layer;
            layerData.patterns.forEach(function (pattern: any) {
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
        });

        log(111, layers);
        Object.values(layers).forEach(function (layer) {
            const signals = layer.signals = layer.closings.slice(0);
            const directions = layer.directions = new Array(signals.length);
            if (layer.contains instanceof Array) {
                layer.contains.forEach(function (key: string) {
                    if (key === "MAIN") {
                        signals.push(...layers.MAIN.signals);
                        directions.push(...layers.MAIN.directions);
                    } else {
                        const subLayer = layers[key];
                        signals.push(...subLayer.openings);
                        directions.push(...subLayer.openings.map(function(){return subLayer}));
                    }
                });
            }
            layer.pattern = new RegExp("(" + layer.signals.join(")|(") + ")", "gsv");
        });
        log(333, layers)
        return parseTextLayers.bind(null, layers.MAIN, inputs.parser);
    };



    publicExports.createTextReplacer = function LibraryParsing_createTextReplacer(...patterns) {
        return replaceText.bind(null, ...setupPatternAndHandler(patterns));
    };

    const getTextFromRX = function LibraryParsing_getTextFromRX(value: string | RegExp) {
        if (value instanceof RegExp) {
            return value.source;
        } else if (typeof value === "string") {
            return escapeRegExp(value);
        } else {
            return value;
        }
    };

    const parseText = function LibraryParsing_parseText(
        pattern: RegExp,
        handler: { (RXResult: RegExpExecArray): void },
        text: string,
    ) {
        let RXResult = pattern.exec(text);
        while (RXResult !== null) {
            handler(RXResult);
            if (RXResult[0].length === 0) {
                throw pattern;
            }
            RXResult = pattern.exec(text);
        }
    };

    const parseTextLayers = function LibraryParsing_parseTextLayers(
        layer: LayerData,
        parser: GenericFunction,
        text: string,
    ) {
        const layerStack = new Array(20);
        layerStack[0] = layer;
        let depth = 0;
        let RXResult = <RegExpExecArray>layer.pattern.exec(text);
        let lastIndex = 0;
        let foundSignal = "";
        while (RXResult !== null) {
            foundSignal = RXResult[0];
            layer = <LayerData>layer.directions[
                RXResult.indexOf(foundSignal, 1) - 1
            ];
            if (layer === undefined) {
                if (foundSignal !== "") {
                    parser(RXResult, layerStack[depth], depth);
                }
                depth -= 1;
                layer = layerStack[depth];
            } else {
                depth += 1;
                layerStack[depth] = layer;
                if (foundSignal !== "") {
                    parser(RXResult, layer, depth);
                }
            }
            lastIndex = layer.pattern.lastIndex;
            layer.pattern.lastIndex = lastIndex;
            RXResult = <RegExpExecArray>layer.pattern.exec(text);
        }
    };

    const replaceText = function LibraryParsing_replaceText(
        pattern: RegExp,
        handler: { (RXResult: RegExpExecArray): string },
        text: string,
    ) {
        const parts = <string[]>[];
        let position = 0;
        parseText(pattern, function (RXResult) {
            if (position !== RXResult.index) {
                parts.push(text.slice(position, RXResult.index));
            }
            parts.push(handler(RXResult));
            position = pattern.lastIndex;
        }, text);
        if (position !== text.length) {
            parts.push(text.slice(position))
        }
        return parts.join("");
    };

    const escapesForRX = [
        ".", "*", "+", "?", "{", "}", "(", ")", "\\"
    ];
    const RXescape = new RegExp("\\" + escapesForRX.join("|\\"), "g");
    const escapeRegExp = replaceText.bind(null,
        RXescape,
        function (RXResult: RegExpExecArray) {
            return "\\" + RXResult[0];
        }
    );

    const returnText = function LibraryParsing_returnText(value: string) {
        return value;
    };

    const setupPatternAndHandler = function (
        patterns: [TextMatcher, { (expressionResult: RegExpExecArray): any } | string][]
    ): [RegExp, { (expressionResult: RegExpExecArray): any }] {
        let matchers = <string[]>new Array(patterns.length);
        let handlers = <TextGenerator[]>new Array(patterns.length);
        patterns.forEach(function LibraryParsing_createTextReplacerGenerator(pattern, index) {
            matchers[index] = getTextFromRX(pattern[0]);
            if (typeof pattern[1] === "function") {
                handlers[index] = pattern[1];
            } else {
                handlers[index] = returnText.bind(null, pattern[1]);
            }
        });
        return [
            (handlers.length === 1)
                ? new RegExp(matchers[0], "gsv")
                : new RegExp("(" + matchers.join(")|(") + ")", "gsv"),
            (patterns.length === 1)
                ? handlers[0]
                : useWantedHandler.bind(null, handlers)
        ];
    };

    const useWantedHandler = function LibraryParsing_useWantedHandler(
        handlers: { (expressionResult: RegExpExecArray): any }[],
        RXResult: RegExpExecArray
    ) {
        return handlers[
            RXResult.indexOf(RXResult[0], 1) - 1
        ](RXResult);
    };



    Object.freeze(publicExports);
})();