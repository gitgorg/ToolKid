//MediaType managment (MIME-Types)
interface ToolKid_file { connection: TK_Connection_file }
interface TK_Connection_file { HTTP: TK_ConnectionHTTP_file }
interface TK_ConnectionHTTP_file {
    readMediaType(
        path: string
    ): string | undefined
}



(function TK_ConnectionHTTPFormats_init() {

    const publicExports = module.exports = <TK_ConnectionHTTP_file>{};

    publicExports.readMediaType = function TK_ConnectionHTTPFormats_readMediaType(path) {
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
        ToolKid.registerFunctions({ section: "connection", subSection: "HTTP", functions: publicExports });
    }
})();