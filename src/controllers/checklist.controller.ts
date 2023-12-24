import { KaitenChecklistItemType, KaitenChecklistType, UpdateChecklistItemType } from "../api/kaiten.dto";
import { CheckList, CheckListItem, KaitenCheckListProvider } from "../providers/checklist.provider";
import { KaitenTaskStore } from "../store";
import * as vscode from 'vscode';

export class CheckListController {

  private store: KaitenTaskStore;
  
  constructor(
    context: vscode.ExtensionContext,
		store: KaitenTaskStore
  ) {
    this.store = store;  
    context.subscriptions.push(      
      vscode.commands.registerCommand('kaiten.checklist.add', async () => {
        await this.addCheckList();
      }),
      vscode.commands.registerCommand('kaiten.checklist.edit', async (list: CheckList) => {
        await this.editCheckList(list);
      }),
      vscode.commands.registerCommand('kaiten.checklist.delete', async (list: CheckList) => {
        await this.deleteCheckList(list);
      }),
      vscode.commands.registerCommand('kaiten.checklist.add-item', async (list: CheckList) => {
        await this.addCheckListItem(list.data);
      }),
      vscode.commands.registerCommand('kaiten.checklist.revealInFile', (path: vscode.Uri, lineNumber: number) => {
        this.openFileByLinkInText(path, lineNumber);
      }),
      vscode.commands.registerCommand('kaiten.checklist.edit-item', async (item: CheckListItem) => {
        await this.editCheckListItem(item);
      }),
      vscode.commands.registerCommand('kaiten.checklist.delete-item', async (item: CheckListItem) => {
        await this.deleteCheckListItem(item);
      }),
    );
	}

  public async addCheckList(name?: string): Promise<KaitenChecklistType | null> {
    let checklistName: string | undefined;
    if (!name) {
      checklistName = await vscode.window.showInputBox({
        title: `Новый чек-лист`,
        placeHolder: 'Введите название нового чек-листа'
      });
      if (!checklistName) return null;
    } else checklistName = name;
    

    const response = await this.store.withProgress(
      KaitenCheckListProvider.viewType,
      this.store.kaitenApi.addCheckList(this.store.taskId, { name: checklistName })
    );

    if (!response.error) {
      if (this.store.taskData) {
        if (response.data) {
          if (!this.store.taskData.checklists) this.store.taskData.checklists = [response.data];
          else this.store.taskData.checklists.push(response.data);
        }
        this.store.providerKaitenCheckList.refresh();
        return response.data || null;
      }
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка создания чек-листа');
    }
    return null;
  }

  public async editCheckList(list: CheckList) {
    const input = await vscode.window.showInputBox({
      title: `Редактирование названия чек-листа`,
      placeHolder: 'Введите название чек-листа',
      value: list.data.name
    });
    if (!input) return;
    const response = await this.store.withProgress(
      KaitenCheckListProvider.viewType,
      this.store.kaitenApi.updateCheckList(this.store.taskId, list.data.id, {
        name: input
      })
    );

    if (!response.error) {
      if (this.store.taskData) {
        this.store.taskData.checklists = this.store.taskData.checklists.map(listItem => listItem.id === list.data.id ? {
          ...listItem,
          name: input
        } : listItem);
        this.store.providerKaitenCheckList.refresh();
      }
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка обновления чек-листа');
    }
  }

  public async deleteCheckList(list: CheckList) {
    const id = list.data.id;

    const confirm = await vscode.window.showQuickPick(['Да', 'Нет'], {
      canPickMany: false,
      placeHolder: 'Выберите нужный вариант',
      title: `Удалить чек-лист "${list.data.name}" ?`
    });
    if (confirm !== 'Да') return;

    const response = await this.store.withProgress(
      KaitenCheckListProvider.viewType,
      this.store.kaitenApi.deleteCheckList(this.store.taskId, id)
    );

    if (!response.error) {
      if (this.store.taskData) {
        this.store.taskData.checklists = this.store.taskData.checklists.filter(list => list.id !== id);
        this.store.providerKaitenCheckList.refresh();
      }
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка обновления чек-листа');
    }
  }



  public async addCheckListItem(checklist: KaitenChecklistType, text?: string) {
    const checklistId = checklist.id;
    let itemText: string | undefined = text;
    if (!itemText) {
      itemText = await vscode.window.showInputBox({
        title: `Новый пункт чек-листа "${checklist.name}"`,
        placeHolder: 'Введите текст нового пункта'
      });
      if (!itemText) return;
    }

    const response = await this.store.withProgress(
      KaitenCheckListProvider.viewType,
      this.store.kaitenApi.addCheckListItem(this.store.taskId, checklistId, { text: itemText })
    );

    if (!response.error) {
      if (this.store.taskData) {
        this.store.taskData.checklists = this.store.taskData.checklists.map(list => list.id === checklistId ? {
          ...list,
          items: response.data ? [...(list.items || []), response.data] : list.items
        } : list);
        this.store.providerKaitenCheckList.refresh();
      }
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка обновления чек-листа');
    }
  }

  public async editCheckListItem(item: CheckListItem) {
    const input = await vscode.window.showInputBox({
      title: `Редактирование пункта чек-листа`,
      placeHolder: 'Введите текст пункта',
      value: item.data.text
    });
    if (!input) return;
    await this.changeCheckListItem(item.data.id, item.data.checklist_id, { text: input });
  }

  public async changeCheckListItem(id: number, checklistId: number, payload: UpdateChecklistItemType) {
    const response = await this.store.withProgress(
      KaitenCheckListProvider.viewType,
      this.store.kaitenApi.updateCheckListItem(this.store.taskId, checklistId, id, payload)
    );

    if (!response.error) {
      if (this.store.taskData) {
        this.store.taskData.checklists = this.store.taskData.checklists.map(list => list.id === checklistId ? {
          ...list,
          items: list.items?.map(item => item.id === id && response.data ? response.data : item)
        } : list);
        this.store.providerKaitenCheckList.refresh();
      }
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка обновления чек-листа');
    }
  }

  public async deleteCheckListItem(item: CheckListItem) {
    const id = item.data.id;
    const checklistId = item.data.checklist_id;

    const confirm = await vscode.window.showQuickPick(['Да', 'Нет'], {
      canPickMany: false,
      placeHolder: 'Выберите нужный вариант',
      title: 'Удалить пункт чек-листа?'
    });
    if (confirm !== 'Да') return;

    const response = await this.store.withProgress(
      KaitenCheckListProvider.viewType,
      this.store.kaitenApi.deleteCheckListItem(this.store.taskId, checklistId, id)
    );

    if (!response.error) {
      if (this.store.taskData) {
        this.store.taskData.checklists = this.store.taskData.checklists.map(list => list.id === checklistId ? {
          ...list,
          items: list.items?.filter(item => item.id !== id)
        } : list);
        this.store.providerKaitenCheckList.refresh();
      }
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка обновления чек-листа');
    }
  }

  public openFileByLinkInText(path: vscode.Uri, lineNumber: number) {
    vscode.commands.executeCommand(
      'vscode.open',
      path,
      {
        selection: new vscode.Selection(
          new vscode.Position(Number(lineNumber), 0),
          new vscode.Position(Number(lineNumber), 0)
        )
      }
    );
  }
}