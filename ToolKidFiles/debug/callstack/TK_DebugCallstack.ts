//more detailed console controls
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { callstack: TK_DebugCallstack_file }
interface TK_DebugCallstack_file {
    readCallstack(inputs?: {
        position?: number,
        amount?: number
    }): string[]
}




(function TK_DebugCallstack_init() {
    const publicExports = module.exports = <TK_DebugCallstack_file>{};

    publicExports.readCallstack = function TK_DebugCallstack_readCallstack(inputs = {}) {
        const start = Math.max(1, inputs.position || 1);
        return (<Dictionary>new Error()).stack.split("\n").slice(
            start,
            start + (inputs.amount || 1)
        ).map(readCallstackCleaner);
    };

    const regExpAfterLastSlash = /[^\/\\]+$/;
    const readCallstackCleaner = function TK_DebugCallstack_readCallstackCleaner(part: string) {
        return part.slice(part.search(regExpAfterLastSlash), part.lastIndexOf("."));
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "callstack", functions: publicExports });
    }
})();