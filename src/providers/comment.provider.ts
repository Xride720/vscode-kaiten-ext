import * as vscode from 'vscode';
import { angryMessage, dateToString, formatDate, getNonce } from '../helpers/string';
import { KaitenCommentType } from '../api/kaiten.dto';
import { KaitenTaskStore } from '../store';
import { Input } from '../helpers/html';
import { Commit } from '../@types/git';
import markdown from '@wcj/markdown-to-html';

export class KaitenCommentViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'kaiten.comment';

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
		this.updateCommentsCount();
		const $this = this;
		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'addComment':
					{
						$this.store.commentController.addComment(data.payload);
						break;
					}
				case 'updateComment':
					{
						$this.store.commentController.updateComment(data.payload);
						break;
					}
				case 'removeComment':
					{
						$this.checkAuthorComment(data.payload, () => $this.store.commentController.removeComment(data.payload));
						break;
					}
				case 'editComment':
					{
						$this.checkAuthorComment(data.payload, () => $this.editComment(data.payload));
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

	public updateCommentsData(data: KaitenCommentType[]) {
		if (this._view) {
			const commentListHtml = this._generateCommentListHtml(data);
			this._view.webview.postMessage({ type: 'updateCommentsData', data: commentListHtml });
			this.updateCommentsCount();
		}
	}

	private updateCommentsCount() {
		if (this._view) {
			const count = this.store.comments.length;
			this._view.description = String(count);
		}
	}

	public updateCommitsData(data: Commit[]) {
		if (this._view) {
			const commitListHtml = this._generateCommitListHtml(data);
			this._view.webview.postMessage({ type: 'updateCommitsData', data: commitListHtml });
		}
	}

	private checkAuthorComment(commentId: string, callback: () => void) {
		const comment = this.store.comments.find(item => item.id === Number(commentId));
		if (!comment) return;
		if (comment.author_id === this.store.currentUser?.id) {
			callback();
		} else {
			const { author } = comment;
			
			author && vscode.window.showErrorMessage(`${angryMessage()} © ${author.username}`);
		}
		
	}

	private editComment(commentId: string) {
		const comment = this.store.comments.find(item => item.id === Number(commentId));
		if (!comment) return;
		if (this._view) {
			this._view.webview.postMessage({ type: 'setEditedComment', data: comment });
		}
	}

	public clearForm() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'clearForm' });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'comments', 'main.js'));

		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'shared', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'shared', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'comments', 'main.css'));
		const styleInputUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'shared', 'input.css'));
		const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'codicon.css'));

		const nonce = getNonce();

		const comment = Input(
			'text',
			'Комментарий',
			'<textarea name="text"></textarea>',
			'cont-comment',
			`
			<div class="commit-btn-cont">
				<i class="codicon codicon-git-commit"></i>
				<div class="dropdown">
					<ul class="commit-list" id="commit-list">
						${this._generateCommitListHtml(this.store.commits)}
					</ul>
				</div>
			</div>
			`
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
				<form id="comment-form">
					${comment}
					<div class="form-buttons">
						<button id="create-btn" >Создать</button>
						<button id="cancel-btn" class="kaiten-hidden" >Отменить</button>
						<button id="save-btn" class="kaiten-hidden" >Сохранить</button>
					</div>
				</form>
				<ul id="kaiten-comments-list">${this.store.comments.length ? this._generateCommentListHtml(this.store.comments) : ''}</ul>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	private _generateCommentListHtml(data: KaitenCommentType[]): string {
		return data.map(item => `
			<li class="comment__item" data-id="${item.id}">
				<div class="top-block" title="${item.author.full_name} ${formatDate(item.updated)}">
					${markdown(item.text)}
				</div>
				<div class="bottom-block">
					<span
						class="comment__item-full_name"
						title="${item.author.full_name}"
					>
						${item.author.full_name}
					</span>
					<span class="comment__item-date" title="Дата: ${formatDate(item.updated)}">${formatDate(item.updated)}</span>
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

	private _generateCommitListHtml(data: Commit[]): string {
		return data.map(item => `
			<li class="commit-list__item" data-hash="${item.hash}" title="Вставить в комментарий">
				<span class="commit-message" title="${item.message}">${item.message}</span>
				<span class="commit-date">${dateToString(item.commitDate, true)}</span>
				<span class="commit-author">${item.authorEmail || ''}</span>
			</li>
		`).join("\n");
	}

}
