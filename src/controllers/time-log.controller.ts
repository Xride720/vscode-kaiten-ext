import { AddTimeLogDataType, UpdateTimeLogDataType } from "../api/kaiten.dto";
import { KaitenTimeLogViewProvider } from "../providers/time-log.provider";
import { KaitenTaskStore } from "../store";
import * as vscode from 'vscode';

export class TimeLogController {

  private store: KaitenTaskStore;
  
  constructor(
    context: vscode.ExtensionContext,
		store: KaitenTaskStore
  ) {
    const $this = this;
    this.store = store;  
    context.subscriptions.push(
      vscode.commands.registerCommand('kaiten.time-log.refresh', async () => {
        store.providerKaitenTimeLog.clearForm();
        await Promise.allSettled([
          $this.updateTimeLogs(),
          store.updateCommits()
        ]);
      }),
    );
	}
  
  public async updateTimeLogs() {
    const response = await this.store.withProgress(
      KaitenTimeLogViewProvider.viewType,
      this.store.kaitenApi.getTimeLogs(this.store.taskId)
    );
		if (!response.error && response.data) {
			this.store.timeLogs = response.data;
		}
  }
  public async addTimeLog(payload: AddTimeLogDataType) {
    const response = await this.store.withProgress(
      KaitenTimeLogViewProvider.viewType,
      this.store.kaitenApi.addTimeLog(this.store.taskId, payload)
    );

    if (!response.error) {
      await this.updateTimeLogs();
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка создания записи');
    }
  }

  public async updateTimeLog(payload: UpdateTimeLogDataType & { id: string }) {
    const response = await this.store.withProgress(
      KaitenTimeLogViewProvider.viewType,
      this.store.kaitenApi.updateTimeLog(this.store.taskId, payload.id, payload)
    );

    if (!response.error) {
      await this.updateTimeLogs();
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка обновления записи');
    }
  }

  public async removeTimeLog(logId: string) {
    const confirm = await vscode.window.showQuickPick(['Да', 'Нет'], {
      canPickMany: false,
      placeHolder: 'Выберите нужный вариант',
      title: 'Удалить запись?'
    });
    if (confirm !== 'Да') return;
    const response = await this.store.withProgress(
      KaitenTimeLogViewProvider.viewType,
      this.store.kaitenApi.removeTimeLog(this.store.taskId, logId)
    );
    
    if (!response.error) {
      await this.updateTimeLogs();
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка удаления записи');
    }
  }
}