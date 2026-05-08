interface ToolKid_file { debug: TK_Debug_file }
interface TK_Debug_file { performance: TK_DebugPerformance_file }
type TK_DebugPerformance_file = {
    // takes number of states - returns method to switch states
    createClock<stateID extends string>(
        ...stateIDs: stateID[]
    ): PerformanceClock<stateID>,
}

type PerformanceClock<StateID extends string> = {
    changeCount(
        stateID: StateID,
        amount: number
    ): void,
    clear(): void,
    read(): {
        counts: { [stateID: string]: number },
        timeTotals: { [stateID: string]: number }
    },
    readNice(): ({
        count: 0 | 1,
        timeTotal: number,
    } | {
        count: number,
        timeTotal: number,
        timeAveragePerCall: number,
    })[],
    start(
        stateID: StateID
    ): void,
    stop(
        stateID: StateID
    ): void,
}



(function TK_DebugPerformance_file() {
    const publicExports = module.exports = <TK_DebugPerformance_file>{};

    const timeTotalName = "timeTotal(s)";



    publicExports.createClock = function TK_DebugPerformance_createClock(
        ...stateIDs
    ) {
        let base = {} as Dictionary;
        for (let i = 0; i < stateIDs.length; i += 1) {
            base[stateIDs[i]] = 0;
        }
        const timeStamps = Object.assign({}, base) as { [stateID: string]: number };
        const counts = Object.assign({}, base) as { [stateID: string]: number };
        const timeTotals = Object.assign({}, base) as { [stateID: string]: number };
        const clock = Object.freeze(<PerformanceClock<string>>{
            changeCount: function TK_DebugPerformance_changeCount(
                stateID, amount
            ) {
                counts[stateID] += amount;
            },
            clear: function TK_DebugPerformance_clockClear() {
                let stateID;
                for (let i = 0; i < stateIDs.length; i += 1) {
                    stateID = stateIDs[i];
                    timeStamps[stateID] = 0;
                    counts[stateID] = 0;
                    timeTotals[stateID] = 0;
                }
            },
            read: function TK_DebugPerformance_clockRead() {
                return {
                    counts,
                    timeTotals
                };
            },
            readNice: function TK_DebugPerformance_clockReadNice() {
                const result = new Array(stateIDs.length) as ReturnType<PerformanceClock<string>["readNice"]>;
                let stateID: string;
                let count: number;
                let timeTotal: number;
                let stateData: Dictionary;
                for (let i = 0; i < stateIDs.length; i += 1) {
                    stateID = stateIDs[i];
                    count = counts[stateID];
                    stateData = result[i] = <any>{ "timeTotal(s)": 0, count, stateID };
                    if (count === 0) {
                        continue;
                    }

                    timeTotal = timeTotals[stateID];
                    stateData[timeTotalName] = Math.ceil(timeTotal / 100) / 10;
                    if (count !== 1 && timeTotal !== 0) {
                        stateData["timeAveragePerCall(ms)"] = Math.ceil(timeTotal / count);
                    }
                }
                return result.sort(clockSort);
            },
            start: function TK_DebugPerformance_clockStart(stateID) {
                if (timeStamps[stateID] === 0) {
                    counts[stateID] += 1;
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
        return clock;
    };

    const clockSort = function TK_DebugPerformance_cockSort(
        a: Dictionary, b: Dictionary
    ) {
        return b[timeTotalName] - a[timeTotalName];
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.register({ section: "debug", subSection: "performance", entries: publicExports });
    }
})();