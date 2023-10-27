import * as vscode from 'vscode';
import { convertKaitenDescription, getNonce } from '../helpers/string';
import { KaitenCardType } from '../api/kaiten.dto';

export class KaitenTaskViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'kaiten.task';

	private _view?: vscode.WebviewView;

	private taskData: KaitenCardType | null = null;

	constructor(
		private readonly _extensionUri: vscode.Uri
	) { }

	public async resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'colorSelected':
					{
						vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
						break;
					}
			}
		});

		webviewView.onDidChangeVisibility(() => {
			webviewView.webview.html = webviewView.visible ? this._getHtmlForWebview(webviewView.webview) : '';
		});
	}

	public updateTaskData(data: KaitenCardType) {
		this.taskData = data;
		if (this._view) {
			const taskInfoHtml = this._generateTaskInfoHtml(data);
			this._view.webview.postMessage({ type: 'updateTaskData', data: taskInfoHtml });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'task', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'shared', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'shared', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'task', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>KAiten task</title>
			</head>
			<body>
				<div id="kaiten-task-info">${this.taskData ? this._generateTaskInfoHtml(this.taskData) : ''}</div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	private _generateTaskInfoHtml(data: KaitenCardType): string {
		const description: string[] = [];
		data.description?.split("\n\n").forEach(item => {
			if (item) description.push(`<p class="desc__list-item">${convertKaitenDescription(item)}</p>`);
		});
		const descHtml = description.length ? `<div class="desc__list">${description.join("\n")}</div>` : '';
		return `
		<h4 class="task-title">${data.title}</h4>
		${descHtml}
		`;
	}
}

