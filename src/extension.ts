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
		const panel = vscode.window.createWebviewPanel(
			'micropythonFiles',
			'MicroPython Files',
			vscode.ViewColumn.Two,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		// Show loading animation initially
		panel.webview.html = `
			<html>
			<head>
				<style>
					body { font-family: sans-serif; padding: 16px; }
					.toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
					.toolbar button { padding: 6px 16px; font-size: 1em; cursor: pointer; border-radius: 4px; border: 1px solid #ccc; background: #f3f3f3; }
					.toolbar button:hover { background: #e0e0e0; }
					.loader { display: flex; justify-content: center; align-items: center; height: 80px; }
				</style>
			</head>
			<body>
				<div class="toolbar">
					<button id="uploadBtn">Upload</button>
					<button id="renameBtn">Rename</button>
					<button id="deleteBtn">Delete</button>
				</div>
				<h2>MicroPython Files</h2>
				<div class="loader">
					<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
						<circle cx="24" cy="24" r="20" stroke="#888" stroke-width="4" fill="none" opacity="0.2"/>
						<circle cx="24" cy="24" r="20" stroke="#0078d4" stroke-width="4" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round">
							<animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="1s" repeatCount="indefinite"/>
						</circle>
					</svg>
				</div>
				<script>
					document.getElementById('uploadBtn').onclick = () => {
						window.parent.postMessage({ command: 'upload' }, '*');
						alert('Upload button clicked!');
					};
					document.getElementById('renameBtn').onclick = () => {
						window.parent.postMessage({ command: 'rename' }, '*');
						alert('Rename button clicked!');
					};
					document.getElementById('deleteBtn').onclick = () => {
						window.parent.postMessage({ command: 'delete' }, '*');
						alert('Delete button clicked!');
					};
				</script>
			</body>
			</html>
		`;

		// Run mpremote ls :
		let fileList: string = '';
		try {
			const exec = require('child_process').exec;
			fileList = await new Promise<string>((resolve, reject) => {
				exec('mpremote ls :', (error: any, stdout: string, stderr: string) => {
					if (error) {
						reject(stderr);
					} else {
						resolve(stdout);
					}
				});
			});
		} catch (err) {
			fileList = 'Error running mpremote: ' + err;
		}

		// Parse file list and generate HTML with icons
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
			filesHtml = lines.map(line => {
				const fname = line.trim();
				return `<div style="display:flex;align-items:center;margin-bottom:4px;"><span style="font-size:1.2em;margin-right:8px;">${getIcon(fname)}</span><span>${fname}</span></div>`;
			}).join('');
		}

		// Update panel with file list
		panel.webview.html = `
			<html>
			<head>
				<style>
					body { font-family: sans-serif; padding: 16px; }
					.toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
					.toolbar button { padding: 6px 16px; font-size: 1em; cursor: pointer; border-radius: 4px; border: 1px solid #ccc; background: #f3f3f3; }
					.toolbar button:hover { background: #e0e0e0; }
				</style>
			</head>
			<body>
				<div class="toolbar">
					<button id="uploadBtn">Upload</button>
					<button id="renameBtn">Rename</button>
					<button id="deleteBtn">Delete</button>
				</div>
				<h2>MicroPython Files</h2>
				${filesHtml || '<p>No files found or error occurred.</p>'}
				<script>
					document.getElementById('uploadBtn').onclick = () => {
						window.parent.postMessage({ command: 'upload' }, '*');
						alert('Upload button clicked!');
					};
					document.getElementById('renameBtn').onclick = () => {
						window.parent.postMessage({ command: 'rename' }, '*');
						alert('Rename button clicked!');
					};
					document.getElementById('deleteBtn').onclick = () => {
						window.parent.postMessage({ command: 'delete' }, '*');
						alert('Delete button clicked!');
					};
				</script>
			</body>
			</html>
		`;
	});
	context.subscriptions.push(panelDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
