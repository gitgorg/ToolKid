//core functionality for custom Library
type Library_file = {
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

type Dictionary = {
    [key: string]: any
}

type GenericFunction = (
    ...parameters: any[]
) => any



(function Library_init() {
    let LibraryTools:LibraryTools_file;
    const publicExports = module.exports = <Library_file>{};



    const addAsReadOnly = function Library_addAsReadOnly(inputs: {
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

    const addAsReadOnlyHidden = function Library_addAsReadOnlyHidden(inputs: {
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

    publicExports.createInstance = function Library_createInstance () {
        const result = <Library>{};
        const registerWithContext = registerFunction.bind(null,result);
        addAsReadOnlyHidden({
            container: result,
            name: "registerFunction",
            property: registerWithContext
        });
        return result;
    };

    const isValidInput = function Library_isValidInput(
        inputs: Dictionary
    ) {
        return (
            typeof inputs.name !== "string"
            || typeof inputs.helperFunction !== "function"
        )
    };

    publicExports.getTools = function Library_getTools () {
        if (LibraryTools === undefined) {
            LibraryTools = require("./LibraryTools");
        }
        return LibraryTools;
    };

    const printRegisterError = function Library_printRegisterError(inputs: Dictionary) {
        console.error(
            ["Library_registerHelperToSection - invalid inputs:", inputs]
        );
    };

    const registerFunction = function Library_registerFunction(
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

    const registerHelperToSectionLoop = function Library_registerHelperToSectionLoop(inputs: {
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

    const registerHelperToSection = function Library_registerHelperToSection(inputs: {
        section: Dictionary,
        name: string,
        helperFunction: GenericFunction
    }) {
        if (isValidInput(inputs)) {
            printRegisterError(inputs);
            return;
        }

        addAsReadOnly({
            container: inputs.section,
            name: inputs.name,
            property: inputs.helperFunction
        });
    };

    const registerSection = function Library_registerSection(inputs:{
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