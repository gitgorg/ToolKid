//core functionality for custom Library
interface LibraryCore_file {
    createCustomError<Details>(
        message: string,
        details: Details,
        originOffset?: number | string,
    ): CustomError,
    createInstance(): Library,
    freezeDeep<Type extends Dictionary>(
        object: Type
    ): Type,
    getCoreModule(name: "core"): {
        createCustomError: LibraryCore_file["createCustomError"],
        freezDeep: LibraryCore_file["freezeDeep"],
    },
    registerCoreModule(inputs: {
        name: string,
        module: Dictionary,
    }): void,
}



type Library = {
    getCoreModule: LibraryCore_file["getCoreModule"],
    register(inputs: {
        section: string,
        subSection?: string,
        entries: {
            [key: string]: Exclude<any, undefined | null>
        }
    }): void
}

type Dictionary = {
    [key: string]: any
}

type GenericFunction = { (...parameters: any[]): any }

type CustomError = Error & {
    ERROR: string,
    details: any,
    origin: string,
    stack: string,
}



(function LibraryCore_init() {
    const coreModuleNames = {
        "core": "LibraryCore.js",
        "building": "LibraryBuild.js",
        "files": "LibraryFiles.js",
        "regularExpression": "LibraryRegularExpression.js",
        "parsing": "LibraryParsing.js",
    };
    const coreModules = <Dictionary>{};
    const publicExports = module.exports = <LibraryCore_file>{};



    publicExports.createCustomError = function LibraryCore_createCustomError(
        message, details, originOffset = 0
    ) {
        if (typeof message !== "string") {
            throw publicExports.createCustomError(
                "message was not a string", { message }
            );
        }

        const error = <CustomError>new Error(message);
        error.ERROR = message;
        if (typeof originOffset === "string") {
            error.origin = originOffset;
        } else {
            const line = error.stack.split("\n")[2 + originOffset];
            error.origin = line.slice(line.indexOf("at ") + 3, line.indexOf(" ("));
        }
        error.details = details;
        return error;
    };

    publicExports.createInstance = function LibraryCore_createInstance() {
        const result = <Library>{};
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



    const addAsReadOnly = function LibraryCore_addAsReadOnly(inputs: {
        container: Dictionary,
        key: string,
        value: any
    }) {
        Object.defineProperty(inputs.container, inputs.key, {
            enumerable: false,
            value: inputs.value,
            writable: false
        });
    };

    const addAsReadOnlyEnumerable = function LibraryCore_addAsReadOnlyEnumerable(inputs: {
        container: Dictionary,
        key: string,
        value: any
    }) {
        Object.defineProperty(inputs.container, inputs.key, {
            enumerable: true,
            value: inputs.value,
            writable: false
        });
    };

    const freezeDeep = publicExports.freezeDeep = function TK_LiraryCore_freezeDeep(object) {
        if (Object.isFrozen(object)) {
            return object;
        }

        Object.freeze(object);
        for (let key in object) {
            freezeDeep(object[key]);
        }
        return object;
    };

    const getCoreModule = function LibraryCore_getCoreModule(
        library: Library, moduleName: string
    ) {
        if (coreModules[moduleName] !== undefined) {
            return coreModules[moduleName];
        }

        const path = coreModuleNames[<"building">moduleName];
        if (path === undefined) {
            throw publicExports.createCustomError(
                "unknonw core module name",
                { moduleName, allowedExtensions: Object.keys(coreModuleNames) }
            );
        }

        const module = coreModules[moduleName] = require(
            require("path").resolve(__dirname, "./" + path)
        );
        if (typeof module === "function") {
            (<any>module)(library);
        }
        return module;
    };
    publicExports.getCoreModule = getCoreModule.bind(null, <any>publicExports);

    publicExports.registerCoreModule = function LibraryCore_registerCoreModule(inputs) {
        const { name, module } = inputs;
        if (coreModules[name] === undefined) {
            coreModules[name] = module;
            if (typeof module === "function") {
                module(publicExports);
            }
        } else {
            throw publicExports.createCustomError(
                "tried to overwrite core module",
                Object.assign({ previousModule: coreModules[name] }, inputs)
            );
        }
    };

    const register = function LibraryCore_register(
        library: Library,
        inputs: Parameters<Library["register"]>[0]
    ) {
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

    const registerEntryToSection = function LibraryCore_registerEntryToSection(inputs: {
        section: Dictionary,
        name: string,
        entry: GenericFunction | Dictionary
    }) {
        if (typeof inputs.name !== "string") {
            throw publicExports.createCustomError("invalid library entry name", inputs);
        }

        const { entry } = inputs;
        if (entry === null || ["function", "object"].indexOf(typeof entry) === -1) {
            throw publicExports.createCustomError("invalid library entry type", inputs);
        }

        const { section, name } = inputs;
        if (section[name] !== undefined) {
            throw publicExports.createCustomError(
                "tried to overwrite library entry",
                Object.assign({ previousEntry: section[name] }, inputs)
            );
        }

        addAsReadOnlyEnumerable({
            container: section,
            key: name,
            value: publicExports.freezeDeep(entry),
        });
    };

    const registerSection = function LibraryCore_registerSection(inputs: {
        container: Dictionary,
        name: string
    }) {
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

    publicExports.registerCoreModule({
        name: "core",
        module: {
            createCustomError: publicExports.createCustomError,
            freezeDeep,
        }
    });



    Object.freeze(publicExports);
})();