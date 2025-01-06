//core functionality for custom Library
type LibraryCore_file = {
    createInstance(): Library,
    getTools(): LibraryTools_file
}

type Library = {
    registerFunction(inputs: {
        section: string,
        subSection?: string,
        functions: Dictionary
    }): void
}

interface Dictionary {
    //@ts-ignore
    [key: string]: any
}

interface GenericFunction {(
    ...parameters: any[]
): any}



(function LibraryCore_init() {
    let LibraryTools:LibraryTools_file;
    const publicExports = module.exports = <LibraryCore_file>{};



    const addAsReadOnly = function LibraryCore_addAsReadOnly(inputs: {
        container: Dictionary,
        name: string,
        property: any
    }) {
        Object.defineProperty(inputs.container, inputs.name, {
            enumerable: true,
            value: inputs.property,
            writable: false
        });
    };

    const addAsReadOnlyHidden = function LibraryCore_addAsReadOnlyHidden(inputs: {
        container: Dictionary,
        name: string,
        property: any
    }) {
        Object.defineProperty(inputs.container, inputs.name, {
            enumerable: false,
            value: inputs.property,
            writable: false
        });
    };

    publicExports.createInstance = function LibraryCore_createInstance () {
        const result = <Library>{};
        const registerWithContext = registerFunction.bind(null,result);
        addAsReadOnlyHidden({
            container: result,
            name: "registerFunction",
            property: registerWithContext
        });
        return result;
    };

    const isValidInput = function LibraryCore_isValidInput(
        inputs: Dictionary
    ) {
        return (
            typeof inputs.name !== "string"
            || typeof inputs.helperFunction !== "function"
        )
    };

    publicExports.getTools = function LibraryCore_getTools () {
        if (LibraryTools === undefined) {
            const toolsPath = require("path").resolve(__dirname, "./LibraryTools_nodeJS.js");
            LibraryTools = require(toolsPath);
        }
        return LibraryTools;
    };

    const printRegisterError = function LibraryCore_printRegisterError(inputs: Dictionary) {
        console.error(
            ["LibraryCore_registerHelperToSection - invalid inputs:", inputs]
        );
    };

    const registerFunction = function LibraryCore_registerFunction(
        library:Dictionary,
        inputs:{
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
        if (isValidInput(inputs)) {
            printRegisterError(inputs);
            return;
        }

        const {section, name} = inputs;
        if (section[name] !== undefined) {
            throw ["overwriting library methods is forbidden. tried to overwrite ."+inputs.name+"."+name+": ",section[name]," with: ",inputs.helperFunction];
        }

        addAsReadOnly({
            container: inputs.section,
            name: inputs.name,
            property: inputs.helperFunction
        });
    };

    const registerSection = function LibraryCore_registerSection(inputs:{
        container: Dictionary,
        name: string
    }) {
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
})();