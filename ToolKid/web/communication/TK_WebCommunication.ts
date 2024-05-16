interface ToolKid_file { web: TK_web_file }
interface TK_web_file {
    communication: TK_WebCommunication_file
}
interface TK_WebCommunication_file {
    request(inputs: {
        URL: string,
        callback?: (
            fileContent: string
        ) => void,
        errorHandler?: (
            ...response: any[]
        ) => void,
        post?: string | Blob | ArrayBuffer | DataView | FormData | URLSearchParams,
        //get?: string | { [key: string]: string },
        responseType?: string
        headers?: Dictionary,
        //maxTime?: number,
    }): Promise<any>
}

(function TK_WebCommunication_init() {
    const publicExports = module.exports = <TK_WebCommunication_file>{};



    publicExports.request = function TK_WebCommunication_request(inputs) {
        const chosenFetch = (inputs.post === undefined)
            ? fetchGET : fetchPOST;
        return chosenFetch(inputs).then(
            requestParse.bind(null, inputs),
            requestFailed.bind(null, {
                inputs,
                type: "connection"
            })
        );
    };

    const fetchGET = function TK_WebCommunication_fetchGET(
        inputs: Dictionary
    ) {
        return fetch(inputs.URL, {
            method: "GET",
            headers: inputs.headers
        });
    };

    const fetchPOST = function TK_WebCommunication_fetchPOST(
        inputs: Dictionary
    ) {
        return fetch(inputs.URL, {
            method: "POST",
            mode: "cors",
            headers: Object.assign({
                "Content-Type": "application/json",
            }, inputs.headers),
            body: inputs.post
        });
    };

    const requestParse = function TK_WebCommunication_requestParse(
        inputs: Dictionary, response: any
    ) {
        if (!response.ok || response.status < 200 || response.status >= 300) {
            return requestFailed({
                inputs,
                type: "status"
            }, response.status);
        }

        const contentType = response.headers.get("content-type");
        const chosenParser = (contentType.indexOf("application/json") !== -1)
            ? "json"
            : "text";

        return response[chosenParser]().then(
            requestRespond.bind(null,inputs),
            requestFailed.bind(null, {
                inputs,
                type: "parsing"
            })
        );
    };

    const requestRespond = function TK_WebCommunication_requestRespond (
        inputs:Dictionary, response:any
    ) {
        if (typeof inputs.callback === "function") {
            try {
            inputs.callback(response);
            } catch (error) {
                return requestFailed({
                    inputs,
                    type:"callback"
                }, error);
            }
        }
        return response;
    };

    const errorInfos = {
        callback: "callback did fail",
        connection: "request could not be sent",
        status: "response status is not ok",
        parsing: "response is malformed"
    };

    const requestFailed = function TK_WebCommunication_requestFailed(
        bound: {
            inputs: Dictionary,
            type: "callback" | "connection" | "status" | "parsing"
        },
        detail: Error
    ) {
        const error = Error(
            "TK_WebCommunication_request - " + errorInfos[bound.type] + "."
        );
        (<Dictionary>error).cause = {
            detail,
            inputs: bound.inputs
        };
        if (typeof bound.inputs.errorHandler === "function") {
            bound.inputs.errorHandler(error);
            return error;
        } else {
            throw error;
        }
    };

    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "web", subSection: "communication", functions: publicExports });
    }
})();