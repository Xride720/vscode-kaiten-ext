// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { KaitenTaskViewProvider } from './providers/task.provider';
import { formatUrl } from './helpers/string';
import { KaitenTaskStore } from './store';
import { KaitenTimeLogViewProvider } from './providers/time-log.provider';
import { KaitenCommentViewProvider } from './providers/comment.provider';
import { ActionCodeProvider } from './providers/code-action.provider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration('kaiten');
	const kaitenUrl: string = formatUrl(config.get('url')) || '';
	const kaitenApiKey: string = config.get('apiKey') || '';

	if (!kaitenUrl || !kaitenApiKey) {
		vscode.window.showErrorMessage(`Необходимо заполнить настройки расширения Kaiten (Api Key + Url)`);
		return;
	}

	const store = new KaitenTaskStore(
		context,
		kaitenUrl,
		kaitenApiKey
	);
	await store.init();

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(KaitenTaskViewProvider.viewType, store.providerKaitenTask),
		vscode.window.registerWebviewViewProvider(KaitenTimeLogViewProvider.viewType, store.providerKaitenTimeLog),
		vscode.window.registerWebviewViewProvider(KaitenCommentViewProvider.viewType, store.providerKaitenComment),
		store.viewCheckList,
		vscode.languages.registerCodeActionsProvider(ActionCodeProvider.selector, store.providerActionCode)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('kaiten.task.open', () => {
			vscode.env.openExternal(vscode.Uri.parse(store.taskUrl));
		}),
		vscode.commands.registerCommand('kaiten.task.refresh', async () => {
			await store.updateTaskData();
		})
	);

}

// This method is called when your extension is deactivated
export function deactivate() {}

