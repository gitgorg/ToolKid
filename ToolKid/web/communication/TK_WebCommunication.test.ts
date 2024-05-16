(function TK_WebCommunication_test() {
    const {request } = ToolKid.web.communication;
    const { assertEquality, test } = ToolKid.debug.test;



    const requestAdresses = {
        GETBasic: "https://run.mocky.io/v3/45e5bff8-5dd8-4bfd-8f6c-3c8633282284",
        GETInvalidResponse: "https://run.mocky.io/v3/08cc2f37-e453-4df0-8628-71ee3ea606e5"
    };

    test({
        subject: request,
        execute: function GETBasic_regular () {
            request({
                URL: requestAdresses.GETBasic,
                callback: function(response) {
                    assertEquality({
                        name: "response",
                        value: response,
                        shouldBe: {number:100, boolean:true}
                    });
                }
            });
        }
    },/*{
        subject: request,
        execute: function GETfailedCallback_regular () {
            assertFailure({
                name:"callback failed",
                execute: request,
                withInputs: {
                    URL: requestAdresses.GETBasic,
                    callback: function() {
                        throw true;
                    }
                },
                shouldThrow: true
            });
        }
    },*/{
        subject: request,
        execute: async function GETBasic_asyncAwait() {
            const response = await request({
                URL: requestAdresses.GETBasic
            });
            assertEquality({
                name: "response",
                value: response,
                shouldBe: {number:100, boolean:true}
            });
        }
    },{
        subject: request,
        execute: function GETInvalidJSON_regular() {
            request({
                URL: requestAdresses.GETInvalidResponse,
                callback: function(response) {
                    throw ["request should have failed but responded fine with:", response];
                },
                errorHandler: function (error) {
                    assertEquality({
                        name: "response is error",
                        value: error instanceof Error,
                        shouldBe: true
                    });
                }
            });
        }
    });
})();