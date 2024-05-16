(function main_init () {
    return;
    // require("../ToolKid");

    // console.log("ToolKid:",ToolKid);

    // const {assertEquality, test} = ToolKid.debug.test;
    // const {request} = ToolKid.web.communication;

    // test({
    //     subject: request,
    //     execute: function readModul () {
    //         request({
    //             URL: "http://local.devs:3000/data/readModul",
    //             post: JSON.stringify({
    //                 id: 279575059452,
    //                 moduleID : 99
    //             }),
    //             callback: function(response:any){
    //                 if (response.msgType === "error") {
    //                     throw response;
    //                 }

    //                 console.log(1111,response);
    //                 const structure = JSON.parse(response.structure);
    //                 assertEquality({
    //                     "response.msgType": {
    //                         value: response.msgType,
    //                         shouldBe: "success"
    //                     },
    //                     "response.msgID": {
    //                         value: response.msgID,
    //                         shouldBe: 31
    //                     }
    //                 });
    //                 assertEquality({
    //                     "structure.id": {
    //                         value: structure.id,
    //                         shouldBe: 100
    //                     }
    //                 });
    //             },
    //             errorHandler: function (error) {
    //                 console.log(2222,error,error.cause.detail);
    //             }
    //         });
    //     }
    // });
})();