interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { performance: TK_DebugPerformance_file }
type TK_DebugPerformance_file = {
    // takes number of states - returns method to switch states
    createClock(
        stateCount: number
    ): PerformanceClock,
}

type PerformanceClock = {
    changeCount(
        stateID: number, amount: number
    ): void,
    clear(): void,
    read(): {
        timeTotals: number[],
        callCounts: number[],
    },
    start(
        stateID: number
    ): void,
    stop(
        stateID: number
    ): void,
}



(function TK_DebugPerformance_file() {
    const publicExports = module.exports = <TK_DebugPerformance_file>{};

    publicExports.createClock = function TK_DebugPerformance_createClock(stateCount) {
        const timeStamps = new Array(stateCount).fill(0);
        const timeTotals = new Array(stateCount).fill(0);
        const callCounts = new Array(stateCount).fill(0);
        const readData = Object.freeze({
            timeTotals,
            callCounts,
        });
        return Object.freeze(<PerformanceClock>{
            changeCount: function TK_DebugPerformance_changeCount(
                stateID, amount
            ) {
                callCounts[stateID] += amount;
            },
            clear: function TK_DebugPerformance_clockClear() {
                timeTotals.fill(0);
                callCounts.fill(0);
                timeStamps.fill(0);
            },
            read: function TK_DebugPerformance_clockRead() {
                return readData;
            },
            start: function TK_DebugPerformance_clockStart(stateID) {
                if (timeStamps[stateID] === 0) {
                    callCounts[stateID] += 1;
                    timeStamps[stateID] = Date.now();
                }
            },
            stop: function TK_DebugPerformance_clockStop(stateID) {
                if (timeStamps[stateID] !== 0) {
                    timeTotals[stateID] += Date.now() - timeStamps[stateID];
                    timeStamps[stateID] = 0;
                }
            },
        });
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "performance", entries: publicExports });
    }
})();