//more detailed console controls
interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { callstack: TK_DebugCallstack_file }
interface TK_DebugCallstack_file {
    extractFileName(
        stackFrameText: string
    ): string,
    readFrames(inputs?: {
        position?: number,
        amount?: number
    }): string[],
}




(function TK_DebugCallstack_init() {
    const publicExports = module.exports = <TK_DebugCallstack_file>{};

    publicExports.readFrames = function TK_DebugCallstack_readCallstack(inputs = {}) {
        const firstFrameIndex = Math.max(1, inputs.position || 1);
        return (<Dictionary>new Error()).stack.split("\n").slice(
            firstFrameIndex,
            firstFrameIndex + (inputs.amount || 1)
        ).map(extractFileName);
    };

    const regExpAfterLastSlash = /[^\/\\]+$/;
    const extractFileName = publicExports.extractFileName = function TK_DebugCallstack_extractFileName(part) {
        const filePart = part.slice(part.search(regExpAfterLastSlash));
        return filePart.split(":")[0];
    };;



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "debug", subSection: "callstack", functions: publicExports });
    }
})();