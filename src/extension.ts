// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "micropython" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('micropython.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from MicroPython!');
	});
	context.subscriptions.push(disposable);

	// Register command to open the MicroPython Files panel
	const panelDisposable = vscode.commands.registerCommand('micropython.openFilesPanel', async () => {
		// Helper to show loading spinner in webview
		function showLoading() {
			panel.webview.postMessage({ command: 'showFiles', html: '<div class="loader"><svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="20" stroke="#888" stroke-width="4" fill="none" opacity="0.2"/><circle cx="24" cy="24" r="20" stroke="#0078d4" stroke-width="4" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="1s" repeatCount="indefinite"/></circle></svg></div>' });
		}
		const panel = vscode.window.createWebviewPanel(
			'micropythonFiles',
			'MicroPython Files',
			vscode.ViewColumn.Two,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		// Load external HTML file
		const htmlPath = vscode.Uri.file(require('path').join(context.extensionPath, 'src', 'panel.html'));
		const htmlUri = panel.webview.asWebviewUri(htmlPath);
		const fs = require('fs');
		let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
		panel.webview.html = htmlContent;

		// Helper to run mpremote ls and send results to webview
		async function mpremoteLs() {
			let fileList: string = '';
			try {
				const exec = require('child_process').exec;
				fileList = await new Promise<string>((resolve, reject) => {
					exec('/Users/peter/.pyenv/shims/mpremote ls :', (error: any, stdout: string, stderr: string) => {
						if (error) {
							reject(stderr);
						} else {
							console.log(stdout);
							resolve(stdout);
						}
					});
				});
			} catch (err) {
				fileList = 'Error running mpremote: ' + err;
			}
			console.log('fileList', fileList);

			function getIcon(filename: string): string {
				const ext = filename.split('.').pop()?.toLowerCase();
				switch (ext) {
					case 'py': return '🐍';
					case 'txt': return '📄';
					case 'jpg':
					case 'jpeg':
					case 'png': return '🖼️';
					case 'mp3': return '🎵';
					case 'json': return '🗂️';
					case 'bin': return '💾';
					default: return '📁';
				}
			}

			let filesHtml = '';
			if (fileList && typeof fileList === 'string') {
				const lines = fileList.split('\n').filter(l => l.trim());
				const rows = lines.map(line => {
					// Example line: "         139 boot.py"
					const match = line.trim().match(/^(\d+)\s+(.*)$/);
					if (match) {
						const size = match[1];
						const fname = match[2];
						return `<tr><td style="text-align:right;padding-right:12px;">${size}</td><td style="padding-left:8px;">${getIcon(fname)} ${fname}</td></tr>`;
					}
					return '';
				}).join('');
				filesHtml = `<table style="width:100%;border-collapse:collapse;"><thead><tr><th style="text-align:right;padding-right:12px;">Size</th><th style="text-align:left;padding-left:8px;">Name</th></tr></thead><tbody>${rows}</tbody></table>`;
			}

			console.log('filesHtml', filesHtml);
			panel.webview.postMessage({ command: 'showFiles', html: filesHtml || '<p>No files found or error occurred.</p>' });
		}

		// Initial load
		await mpremoteLs();

		// Handle messages from webview
		panel.webview.onDidReceiveMessage(async message => {
			if (message.command === 'reload') {
				showLoading();
				await mpremoteLs();
			}
			// Handle upload, rename, delete here
		});
	});
	context.subscriptions.push(panelDisposable);

	// Automatically open the MicroPython Files panel when the extension is activated
	vscode.commands.executeCommand('micropython.openFilesPanel');
}

// This method is called when your extension is deactivated
export function deactivate() {}
