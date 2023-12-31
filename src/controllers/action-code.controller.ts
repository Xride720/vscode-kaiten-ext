import { KaitenChecklistType, UpdateChecklistItemType } from "../api/kaiten.dto";
import { CheckList, CheckListItem, KaitenCheckListProvider } from "../providers/checklist.provider";
import { KaitenTaskStore } from "../store";
import * as vscode from 'vscode';

type TodoType = 'TODO' | 'FIXME' | 'HACK' | 'BUG';

const DefaultCheckListName = 'Заметки VSCode';

export class ActionCodeController {

  private store: KaitenTaskStore;
  
  constructor(
    context: vscode.ExtensionContext,
		store: KaitenTaskStore
  ) {
    this.store = store;  
    context.subscriptions.push(
      vscode.commands.registerCommand('kaiten.checklist.code-action.add-default', async (type: TodoType, text: string, relativeAddress: string) => {
        this.addItemToDefaultCheckList(this.generateItemText(type, text, relativeAddress));
      }),
      vscode.commands.registerCommand('kaiten.checklist.code-action.add', async (type: TodoType, text: string, relativeAddress: string) => {
        this.addItemToCheckList(this.generateItemText(type, text, relativeAddress));
      }),
    );
	}

  private generateItemText(type: TodoType, text: string, relativeAddress: string) {
    return `${type}. ${text} \n(## ${relativeAddress} ##)`;
  }

  public async addItemToDefaultCheckList(text: string) {
    let defaultChecklist: KaitenChecklistType | null = this.store.taskData?.checklists?.find(checklist => checklist.name === DefaultCheckListName) || null;
    if (!defaultChecklist) {
      defaultChecklist = await this.store.checkListController.addCheckList(DefaultCheckListName);
      if (!defaultChecklist) return;
    }

    this.store.checkListController.addCheckListItem(defaultChecklist, text);
  }

  public async addItemToCheckList(text: string) {
    const checkListNameArr = this.store.taskData?.checklists?.map((list) => `(id:${list.id}) ${list.name}`) || [];
    const select = await vscode.window.showQuickPick(['Новый чеклист', ...checkListNameArr], {
      canPickMany: false,
      title: `Выберите нужный вариант`
    });
    let checklist: KaitenChecklistType | undefined | null;
    if (select === 'Новый чеклист') {
      checklist = await this.store.checkListController.addCheckList();
    } else {
      checklist = this.store.taskData?.checklists?.find(list => `(id:${list.id}) ${list.name}` === select);
    }
    if (!checklist) return;

    this.store.checkListController.addCheckListItem(checklist, text);
  }
}