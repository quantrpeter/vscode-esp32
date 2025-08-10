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
	const { mpremoteCat, mpremoteLs, mpremoteRm, mpremoteRun } = require('./esp32');
	const panelDisposable = vscode.commands.registerCommand('micropython.openFilesPanel', async () => {
		function showLoading() {
			panel.webview.postMessage({ command: 'showFiles', html: '<div class="loader"><div>Loading...</div><svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="20" stroke="#888" stroke-width="4" fill="none" opacity="0.2"/><circle cx="24" cy="24" r="20" stroke="#0078d4" stroke-width="4" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="1s" repeatCount="indefinite"/></circle></svg></div>' });
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

		const htmlPath = vscode.Uri.file(require('path').join(context.extensionPath, 'src', 'panel.html'));
		const htmlUri = panel.webview.asWebviewUri(htmlPath);
		const fs = require('fs');
		let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
		panel.webview.html = htmlContent;

		const imgPath = require('path').join(context.extensionPath, 'src', 'hkps eng big blue.png');
		const imgUri = panel.webview.asWebviewUri(vscode.Uri.file(imgPath));
		panel.webview.postMessage({ command: 'setImageUri', uri: imgUri.toString() });

		async function showFilesPanel() {
			showLoading();
			let fileList: string = '';
			try {
				fileList = await mpremoteLs();
			} catch (err) {
				fileList = 'Error running mpremote: ' + err;
			}
			// console.log('fileList', fileList);

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
					const match = line.trim().match(/^(\d+)\s+(.*)$/);
					if (match) {
						const size = match[1];
						const fname = match[2];
						return `<tr data-filename="${fname}" style="cursor:pointer;" onclick="tableClicked('${fname}')">
							<td style="text-align:center;"><input type="checkbox" data-fname="${fname}" /></td>
							<td style="text-align:right;padding-right:12px;">${size}</td>
							<td style="padding-left:8px;">${getIcon(fname)} ${fname}</td>
							<td style="text-align:center;">
								<button class="del-btn" data-fname="${fname}">Rename</button>
								<button class="run-btn" data-fname="${fname}" onclick="runFile('${fname}')">Run</button>
							</td>
						</tr>`;
					}
					return '';
				}).join('');
				filesHtml = `
					<table id="filesTable" style="width:100%;border-collapse:collapse;">
						<thead>
							<tr>
								<th style="text-align:center;width:32px;"></th>
								<th style="text-align:right;padding-right:12px;">Size</th>
								<th style="text-align:left;padding-left:8px;">Name</th>
								<th style="text-align:center;">Actions</th>
							</tr>
						</thead>
						<tbody>${rows}</tbody>
					</table>
				`;
			}

			panel.webview.postMessage({ command: 'showFiles', html: filesHtml || '<p>No files found or error occurred.</p>' });
		}

		// Initial load
		await showFilesPanel();

		panel.webview.onDidReceiveMessage(async message => {
			console.log('Message received from webview:', message);
			if (message.command === 'reload') {
				await showFilesPanel();
			}
			if (message.command === 'openFile' && message.filename) {
				console.log('Table row clicked:', message.filename);
				openFile(message.filename);
			}
			if (message.command == 'deleteFile') {
				const { files } = message;
				if (Array.isArray(files) && files.length > 0) {
					for (const file of files) {
						console.log('Deleting file:', file);
						await mpremoteRm(file);
					}
					await showFilesPanel();
				}
			}
			if (message.command === 'runFile' && message.filename) {
				console.log('Running file:', message.filename);
				try {
					const output = await mpremoteRun(message.filename);
					vscode.window.showInformationMessage(`Run output for ${message.filename}:\n${output}`);
				} catch (err) {
					vscode.window.showErrorMessage(`Error running ${message.filename}: ${err}`);
				}
			}
			// Handle upload, rename, delete here
		});
	});
	context.subscriptions.push(panelDisposable);

	// Automatically open the MicroPython Files panel when the extension is activated
	vscode.commands.executeCommand('micropython.openFilesPanel');

	async function openFile(filename: string) {
		console.log('Row clicked:', filename);
		// call mpremoteCat
		let fileContent = await mpremoteCat(filename);
		console.log('fileContent:', fileContent);
		// Determine language mode from extension
		const ext = filename.split('.').pop()?.toLowerCase();
		let language: string | undefined;
		switch (ext) {
			case 'py': language = 'python'; break;
			case 'txt': language = 'plaintext'; break;
			case 'json': language = 'json'; break;
			default: language = undefined;
		}
		// Use custom untitled URI to show filename in tab
		const uri = vscode.Uri.parse(`untitled:${filename}`);
		vscode.workspace.openTextDocument(uri).then(doc => {
			vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.One }).then(editor => {
				editor.edit(editBuilder => {
					editBuilder.insert(new vscode.Position(0, 0), fileContent);
				});
				if (language) {
					vscode.languages.setTextDocumentLanguage(doc, language);
				}
			});
		});
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }
