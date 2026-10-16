"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
function activate(context) {
    console.log('Git Mistake Tracker is now active.');
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    context.subscriptions.push(statusBarItem);
    const selectionListener = vscode.window.onDidChangeTextEditorSelection((event) => {
        const editor = event.textEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        //not looking at files that are unsaved or system output window
        if (document.isUntitled || document.uri.scheme !== 'file') {
            return;
        }
        //Git starts at 1 and vs starts at 0 apparently
        const line = editor.selection.active.line + 1;
        const filePath = document.fileName;
        const fileDir = path.dirname(filePath);
        //porcelain outputs standard key and value structs that are easy to parse
        const command = `git blame -L ${line},${line} --porcelain "${filePath}"`;
        (0, child_process_1.exec)(command, { cwd: fileDir }, (error, stdout) => {
            if (error) {
                //if there isn't a repo or the line is uncommitted
                statusBarItem.hide();
                return;
            }
            //to hold the culprit
            const author = stdout.match(/^author (.+)\$/m)?.[1] || 'Unknown';
            const email = stdout.match(/^author-mail <(.+)>\$/m)?.[1] || '';
            const summary = stdout.match(/^summary (.+)\$/m)?.[1] || '';
            statusBarItem.text = `$(git-commit) ${author}: "${summary}"`;
            statusBarItem.tooltip = `Email: ${email}\nClick to view full profile details`;
            statusBarItem.show();
        });
    });
    context.subscriptions.push(selectionListener);
    //the hover stuff
    const hoverProvider = vscode.languages.registerHoverProvider({ scheme: 'file' }, {
        provideHover(document, position, token) {
            return new Promise((resolve) => {
                const line = position.line + 1;
                const filePath = document.fileName;
                const fileDir = path.dirname(filePath);
                (0, child_process_1.exec)(`git blame -L \${line},line --porcelain "{filePath}"`, { cwd: fileDir }, (error, stdout) => {
                    if (error) {
                        return resolve(null);
                    }
                    const author = stdout.match(/^author (.+)\$/m)?.[1] || 'Unknown';
                    const summary = stdout.match(/^summary (.+)\$/m)?.[1] || '';
                    const hash = stdout.split(' ')[0].substring(0, 8);
                    //crete rich text markdown
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown(`### Mistake Tracker\n\n`);
                    markdown.appendMarkdown(` **Author:** \${author} \n\n`);
                    markdown.appendMarkdown(` **Commit Summary:** *\${summary}* \n\n`);
                    markdown.appendMarkdown(` **Commit Hash:** \`${hash}\``);
                    resolve(new vscode.Hover(markdown));
                });
            });
        }
    });
    context.subscriptions.push(hoverProvider);
}
function deactivate() {
    console.log('Git Mistake Tracker deactivated.');
}
//# sourceMappingURL=extension.js.map