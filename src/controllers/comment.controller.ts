import { AddCommentDataType, UpdateCommentDataType } from "../api/kaiten.dto";
import { KaitenCommentViewProvider } from "../providers/comment.provider";

import { KaitenTaskStore } from "../store";
import * as vscode from 'vscode';

export class KaitenCommentController {

  private store: KaitenTaskStore;
  
  constructor(
    context: vscode.ExtensionContext,
		store: KaitenTaskStore
  ) {
    const $this = this;
    this.store = store;  
    context.subscriptions.push(
      vscode.commands.registerCommand('kaiten.comment.refresh', async () => {
        store.providerKaitenComment.clearForm();
        await Promise.allSettled([
          $this.updateComments(),
          store.updateCommits()
        ]);
      }),
    );
	}
  
  public async updateComments() {
    const response = await this.store.withProgress(
      KaitenCommentViewProvider.viewType,
      this.store.kaitenApi.getComments(this.store.taskId)
    );
		if (!response.error && response.data) {
			this.store.comments = response.data;
		}
  }
  public async addComment(payload: AddCommentDataType) {
    const response = await this.store.withProgress(
      KaitenCommentViewProvider.viewType,
      this.store.kaitenApi.addComment(this.store.taskId, payload)
    );

    if (!response.error) {
      await this.updateComments();
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка создания комментария');
    }
  }

  public async updateComment(payload: UpdateCommentDataType & { id: string }) {
    const response = await this.store.withProgress(
      KaitenCommentViewProvider.viewType,
      this.store.kaitenApi.updateComment(this.store.taskId, payload.id, payload)
    );

    if (!response.error) {
      await this.updateComments();
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка обновления комментария');
    }
  }

  public async removeComment(logId: string) {
    const confirm = await vscode.window.showQuickPick(['Да', 'Нет'], {
      canPickMany: false,
      placeHolder: 'Выберите нужный вариант',
      title: 'Удалить комментарий?'
    });
    if (confirm !== 'Да') return;
    const response = await this.store.withProgress(
      KaitenCommentViewProvider.viewType,
      this.store.kaitenApi.removeComment(this.store.taskId, logId)
    );
    
    if (!response.error) {
      await this.updateComments();
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка удаления комментария');
    }
  }
}