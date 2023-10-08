import { KaitenApiService } from "../api/kaiten";
import { KaitenTaskViewProvider } from "../providers/task.provider";
import * as vscode from 'vscode';
import { API as BuiltInGitApi, GitExtension, Repository } from '../@types/git';
import { getBuiltInGitApi } from "../helpers/git";
import { generateKaitenLink } from "../helpers/string";
import { AddTimeLogDataType, KaitenCardType, KaitenRoleType, KaitenTimeLogType, UpdateTimeLogDataType } from "../api/kaiten.dto";
import { KaitenTimeLogViewProvider } from "../providers/time-log.provider";

type ViewType = typeof KaitenTaskViewProvider['viewType'] | typeof KaitenTimeLogViewProvider['viewType'];

export class KaitenTaskStore {

  private baseUrl: string;
  
	private kaitenApi: KaitenApiService;

  private _taskUrl: string = '';

  private _taskId: string = '';

	private taskData: KaitenCardType | null = null;

	private _timeLogs: KaitenTimeLogType[] = [];

  private _userRoles: KaitenRoleType[] = [];

	public providerKaitenTask: KaitenTaskViewProvider;

	public providerKaitenTimeLog: KaitenTimeLogViewProvider;

  public gitExt?: BuiltInGitApi;

  constructor(
    context: vscode.ExtensionContext,
    baseUrl: string,
    apiKey: string
  ) {
    this.baseUrl = baseUrl;
    this.kaitenApi = new KaitenApiService(baseUrl, apiKey);
    this.providerKaitenTask = new KaitenTaskViewProvider(context.extensionUri);
    this.providerKaitenTimeLog = new KaitenTimeLogViewProvider(context.extensionUri, this);
  }

  async init() {
    const $this = this;
    [this.gitExt] = await Promise.all([getBuiltInGitApi(), this.initRoles()]);
    
    if (!this.gitExt) return;

    const initBranch = (_repo: Repository) => {
      const callback = () => {
        if (_repo.state.HEAD?.name) {
          this.taskUrl = generateKaitenLink($this.baseUrl, _repo.state.HEAD.name) || '';
          this.taskId = this.taskUrl.split('/').slice(-1)[0];
        }
      };
      callback();
      return callback;
    };

    if (this.gitExt.state === 'initialized' && this.gitExt.repositories[0]) {
      const repo = this.gitExt.repositories[0];
      repo.state.onDidChange(initBranch(repo));
    } else {
      this.gitExt.onDidOpenRepository((repo: Repository) => {
        repo.state.onDidChange(initBranch(repo));
      });
    }
  }

  private async initRoles() {
    const result = await this.withProgress(
      KaitenTimeLogViewProvider.viewType,
      this.kaitenApi.getRoles()
    );
    if (!result.error) {
      this.userRoles = result.data || [];
    } else {
      this.userRoles = [];
    }
  }

  public async updateTaskData() {
    const response = await this.withProgress(
      KaitenTaskViewProvider.viewType,
      this.kaitenApi.getTask(this.taskId)
    );
		if (!response.error && response.data) {
			this.taskData = response.data;
      this.providerKaitenTask.updateTaskData(response.data);
			console.log(this.taskData.title);
		}
	}

  public async updateTimeLogs() {
    const response = await this.withProgress(
      KaitenTimeLogViewProvider.viewType,
      this.kaitenApi.getTimeLogs(this.taskId)
    );
		if (!response.error && response.data) {
			this.timeLogs = response.data;
		}
  }

  set taskId(id: string) {
    if (id !== this.taskId) {
      this._taskId = id;
      this.updateTaskData();
      this.updateTimeLogs();
      this.providerKaitenTimeLog.clearForm();
    }
    this._taskId = id;
  }
  
  get taskId() {
    return this._taskId;
  }

  set taskUrl(url: string) {
    this._taskUrl = url;
  }

  get taskUrl() {
    return this._taskUrl;
  }

  set timeLogs(logs: KaitenTimeLogType[]) {
    this._timeLogs = logs;
    
    this.providerKaitenTimeLog.updateTimeLogsData(logs);
  }

  get timeLogs() {
    return this._timeLogs;
  }

  set userRoles(roles: KaitenRoleType[]) {
    this._userRoles = roles;
    
    this.providerKaitenTimeLog.updateRolesData(roles);
  }

  get userRoles() {
    return this._userRoles;
  }

  private async withProgress<T>(viewId: ViewType, promise: Promise<T>) {
    return await vscode.window.withProgress(
      {
        location: { viewId }
      }, 
      async () => {
        const result1 = await promise;
        return result1;
      }
    );
  }

  public async addTimeLog(payload: AddTimeLogDataType) {
    const response = await this.withProgress(
      KaitenTimeLogViewProvider.viewType,
      this.kaitenApi.addTimeLog(this.taskId, payload)
    );

    if (!response.error) {
      await this.updateTimeLogs();
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка создания записи');
    }
  }

  public async updateTimeLog(payload: UpdateTimeLogDataType & { id: string }) {
    const response = await this.withProgress(
      KaitenTimeLogViewProvider.viewType,
      this.kaitenApi.updateTimeLog(this.taskId, payload.id, payload)
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
      matchOnDescription: false,
      matchOnDetail: false,
      ignoreFocusOut: true,
      placeHolder: 'Выберите нужный вариант',
      title: 'Удалить запись?'
    });
    if (confirm !== 'Да') return;
    const response = await this.withProgress(
      KaitenTimeLogViewProvider.viewType,
      this.kaitenApi.removeTimeLog(this.taskId, logId)
    );
    
    if (!response.error) {
      await this.updateTimeLogs();
    } else {
      vscode.window.showErrorMessage(response.errorMessage || 'Ошибка удаления записи');
    }
  }
}