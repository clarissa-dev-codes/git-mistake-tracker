import * as vscode from 'vscode';
import { exec} from 'child_process';
import * as path from 'path';

function runCommand(command: string, cwd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		exec(command, {cwd}, (error, stdout) => {
			if (error) {
				reject(error);
			}
			else {
				resolve(stdout.trim());
			}
		});
	});
}

function getGitHubWebUri(remoteUrl: string): string | null {
	if (!remoteUrl){
		return null;
	}

	let cleaned = remoteUrl.replace(/\.git\$/, '');

	if (cleaned.startsWith('git@')){
		cleaned = cleaned.replace(':', '/').replace('git@', 'https://');
	}

	if(cleaned.startsWith('https://github.com')){
		return cleaned;
	}

	return null;
}

export function activate(context: vscode.ExtensionContext){
	console.log('Git Mistake Tracker is active in production mode.');

	const issueCommand = vscode.commands.registerCommand(
		'git-mistake-tracker.openIssue',
		async (args: {author: string, summary: string, hash: string, lineContent: string, fileName: string, fileDir: string}) => {
			try{
				const rawRemote = await runCommand('git config --get remote.origin.url', args.fileDir);
				const repoWebUrl = getGitHubWebUri(rawRemote);

				if(!repoWebUrl){
					vscode.window.showErrorMessage('Git Mistake Tracker: This repository does not have a valid remote GitHub origin URL.');
					return;
				}

				const issueTitle = await vscode.window.showInputBox({
					prompt: `Descripe the issue with this line committed by ${args.author}`,
					placeHolder: 'e.g., Fix broken type assertion preventing compilation'
				});

				if(!issueTitle){
					return; //means it was cancelled
				}

				const issueBody = encodeURIComponent(
					`## Code Bug Tracked via Git Mistake Tracker\n\n` +
					`* **File:** \`${args.fileName}\`\n` +
					`* **Commit Hash:** \`\${args.hash}\`\n` +
					`* **Blamed Commit Author:** ${args.author}\n` +
					`* **Commit Summary:** _${args.summary}_\n\n` +
					`### Context Snippet:\n` +
					`\`\`\`\n` +
					`\${args.lineContent.trim()}\n` + 
					`\`\`\`\n\n` +
					`### Reporter Notes:\n` +
					`${issueTitle}`
				);

				const targetUrl = `${repoWebUrl}/issues/new?title=${encodeURIComponent(issueTitle)}&body=${issueBody}`;
				vscode.env.openExternal(vscode.Uri.parse(targetUrl));
			}
			catch(err){
				vscode.window.showErrorMessage('Git Mistake Tracker: Failed to read local git configuration profile details.');
			}
		}
	);
	context.subscriptions.push(issueCommand);

	const hoverProvider = vscode.languages.registerHoverProvider(
		{scheme: 'file'},
		{
			provideHover(document, position){
				return new Promise((resolve) => {
					const line = position.line + 1;
					const filePath = document.fileName;
					const fileName = path.basename(filePath);
					const fileDir = path.dirname(filePath);
					const lineContent = document.lineAt(position.line).text;

					exec(`git blame -L ${line},${line} --porcelain "${filePath}"`, {cwd:fileDir}, (error, stdout) => {
						if(error || !stdout){
							return resolve(null);
						}

						const author = stdout.match(/^author (.+)\$/m)?.[1] || 'Unknown';
						const summary = stdout.match(/^summary (.+)\$/m)?.[1] || '';
						const hash = stdout.split('\n')[0].split(' ')[0].substring(0, 8);

						if(hash.startsWith('00000000')){
							return resolve(null);
						}

						const markdown = new vscode.MarkdownString();
						markdown.isTrusted = true;

						markdown.appendMarkdown(`### Git Mistake Tracker\n\n`);
						markdown.appendMarkdown(`**Author:** ${author} \n\n`);
						markdown.appendMarkdown(`**Commit Summary:** _${summary}_ \n\n`);
						markdown.appendMarkdown(`**Commit Hash:** \`\${hash}\` \n\n`);
						markdown.appendMarkdown(`---\n\n`);

						const commandArgs = encodeURIComponent(JSON.stringify({author, summary, hash, lineContent, fileName, fileDir}));
						const stageIssueCommandUri = `command.git-mistake-tracker.openIssue?${commandArgs}`;

						markdown.appendMarkdown(`[Report This Line as an Issue](${stageIssueCommandUri})`);

						resolve(new vscode.Hover(markdown));
					});
					
				});
			}
		}
	);
	context.subscriptions.push(hoverProvider);
}

export function deactivate() {}