(function TK_ConnectionHTTPtest() {
    const { request } = ToolKid.connection.HTTP;
    const { assert, test, shouldPass } = ToolKid.debug.test;



    const requestAdresses = {
        GETBasic: "https://test.teach-audio.com/json1.json",
        GETInvalidResponse: "https://test.teach-audio.com/json2.json"
    };

    test(/*{
        subject: request,
        execute: function GETBasic_regularCallback() {
            return request({
                URL: requestAdresses.GETBasic,
                callback: function handleResponse (response) {
                    assertEquality({
                        "response": {
                            value: response,
                            shouldBe: { number: 100, boolean: true }
                        }
                    });
                }
            });
        }
    },*/ /*{
        subject: request,
        execute: async function GETBasic_asyncAwait() {
            assertEquality({
                "response": {
                    value: await request({
                        URL: requestAdresses.GETBasic
                    }),
                    shouldBe: { number: 100, boolean: true }
                }
            });
        }
    },*/ {
            subject: request,
            execute: function fail_GETInvalidJSON_regularCallback() {
                request({
                    URL: requestAdresses.GETInvalidResponse,
                    callback: function (response) {
                        throw ["request should have failed but responded fine with:", response];
                    },
                    errorHandler: function (error) {
                        assert({
                            "response": {
                                value: error,
                                shouldBe: shouldPass("isError")
                            }
                        });
                    }
                });
            }
        }, {
        subject: request,
        assert: function () {
            return {
                "failing with missing error handler rejects": [
                    request({ URL: requestAdresses.GETInvalidResponse }),
                    Error
                ]
            };
        }
    });
})();