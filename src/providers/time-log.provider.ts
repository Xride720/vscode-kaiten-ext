import * as vscode from 'vscode';
import { API as BuiltInGitApi, GitExtension, Repository } from '../@types/git';
import { convertKaitenDescription, formatDate, formatTime, generateKaitenLink, getNonce } from '../helpers/string';
import { Event } from 'vscode';
import { KaitenApiService } from '../api/kaiten';
import { KaitenCardType, KaitenRoleType, KaitenTimeLogType } from '../api/kaiten.dto';
import { KaitenTaskStore } from '../store';
import { Input } from '../helpers/html';

export class KaitenTimeLogViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'kaiten.time-log';

	private _view?: vscode.WebviewView;

	get view() {
		return this._view;
	}

	private store: KaitenTaskStore;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		store: KaitenTaskStore
	) {
		this.store = store;
  }

	public async resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		context
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
		const $this = this;
		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'addTimeLog':
					{
						$this.store.timeLogController.addTimeLog(data.payload);
						break;
					}
				case 'updateTimeLog':
					{
						$this.store.timeLogController.updateTimeLog(data.payload);
						break;
					}
				case 'removeTimeLog':
					{
						$this.store.timeLogController.removeTimeLog(data.payload);
						break;
					}
				case 'editTimeLog':
					{
						$this.editTimeLog(data.payload);
						break;
					}
				default:
					break;
			}
		});

		webviewView.onDidChangeVisibility(() => {
			webviewView.webview.html = webviewView.visible ? this._getHtmlForWebview(webviewView.webview) : '';
		});
	}

	public updateTimeLogsData(data: KaitenTimeLogType[]) {
		if (this._view) {
			const timeLogListHtml = this._generateTimeLogListHtml(data);
			this._view.webview.postMessage({ type: 'updateTimeLogsData', data: timeLogListHtml });
		}
	}

	public updateRolesData(data: KaitenRoleType[]) {
		if (this._view) {
			const rolesOptionsHtml = this._generateRoleOptionsHtml(data);
			this._view.webview.postMessage({ type: 'updateRolesData', data: rolesOptionsHtml });
		}
	}

	private editTimeLog(logId: string) {
		const timeLog = this.store.timeLogs.find(item => item.id === Number(logId));
		if (!timeLog) return;
		if (this._view) {
			this._view.webview.postMessage({ type: 'setEditedTimeLog', data: timeLog });
		}
	}

	public clearForm() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'clearForm' });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'mediaTimeLogs', 'main.js'));

		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'mediaTimeLogs', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'mediaTimeLogs', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'mediaTimeLogs', 'main.css'));
		const styleInputUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'mediaTimeLogs', 'input.css'));
		// const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));
		const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'codicon.css'));

		const nonce = getNonce();

		const forDate = Input(
			'for_date',
			'Дата',
			'<input type="date" name="for_date" placeholder="Выберите дату" />'
		);

		const timeSpent = Input(
			'time_spent',
			'Затрачено времени',
			'<input type="number" name="time_spent" placeholder="в минутах" />'
		);

		const roleSelect = Input(
			'role_id',
			'Роль',
			`
				<select
					name="role_id"
					id="role_select"
					class="monaco-select-box monaco-select-box-dropdown-padding setting-control-focus-target"
				>	
					${this._generateRoleOptionsHtml(this.store.userRoles)}
				</select>
			`,
			'select-container'
		);
		
		const comment = Input(
			'comment',
			'Комментарий',
			'<textarea name="comment"></textarea>',
			'cont-comment'
		);

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleInputUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				<link href="${codiconsUri}" rel="stylesheet">

				<title>KAiten task</title>
			</head>
			<body>
				<form id="log-form">
					<div class="top-fields">
						${roleSelect}
						${timeSpent}
						${forDate}
					</div>
					${comment}
					<div class="form-buttons">
						<button id="create-btn" >Создать</button>
						<button id="cancel-btn" class="kaiten-hidden" >Отменить</button>
						<button id="save-btn" class="kaiten-hidden" >Сохранить</button>
					</div>
				</form>
				<ul id="kaiten-time-logs-list">${this.store.timeLogs.length ? this._generateTimeLogListHtml(this.store.timeLogs) : ''}</ul>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	private _generateTimeLogListHtml(data: KaitenTimeLogType[]): string {
		return [...data].sort((a, b) => new Date(a.for_date) > new Date(b.for_date) ? -1 : 1).map(item => `
			<li class="time-log__item" data-id="${item.id}">
				<div class="top-block">
					<span class="time-log__item-for_date" title="Дата: ${formatDate(item.for_date)}">${formatDate(item.for_date)}</span>
					<span class="time-log__item-role_name" title="Роль: ${item.role.name}">${item.role.name}</span>
					<span
						class="time-log__item-time_spent"
						title="Затрачено времени: ${formatTime(item.time_spent)}"
					>
						${formatTime(item.time_spent)}
					</span>
				</div>
				<div class="bottom-block">
					<span
						class="time-log__item-full_name"
						title="${item.author.full_name}"
					>
						${item.author.full_name}
					</span>
					<span class="time-log__item-comment" title="${item.comment}">${item.comment}</span>
				</div>
				<div class="delete-btn btn">
					<i class="codicon codicon-close"></i>
				</div>
				<div class="edit-btn btn">
					<i class="codicon codicon-edit"></i>
				</div>
			</li>
		`).join("\n");
	}

	private _generateRoleOptionsHtml(data: KaitenRoleType[]): string {
		return data.map(item => `
			<option label="${item.name}">${item.id}</option>
		`).join("\n");
	}

}
