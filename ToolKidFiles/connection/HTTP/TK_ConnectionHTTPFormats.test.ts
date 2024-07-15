(function TK_ConnectionHTTPtest() {
    const { readMediaType } = ToolKid.connection.HTTP;
    const { assertEquality, test } = ToolKid.debug.test;

    test({
        subject: readMediaType,
        execute: function basicMediaType() {
            assertEquality({
                "fileName": {
                    value: readMediaType("movie.wav"),
                    shouldBe: "audio/wave"
                },
                "complexPath":{
                    value: readMediaType("C://whatever/movie.png"),
                    shouldBe: "image/png"
                }
            });
        }
    },{
        subject: readMediaType,
        execute: function fail_mediaType() {
            assertEquality({
                "unknown": {
                    value: readMediaType("notYetRegistered.wtf"),
                    shouldBe: undefined
                }
            });
        }
    });
})();