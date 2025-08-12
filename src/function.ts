import * as vscode from 'vscode';

const { mpremoteCat, mpremoteLs, mpremoteRm, mpremoteRun, mpremoteCp, mpremoteReset } = require('./esp32');

export function showLoading(panel: vscode.WebviewPanel) {
	panel.webview.postMessage({ command: 'showFiles', html: '<div class="loader"><div>Loading...</div><svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="20" stroke="#888" stroke-width="4" fill="none" opacity="0.2"/><circle cx="24" cy="24" r="20" stroke="#0078d4" stroke-width="4" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="1s" repeatCount="indefinite"/></circle></svg></div>' });
}

export async function showFilesPanel(panel: vscode.WebviewPanel) {
	console.log('showFilesPanel');
	showLoading(panel);
	let fileList: string = '';
	try {
		fileList = await mpremoteLs();
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
			const match = line.trim().match(/^(\d+)\s+(.*)$/);
			if (match) {
				const size = match[1];
				const fname = match[2];
				return `<tr data-filename="${fname}" style="cursor:pointer;">
						<td style="text-align:center;">
							<label>
								<input type="checkbox" class="filled-in" data-fname="${fname}" />
								<span></span>
							</label>
						</td>
						<td style="padding-left:8px;" onclick="tableClicked('${fname}')">${getIcon(fname)} ${fname}</td>
						<td style="text-align:right;padding-right:12px;" onclick="tableClicked('${fname}')">${size}</td>
						<td style="text-align:center;">
							<button class="del-btn waves-effect waves-light btn blue" data-fname="${fname}" onclick="renameFile('${fname}')">Rename</button>
						</td>
					</tr>`;
			}
			return '';
		}).join('');
		filesHtml = `
                <table id="filesTable" class="striped" style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:center;width:32px;"></th>
                            <th style="text-align:left;padding-left:8px;">Name</th>
                            <th style="text-align:right;padding-right:12px;">Size</th>
                            <th style="text-align:center;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
	}
	console.log('filesHtml', filesHtml);
	panel.webview.postMessage({ command: 'showFiles', html: filesHtml || '<p>No files found or error occurred.</p>' });
}

export async function openFile(filename: string) {
	console.log('Row clicked:', filename);
	let fileContent = await mpremoteCat(filename);
	console.log('fileContent:', fileContent);
	const ext = filename.split('.').pop()?.toLowerCase();
	let language: string | undefined;
	switch (ext) {
		case 'py': language = 'python'; break;
		case 'txt': language = 'plaintext'; break;
		case 'json': language = 'json'; break;
		default: language = undefined;
	}
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
