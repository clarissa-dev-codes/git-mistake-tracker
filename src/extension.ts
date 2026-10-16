import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import { stat } from 'fs';

export function activate(context: vscode.ExtensionContext){
	console.log('Git Mistake Tracker is now active.');

	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	context.subscriptions.push(statusBarItem);

	const selectionListener = vscode.window.onDidChangeTextEditorSelection((event) => {
		const editor = event.textEditor;
		if(!editor){
			return;
		}

		const document = editor.document;
		//not looking at files that are unsaved or system output window
		if(document.isUntitled || document.uri.scheme !== 'file')
		{
			return;
		}

		//Git starts at 1 and vs starts at 0 apparently
		const line = editor.selection.active.line + 1;
		const filePath = document.fileName;
		const fileDir = path.dirname(filePath);

		//porcelain outputs standard key and value structs that are easy to parse
		const command = `git blame -L ${line},${line} --porcelain "${filePath}"`;

		exec(command, {cwd: fileDir}, (error, stdout) => {
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
	const hoverProvider = vscode.languages.registerHoverProvider(
		{scheme: 'file'},
		{
			provideHover(document, position, token){
				return new Promise((resolve) => {
					const line = position.line + 1;
					const filePath = document.fileName;
					const fileDir = path.dirname(filePath);

					exec(`git blame -L \${line},line --porcelain "{filePath}"`, {cwd: fileDir}, (error, stdout) => {
						if(error){
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
		}
	);

	context.subscriptions.push(hoverProvider);
}

export function deactivate(){
	console.log('Git Mistake Tracker deactivated.');
}