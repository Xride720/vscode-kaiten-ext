import * as vscode from 'vscode';
import { KaitenTaskStore } from '../store';
import { KaitenChecklistItemType, KaitenChecklistType } from '../api/kaiten.dto';

export class KaitenCheckListProvider implements vscode.TreeDataProvider<CheckList | CheckListItem> {

	public static readonly viewType = 'kaiten.checklist';

	private _onDidChangeTreeData: vscode.EventEmitter<CheckList | CheckListItem | undefined | void> = new vscode.EventEmitter<CheckList | CheckListItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<CheckList | CheckListItem | undefined | void> = this._onDidChangeTreeData.event;

  private store: KaitenTaskStore;

  private _view?: vscode.TreeView<CheckList | CheckListItem>;

	constructor(
		store: KaitenTaskStore
  ) {
    this.store = store;  
	}

  set view(_view: vscode.TreeView<CheckList | CheckListItem> | undefined) {
    this._view = _view;
		if (this._view) {
			this._view.onDidChangeCheckboxState(async (e) => {
				if (!e.items || !e.items.length || ! e.items[0][0]) return;
				const item = e.items[0][0];
				if (item instanceof CheckList) return;
				await this.store.checkListController.changeCheckListItem(
					item.data.id,
					item.data.checklist_id,
					{ checked: item.checkboxState === vscode.TreeItemCheckboxState.Checked }
				);
			});
		}
    
  }
  get view() {
    return this._view;
  }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: CheckList | CheckListItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: CheckList | CheckListItem): Thenable<(CheckList | CheckListItem)[]> {
    if (element && element instanceof CheckListItem) return Promise.resolve([]);
		if (element && element instanceof CheckList) {
			return Promise.resolve(this.getNodeList(element.data.id));
		} else {
			if (this.store.taskData?.checklists.length) {
				return Promise.resolve(this.getNodeList());
			} else {
				this.store.taskData?.checklists.length === 0 && vscode.window.showInformationMessage('В задаче нет чек-листов!');
				return Promise.resolve([]);
			}
		}
	}

	private getNodeList(checkListId?: number): (CheckList | CheckListItem)[] {
    const checklists = (this.store.taskData?.checklists || []).slice();
		if (!checkListId) {
      checklists.sort((a, b) => a.sort_order > b.sort_order ? 1: -1);
      return checklists.map(item => new CheckList(
        item,
        vscode.TreeItemCollapsibleState.Collapsed,
      ))
    } else {
      const checklist = checklists.find(item => item.id === checkListId);
      if (!checklist) return [];
      return checklist.items?.slice().sort((a, b) => a.sort_order > b.sort_order ? 1: -1).map(item => new CheckListItem(
        item
      )) || [];
    }
	}

}

export class CheckList extends vscode.TreeItem {

	constructor(
		public readonly data: KaitenChecklistType,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(data.name, collapsibleState);
    const checkedCount = data.items?.filter(item => item.checked).length;
		this.tooltip = data.name;
		this.description = data.items?.length ? `${checkedCount}/${data.items.length}` : undefined;
	}

	contextValue = 'kaiten.checklist.checklist';
}

export class CheckListItem extends vscode.TreeItem {

	constructor(
		public readonly data: KaitenChecklistItemType,
		public readonly command?: vscode.Command
	) {
		super(data.text, vscode.TreeItemCollapsibleState.None);

		this.tooltip = data.text;
		this.description = data.checked ? data.checked_by?.full_name : undefined;

    this.checkboxState = {
      state: data.checked ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked
    };
	}

	contextValue = 'kaiten.checklist.checklistItem';
}