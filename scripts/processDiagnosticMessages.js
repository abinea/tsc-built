"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
function main() {
    if (process.argv.length < 3) {
        console.log("Usage:");
        console.log("\tnode processDiagnosticMessages.js <diagnostic-json-input-file>");
        return;
    }
    function writeFile(fileName, contents) {
        fs.writeFile(path.join(path.dirname(inputFilePath), fileName), contents, { encoding: "utf-8" }, err => {
            if (err)
                throw err;
        });
    }
    const inputFilePath = process.argv[2].replace(/\\/g, "/");
    console.log(`Reading diagnostics from ${inputFilePath}`);
    const inputStr = fs.readFileSync(inputFilePath, { encoding: "utf-8" });
    const diagnosticMessagesJson = JSON.parse(inputStr);
    const diagnosticMessages = new Map();
    for (const key in diagnosticMessagesJson) {
        if (Object.hasOwnProperty.call(diagnosticMessagesJson, key)) {
            diagnosticMessages.set(key, diagnosticMessagesJson[key]);
        }
    }
    const outputFilesDir = path.dirname(inputFilePath);
    const thisFilePathRel = path.relative(process.cwd(), outputFilesDir);
    const infoFileOutput = buildInfoFileOutput(diagnosticMessages, `./${path.basename(inputFilePath)}`, thisFilePathRel);
    checkForUniqueCodes(diagnosticMessages);
    writeFile("diagnosticInformationMap.generated.ts", infoFileOutput);
    const messageOutput = buildDiagnosticMessageOutput(diagnosticMessages);
    writeFile("diagnosticMessages.generated.json", messageOutput);
}
function checkForUniqueCodes(diagnosticTable) {
    const allCodes = [];
    diagnosticTable.forEach(({ code }) => {
        if (allCodes[code]) {
            throw new Error(`Diagnostic code ${code} appears more than once.`);
        }
        allCodes[code] = true;
    });
}
function buildInfoFileOutput(messageTable, inputFilePathRel, thisFilePathRel) {
    let result = "// <auto-generated />\r\n" +
        "// generated from '" + inputFilePathRel + "' in '" + thisFilePathRel.replace(/\\/g, "/") + "'\r\n" +
        "/* @internal */\r\n" +
        "namespace ts {\r\n" +
        "    function diag(code: number, category: DiagnosticCategory, key: string, message: string, reportsUnnecessary?: {}, elidedInCompatabilityPyramid?: boolean, reportsDeprecated?: {}): DiagnosticMessage {\r\n" +
        "        return { code, category, key, message, reportsUnnecessary, elidedInCompatabilityPyramid, reportsDeprecated };\r\n" +
        "    }\r\n" +
        "    export const Diagnostics = {\r\n";
    messageTable.forEach(({ code, category, reportsUnnecessary, elidedInCompatabilityPyramid, reportsDeprecated }, name) => {
        const propName = convertPropertyName(name);
        const argReportsUnnecessary = reportsUnnecessary ? `, /*reportsUnnecessary*/ ${reportsUnnecessary}` : "";
        const argElidedInCompatabilityPyramid = elidedInCompatabilityPyramid ? `${!reportsUnnecessary ? ", /*reportsUnnecessary*/ undefined" : ""}, /*elidedInCompatabilityPyramid*/ ${elidedInCompatabilityPyramid}` : "";
        const argReportsDeprecated = reportsDeprecated ? `${!argElidedInCompatabilityPyramid ? ", /*reportsUnnecessary*/ undefined, /*elidedInCompatabilityPyramid*/ undefined" : ""}, /*reportsDeprecated*/ ${reportsDeprecated}` : "";
        result += `        ${propName}: diag(${code}, DiagnosticCategory.${category}, "${createKey(propName, code)}", ${JSON.stringify(name)}${argReportsUnnecessary}${argElidedInCompatabilityPyramid}${argReportsDeprecated}),\r\n`;
    });
    result += "    };\r\n}";
    return result;
}
function buildDiagnosticMessageOutput(messageTable) {
    let result = "{";
    messageTable.forEach(({ code }, name) => {
        const propName = convertPropertyName(name);
        result += `\r\n  "${createKey(propName, code)}" : "${name.replace(/[\"]/g, '\\"')}",`;
    });
    // Shave trailing comma, then add newline and ending brace
    result = result.slice(0, result.length - 1) + "\r\n}";
    // Assert that we generated valid JSON
    JSON.parse(result);
    return result;
}
function createKey(name, code) {
    return name.slice(0, 100) + "_" + code;
}
function convertPropertyName(origName) {
    let result = origName.split("").map(char => {
        if (char === "*")
            return "_Asterisk";
        if (char === "/")
            return "_Slash";
        if (char === ":")
            return "_Colon";
        return /\w/.test(char) ? char : "_";
    }).join("");
    // get rid of all multi-underscores
    result = result.replace(/_+/g, "_");
    // remove any leading underscore, unless it is followed by a number.
    result = result.replace(/^_([^\d])/, "$1");
    // get rid of all trailing underscores.
    result = result.replace(/_$/, "");
    return result;
}
main();
//# sourceMappingURL=processDiagnosticMessages.js.map