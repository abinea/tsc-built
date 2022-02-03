"use strict";
/// <reference types="node" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const childProcess = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const root = path.join(__dirname, "..");
const source = path.join(root, "built/local");
const dest = path.join(root, "lib");
const copyright = fs.readFileSync(path.join(__dirname, "../CopyrightNotice.txt"), "utf-8");
function produceLKG() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Building LKG from ${source} to ${dest}`);
        yield copyLibFiles();
        yield copyLocalizedDiagnostics();
        yield copyTypesMap();
        yield copyScriptOutputs();
        yield copyDeclarationOutputs();
        yield buildProtocol();
        yield writeGitAttributes();
    });
}
function copyLibFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        yield copyFilesWithGlob("lib?(.*).d.ts");
    });
}
function copyLocalizedDiagnostics() {
    return __awaiter(this, void 0, void 0, function* () {
        const dir = yield fs.readdir(source);
        const ignoredFolders = ["enu"];
        for (const d of dir) {
            const fileName = path.join(source, d);
            if (fs.statSync(fileName).isDirectory() &&
                ignoredFolders.indexOf(d) < 0) {
                yield fs.copy(fileName, path.join(dest, d));
            }
        }
    });
}
function copyTypesMap() {
    return __awaiter(this, void 0, void 0, function* () {
        yield copyFromBuiltLocal("typesMap.json"); // Cannot accommodate copyright header
    });
}
function buildProtocol() {
    return __awaiter(this, void 0, void 0, function* () {
        const protocolScript = path.join(__dirname, "buildProtocol.js");
        if (!fs.existsSync(protocolScript)) {
            throw new Error(`Expected protocol script ${protocolScript} to exist`);
        }
        const protocolInput = path.join(__dirname, "../src/server/protocol.ts");
        const protocolServices = path.join(source, "typescriptServices.d.ts");
        const protocolOutput = path.join(dest, "protocol.d.ts");
        console.log(`Building ${protocolOutput}...`);
        yield exec(protocolScript, [protocolInput, protocolServices, protocolOutput]);
    });
}
function copyScriptOutputs() {
    return __awaiter(this, void 0, void 0, function* () {
        yield copyWithCopyright("cancellationToken.js");
        yield copyWithCopyright("tsc.release.js", "tsc.js");
        yield copyWithCopyright("tsserver.js");
        yield copyFromBuiltLocal("tsserverlibrary.js"); // copyright added by build
        yield copyFromBuiltLocal("typescript.js"); // copyright added by build
        yield copyFromBuiltLocal("typescriptServices.js"); // copyright added by build
        yield copyWithCopyright("typingsInstaller.js");
        yield copyWithCopyright("watchGuard.js");
    });
}
function copyDeclarationOutputs() {
    return __awaiter(this, void 0, void 0, function* () {
        yield copyFromBuiltLocal("tsserverlibrary.d.ts"); // copyright added by build
        yield copyFromBuiltLocal("typescript.d.ts"); // copyright added by build
        yield copyFromBuiltLocal("typescriptServices.d.ts"); // copyright added by build
    });
}
function writeGitAttributes() {
    return __awaiter(this, void 0, void 0, function* () {
        yield fs.writeFile(path.join(dest, ".gitattributes"), `* text eol=lf`, "utf-8");
    });
}
function copyWithCopyright(fileName, destName = fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = yield fs.readFile(path.join(source, fileName), "utf-8");
        yield fs.writeFile(path.join(dest, destName), copyright + "\n" + content);
    });
}
function copyFromBuiltLocal(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fs.copy(path.join(source, fileName), path.join(dest, fileName));
    });
}
function copyFilesWithGlob(pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = glob.sync(path.join(source, pattern)).map(f => path.basename(f));
        for (const f of files) {
            yield copyFromBuiltLocal(f);
        }
        console.log(`Copied ${files.length} files matching pattern ${pattern}`);
    });
}
function exec(path, args = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const cmdLine = ["node", path, ...args].join(" ");
        console.log(cmdLine);
        childProcess.execSync(cmdLine);
    });
}
process.on("unhandledRejection", err => {
    throw err;
});
produceLKG().then(() => console.log("Done"), err => {
    throw err;
});
//# sourceMappingURL=produceLKG.js.map