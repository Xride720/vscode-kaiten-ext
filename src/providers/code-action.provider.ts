import * as vscode from 'vscode';
import { KaitenTaskStore } from '../store';

export class ActionCodeProvider implements vscode.CodeActionProvider {
  public static readonly selector: vscode.DocumentSelector = [
    { scheme: 'file' }
  ];

  private store: KaitenTaskStore;

	constructor(
		store: KaitenTaskStore
  ) {
    this.store = store;  
	}
  
  provideCodeActions(document: vscode.TextDocument, position: vscode.Range | vscode.Selection): vscode.ProviderResult<vscode.Command[]> {
    const relativePath = vscode.workspace.workspaceFolders?.reduce((acc, curr) => {
      if (acc) return acc;
      if (document.fileName.startsWith(curr.uri.fsPath)) {
        return document.fileName.split(curr.uri.fsPath)[1];
      }
      return acc;
    }, '');
    const lineNumber = position.start.line;
    const lineText = document.lineAt(lineNumber).text;
    const regex = /\/\/\s+(TODO|FIXME|HACK|BUG)\s+([\W\w]+)/g;
    const regexResult = regex.exec(lineText);

    if (regexResult === null) {
      return;
    }
    const [_, typeText, resultText] = regexResult;

    const anyChecklistExistInTask = !!this.store.taskData?.checklists?.length;

    return [
      {
        title: '[KAITEN]: Добавить в чеклист "Заметки VSCode"',
        command: 'kaiten.checklist.code-action.add-default',
        arguments: [typeText, resultText, `${relativePath} : ${lineNumber}`]
      },
      ...(anyChecklistExistInTask ? [
        {
          title: '[KAITEN]: Выбрать чеклист',
          command: 'kaiten.checklist.code-action.add',
          arguments: [typeText, resultText, `${relativePath} : ${lineNumber}`]
        }
      ] : [])
    ];
  }

  resolveCodeAction(codeAction: vscode.CodeAction) {
    console.log(codeAction);
    return null;
  }
}