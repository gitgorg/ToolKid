//core functionality for custom Library
interface LibraryCore_file {
    createInstance(): Library,
    freezeDeep<Type extends Dictionary>(
        object: Type
    ): Type,
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



(function LibraryCore_init() {
    const coreModuleNames = {
        "building": "LibraryBuild.js",
        "files": "LibraryFiles.js",
        "regularExpression": "LibraryRegularExpression.js",
        "parsing": "LibraryParsing.js",
    };
    const coreModules = <Dictionary>{};
    const publicExports = module.exports = <LibraryCore_file>{};



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
            value: getCoreModule.bind(null,result)
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

    const getCoreModule = function LibraryCore_getCoreModule(
        library:Library, moduleName:string
    ) {
        if (coreModules[moduleName] !== undefined) {
            return coreModules[moduleName];
        }

        const path = coreModuleNames[<"building">moduleName];
        if (path === undefined) {
            throw [
                "LibraryCore_getCoreModule - unknonw core module name:", moduleName,
                "allowed extensions are:", Object.keys(coreModuleNames)
            ];
        }

        const module = coreModules[moduleName] = require(
            require("path").resolve(__dirname, "./" + path)
        );
        if (typeof module === "function") {
            (<any>module)(library);
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
        } else {
            throw [
                "LibraryCore_registerCoreModule - tried to overwrite " + name + ": current value = ", coreModules[name], " new value = ", inputs.module
            ];
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
})();