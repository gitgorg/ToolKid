//MediaType managment (MIME-Types)
interface ToolKid_file { web: TK_web_file }
interface TK_web_file {
    readMediaType(
        path: string
    ): string | undefined
}



(function h_webMediaTypes_init() {

    const publicExports = module.exports = <TK_web_file>{};

    publicExports.readMediaType = function RS_h_HTTP_URLmimeType(path) {
        path = path.slice(path.lastIndexOf(".") + 1).toLocaleLowerCase();
        return mediaTypes[<"js">path];
    };

    const mediaTypes = {
        //audio
        mp3: "audio/mpeg3",
        wav: "audio/wave",
        //font
        eot: "application/vnd.ms-fontobject",
        otf: "font/otf",
        ttf: "font/ttf",
        woff: "font/woff",
        woff2: "font/woff2",
        //image
        gif: "image/gif",
        ico: "image/x-icon",
        jpeg: "image/jpeg",
        jpg: "image/jpeg",
        png: "image/png",
        //text
        cdw: "text/cowdarewelsh",
        css: "text/css",
        htm: "text/html",
        html: "text/html",
        js: "text/javascript",
        json: "application/json",
        mjs: "text/javascript",
        //video
        mp4: "video/mp4",
        ogg: "video/ogg",
        webm: "video/webm"
    };



    Object.freeze(publicExports);
    if (typeof ToolKid !== "undefined") {
        ToolKid.registerFunction({ section: "web", functions: publicExports });
    }
})();