(function TK_DataTypesError_test() {
    const { test, assert, shouldPass } = ToolKid.debug.test;
    const { createCustomError } = ToolKid.dataTypes.error;



    const shouldeBeError = shouldPass(ToolKid.dataTypes.checks.isError);
    test({
        subject: createCustomError,
        execute: function basics() {
            let error: CustomError = createCustomError("error", true);
            assert({
                "error": [error, shouldeBeError],
                "error.details": [error.details, true],
            });
            error = createCustomError("error2", undefined);
            assert({
                "error2": [error, shouldeBeError],
                "error2.details": [error.details, undefined],
            });
        }
    }, {
        subject: createCustomError,
        execute: function failures() {
            assert({
                "no inputs": [function () {
                    //@ts-ignore
                    return createCustomError();
                }, Error],
                "no message": [function () {
                    //@ts-ignore
                    return createCustomError(undefined, "name");
                }, Error],
            });
        }
    });
})();