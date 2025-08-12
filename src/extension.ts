// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { showLoading, showFilesPanel, openFile } from './function';

const { mpremoteCat, mpremoteLs, mpremoteRm, mpremoteRun, mpremoteCp, mpremoteReset, mpremoteCp2, mpremoteMkdir } = require('./esp32');
import { currentFolder } from './state';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let panel: vscode.WebviewPanel;


	// Register ESP32: Run command
	const runDisposable = vscode.commands.registerCommand('esp32.run', async (fileUri: vscode.Uri) => {
		console.log('Running file:', fileUri.scheme, fileUri.fsPath);
		if (fileUri.scheme == 'untitled') {
			vscode.window.showErrorMessage('You need to save the file first');
			return;
		}
		if (!fileUri || fileUri.scheme !== 'file' || !fileUri.fsPath.endsWith('.py')) {
			vscode.window.showErrorMessage('ESP32: Run can only be used on .py files.');
			return;
		}
		vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Running ${fileUri.fsPath} on ESP32...` }, async () => {
			try {
				console.log('11 Running file:', fileUri.fsPath);
				const { spawn } = require('child_process');
				panel.webview.postMessage({ command: 'console', text: '' }); // Optionally clear console
				const proc = spawn('mpremote', ['run', fileUri.fsPath]);
				proc.stdout.on('data', (data: Buffer) => {
					console.log('>>data', data.toString());
					panel.webview.postMessage({ command: 'console', text: data.toString() });
				});
				proc.stderr.on('data', (data: Buffer) => {
					panel.webview.postMessage({ command: 'console', text: data.toString() });
				});
				proc.on('close', (code: number) => {
					panel.webview.postMessage({ command: 'console', text: `Process exited with code ${code}` });
				});
			} catch (err) {
				vscode.window.showErrorMessage(`Run failed: ${err}`);
			}
		});
	});
	context.subscriptions.push(runDisposable);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "micropython" is now active!');

	// Register ESP32: Upload command
	const uploadDisposable = vscode.commands.registerCommand('esp32.upload', async (fileUri: vscode.Uri) => {
		if (!fileUri || fileUri.scheme !== 'file' || !fileUri.fsPath.endsWith('.py')) {
			vscode.window.showErrorMessage('ESP32: Upload can only be used on .py files.');
			return;
		}
		vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Uploading ${fileUri.fsPath} to ESP32...` }, async () => {
			try {
				await mpremoteCp(currentFolder, fileUri.fsPath);
				showFilesPanel(panel);
				vscode.window.showInformationMessage(`Uploaded ${fileUri.fsPath} to ESP32.`);
			} catch (err) {
				vscode.window.showErrorMessage(`Upload failed: ${err}`);
			}
		});
	});
	context.subscriptions.push(uploadDisposable);
	const panelDisposable = vscode.commands.registerCommand('micropython.openFilesPanel', async () => {
		// Always open the panel in a new column to the right of the active editor
		let targetColumn = vscode.ViewColumn.Beside;
		if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.viewColumn === vscode.ViewColumn.Three) {
			targetColumn = vscode.ViewColumn.Three;
		}
		panel = vscode.window.createWebviewPanel(
			'micropythonFiles',
			'MicroPython Files',
			targetColumn,
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

		const imgPath = require('path').join(context.extensionPath, 'src', 'image', 'hkps eng big blue.png');
		const imgUri = panel.webview.asWebviewUri(vscode.Uri.file(imgPath));
		panel.webview.postMessage({ command: 'setImageUri', uri: imgUri.toString() });

		const imgPath2 = require('path').join(context.extensionPath, 'src', 'image', 'semiblock.svg');
		const imgUri2 = panel.webview.asWebviewUri(vscode.Uri.file(imgPath2));
		panel.webview.postMessage({ command: 'setImageUri2', uri: imgUri2.toString() });

		// Initial load
		await showFilesPanel(panel);

		panel.webview.onDidReceiveMessage(async message => {
			console.log('Message received from webview:', message);
			if (message.command === 'changeFolder') {
				currentFolder = message.folder;
				panel.webview.postMessage({ command: 'renderBreadcrumb', currentFolder: currentFolder });
			} else if (message.command === 'reload') {
				console.log('reload', currentFolder);
				await showFilesPanel(panel, currentFolder);
			} else if (message.command === 'openFile' && message.filename) {
				console.log('Table row clicked:', message.filename);
				openFile(currentFolder, message.filename);
			} else if (message.command === 'openExampleFile' && message.filename) {
				// Open file from src/example
				const path = require('path');
				const fs = require('fs');
				const examplePath = path.join(context.extensionPath, 'src', 'example', message.filename);
				let fileContent = '';
				try {
					fileContent = fs.readFileSync(examplePath, 'utf8');
				} catch (err) {
					vscode.window.showErrorMessage(`Error reading example file: ${err}`);
					return;
				}
				// Determine language mode from extension
				const ext = message.filename.split('.').pop()?.toLowerCase();
				let language;
				switch (ext) {
					case 'py': language = 'python'; break;
					case 'txt': language = 'plaintext'; break;
					case 'json': language = 'json'; break;
					default: language = undefined;
				}
				const uri = vscode.Uri.parse(`untitled:${message.filename}`);
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
			} else if (message.command === 'deleteFile') {
				const { files } = message;
				if (Array.isArray(files) && files.length > 0) {
					for (const file of files) {
						console.log('Deleting file:', file);
						await mpremoteRm(currentFolder, file);
					}
					await showFilesPanel(panel);
				}
			} else if (message.command === 'reset') {
				try {
					const output = await mpremoteReset(currentFolder);
					vscode.window.showInformationMessage(`Reset output:\n${output}`);
				} catch (err) {
					vscode.window.showErrorMessage(`Error resetting ESP32: ${err}`);
				}
			} else if (message.command === 'renameFile') {
				const { oldName, newName } = message;
				if (oldName && newName) {
					console.log(`Renaming file from ${oldName} to ${newName}`);
					try {
						await mpremoteCp2(currentFolder, oldName, newName);
						await mpremoteRm(currentFolder, oldName);
						await showFilesPanel(panel);
						vscode.window.showInformationMessage(`Renamed ${oldName} to ${newName}`);
					} catch (err) {
						vscode.window.showErrorMessage(`Rename failed: ${err}`);
					}
				}
			} else if (message.command === 'createFolder') {
				const { folderName } = message;
				if (folderName) {
					console.log(`Creating folder: ${folderName}`);
					try {
						await mpremoteMkdir(currentFolder, folderName);
						await showFilesPanel(panel);
						vscode.window.showInformationMessage(`Created folder: ${folderName}`);
					} catch (err) {
						vscode.window.showErrorMessage(`Failed to create folder: ${err}`);
					}
				}
			}
		});
	});
	context.subscriptions.push(panelDisposable);

	// Automatically open the MicroPython Files panel when the extension is activated
	vscode.commands.executeCommand('micropython.openFilesPanel');

}

// This method is called when your extension is deactivated
export function deactivate() { }
