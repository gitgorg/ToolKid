//core functionality for custom Library
type LibraryCore_file = {
    createInstance(): Library,
    getExtension(name: "parsing"): LibraryParsing_file,
    getTools(): LibraryTools_file
}

type Library = {
    registerFunctions(inputs: {
        section: string,
        subSection?: string,
        functions: Dictionary
    }): void
}

interface Dictionary {
    //@ts-ignore
    [key: string]: any
}

interface GenericFunction {
    (
        ...parameters: any[]
    ): any
}



(function LibraryCore_init() {
    const extensionPaths = {
        "parsing": "LibraryParsing.js"
    };
    let LibraryTools: LibraryTools_file;
    const publicExports = module.exports = <LibraryCore_file>{};



    publicExports.createInstance = function LibraryCore_createInstance() {
        const result = <Library>{};
        addAsReadOnly({
            container: result,
            key: "registerFunctions",
            value: registerFunction.bind(null, result)
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

    publicExports.getExtension = function LibraryCore_getExtension(name) {
        const path = extensionPaths[name];
        if (path === undefined) {
            throw [
                "LibraryCore_getExtension - unknonw extension:", name,
                "allowed extensions are:", Object.keys(extensionPaths)
            ];
        }

        return require(
            require("path").resolve(__dirname, "./" + path)
        );
    };

    publicExports.getTools = function LibraryCore_getTools() {
        if (LibraryTools === undefined) {
            LibraryTools = require(
                require("path").resolve(__dirname, "./LibraryTools_nodeJS.js")
            );
        }
        return LibraryTools;
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