(function h_webMediaTypes_test() {
    const { assertEquality, test } = ToolKid.debug.test;
    const { readMediaType } = ToolKid.web;

    test({
        subject: readMediaType,
        execute: function basic() {
            assertEquality({
                "music.mp3":{
                    value: readMediaType("music.mp3"),
                    shouldBe: "audio/mpeg3"
                },
                "myFont.ttf":{
                    value: readMediaType("myFont.ttf"),
                    shouldBe: "font/ttf"
                },
                "favicon.ico":{
                    value: readMediaType("favicon.ico"),
                    shouldBe: "image/x-icon"
                },
                "file.json":{
                    value: readMediaType("file.json"),
                    shouldBe: "application/json"
                },
                "welcome.mp4":{
                    value: readMediaType("welcome.mp4"),
                    shouldBe: "video/mp4"
                },
                "file.zzz":{
                    value: readMediaType("file.zzz"),
                    shouldBe: undefined
                }
            });
        }
    });
})();