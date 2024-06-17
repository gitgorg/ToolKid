(function TK_ConnectionHTTPtest() {
    const { request } = ToolKid.connection.HTTP;
    const { assertEquality, test } = ToolKid.debug.test;



    const requestAdresses = {
        GETBasic: "https://run.mocky.io/v3/d6f8c5da-6841-408d-8cd1-09eebca87040",
        GETInvalidResponse: "https://run.mocky.io/v3/08cc2f37-e453-4df0-8628-71ee3ea606e5"
    };

    test({
        subject: request,
        execute: async function getBasic() {
            const response = await request({
                URL: requestAdresses.GETBasic
            });
            assertEquality({
                "response": {
                    value: response,
                    shouldBe: { number: 100, boolean: true }
                }
            });
        }
    }, {
        subject: request,
        execute: function getMalformedResponse() {
            request({
                URL: requestAdresses.GETInvalidResponse,
                callback: function (response) {
                    throw ["request should have failed but responded fine with:", response];
                },
                errorHandler: function (error) {
                    assertEquality({
                        "response is error": {
                            value: error instanceof Error,
                            shouldBe: true
                        }
                    });
                }
            });
        }
    });
})();