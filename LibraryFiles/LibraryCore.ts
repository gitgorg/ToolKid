//core functionality for custom Library
interface LibraryCore_file {
    createInstance(): Library,
    registerCoreModule(inputs: {
        name: string,
        module: Dictionary,
    }): void,
}

type Library = {
    getCoreModule: LibraryCore_file["getCoreModule"],
    registerFunctions(inputs: {
        section: string,
        subSection?: string,
        functions: Dictionary
    }): void
}
type Dictionary = {
    [key: string]: any
}
type GenericFunction = { (...parameters: any[]): any }



(function LibraryCore_init() {
    const coreModuleNames = {
        "building": "LibraryBuilding.js",
        "parsing": "LibraryParsing.js",
        "files": "LibraryFiles.js",
    };
    const coreModules = <Dictionary>{};
    const publicExports = module.exports = <LibraryCore_file>{};



    publicExports.createInstance = function LibraryCore_createInstance() {
        const result = <Library>{};
        addAsReadOnly({
            container: result,
            key: "registerFunctions",
            value: registerFunction.bind(null, result)
        });
        addAsReadOnly({
            container: result,
            key: "getCoreModule",
            value: publicExports.getCoreModule
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

    publicExports.getCoreModule = function LibraryCore_getCoreModule(moduleName) {
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

        return coreModules[moduleName] = require(
            require("path").resolve(__dirname, "./" + path)
        );
    };

    publicExports.registerCoreModule = function LibraryCore_registerCoreModule(inputs) {
        const { name } = inputs;
        if (coreModules[name] === undefined) {
            coreModules[name] = inputs.module;
        } else {
            throw [
                "LibraryCore_registerCoreModule - tried to overwrite " + name + ": current value = ", coreModules[name], " new value = ", inputs.module
            ];
        }
    };

    const registerFunction = function LibraryCore_registerFunction(
        library: Dictionary,
        inputs: {
            section: string,
            subSection?: string,
            functions: Dictionary
        }
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
        registerHelperToSectionLoop({
            section: section,
            helpers: inputs.functions
        });
    };

    const registerHelperToSectionLoop = function LibraryCore_registerHelperToSectionLoop(inputs: {
        section: Dictionary,
        helpers: Dictionary
    }) {
        const { section, helpers } = inputs;
        for (let name in helpers) {
            registerHelperToSection({
                section, name, helperFunction: helpers[name]
            });
        }
    };

    const registerHelperToSection = function LibraryCore_registerHelperToSection(inputs: {
        section: Dictionary,
        name: string,
        helperFunction: GenericFunction
    }) {
        if (typeof inputs.name !== "string" || typeof inputs.helperFunction !== "function") {
            throw ["LibraryCore_registerHelperToSection - invalid inputs:", inputs];
        }

        const { section, name } = inputs;
        if (section[name] !== undefined) {
            throw ["overwriting library methods is forbidden. tried to overwrite ." + name + ": ", section[name], " with: ", inputs.helperFunction];
        }

        addAsReadOnlyEnumerable({
            container: section,
            key: name,
            value: inputs.helperFunction
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