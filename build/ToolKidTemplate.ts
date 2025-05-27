"use strict";
(function ToolKid_init() {
const registeredFiles = <Dictionary>{};
//#import:LibraryCore.js
registeredFiles["LibraryCore.js"] = module.exports;
(<Dictionary>global).ToolKid = module.exports.createInstance();

//#import:LibraryFiles.js
registeredFiles["LibraryCore.js"].registerCoreModule({
    name: "files", module: module.exports
});

//#import:LibraryParsing.js
registeredFiles["LibraryCore.js"].registerCoreModule({
    name: "parsing", module: module.exports
});

//#start imported extensions

//#end imported extensions

// (<Dictionary>global).log = ToolKid.debug.terminal.logImportant;
// module.exports = ToolKid;
})();