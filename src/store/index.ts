import { KaitenApiService } from "../api/kaiten";
import { KaitenTaskViewProvider } from "../providers/task.provider";
import * as vscode from 'vscode';
import { API as BuiltInGitApi, Commit, Repository } from '../@types/git';
import { getBuiltInGitApi } from "../helpers/git";
import { generateKaitenLink } from "../helpers/string";
import { KaitenCardType, KaitenCommentType, KaitenRoleType, KaitenTimeLogType, KaitenUserType } from "../api/kaiten.dto";
import { KaitenTimeLogViewProvider } from "../providers/time-log.provider";
import { CheckList, CheckListItem, KaitenCheckListProvider } from "../providers/checklist.provider";
import { TimeLogController } from "../controllers/time-log.controller";
import { CheckListController } from "../controllers/checklist.controller";
import { KaitenCommentViewProvider } from "../providers/comment.provider";
import { KaitenCommentController } from "../controllers/comment.controller";

type ViewType = typeof KaitenTaskViewProvider['viewType']
  | typeof KaitenTimeLogViewProvider['viewType']
  | typeof KaitenCheckListProvider['viewType']
  | typeof KaitenCommentViewProvider['viewType'];

export class KaitenTaskStore {

  private baseUrl: string;
  
	public kaitenApi: KaitenApiService;

  private _taskUrl: string = '';

  private _taskId: string = '';

	public taskData: KaitenCardType | null = null;

	public currentUser: KaitenUserType | null = null;

	private _timeLogs: KaitenTimeLogType[] = [];

	private _comments: KaitenCommentType[] = [];

  private _userRoles: KaitenRoleType[] = [];

  private _commits: Commit[] = [];

  private _repo: Repository | null = null;

	public providerKaitenTask: KaitenTaskViewProvider;

	public providerKaitenTimeLog: KaitenTimeLogViewProvider;

  public timeLogController: TimeLogController;

	public providerKaitenComment: KaitenCommentViewProvider;

  public commentController: KaitenCommentController;

	public providerKaitenCheckList: KaitenCheckListProvider;
  
	public viewCheckList: vscode.TreeView<CheckList | CheckListItem>;

	public checkListController: CheckListController;

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
    this.providerKaitenComment = new KaitenCommentViewProvider(context.extensionUri, this);
    this.providerKaitenCheckList = new KaitenCheckListProvider(this);
    this.viewCheckList = vscode.window.createTreeView<CheckList | CheckListItem>(KaitenCheckListProvider.viewType, { treeDataProvider: this.providerKaitenCheckList }); 
    this.providerKaitenCheckList.view = this.viewCheckList;
    this.timeLogController = new TimeLogController(context, this);
    this.commentController = new KaitenCommentController(context, this);
    this.checkListController = new CheckListController(context, this);
  }

  async init() {
    const $this = this;
    [this.gitExt] = await Promise.all([getBuiltInGitApi(), this.initRoles(), this.initCurrentUser()]);
    
    if (!this.gitExt) return;

    const initBranch = (_repo: Repository) => {
      const callback = () => {
        this._repo = _repo;
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

  private async initCurrentUser() {
    const result = await this.withProgress(
      KaitenTaskViewProvider.viewType,
      this.kaitenApi.getCurrentUser()
    );
    if (!result.error) {
      this.currentUser = result.data || null;
    } else {
      this.currentUser = null;
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
      this.providerKaitenCheckList.refresh();
			console.log(this.taskData.title);
		}
	}

  public async updateCommits() {
    if (!this._repo) return;
    this.commits = await this._repo.log({
      sortByAuthorDate: true,
      maxEntries: 10
    });
  }

  set taskId(id: string) {
    if (id !== this.taskId) {
      this._taskId = id;
      this.updateTaskData();
      this.timeLogController.updateTimeLogs();
      this.commentController.updateComments();
      this.updateCommits();
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

  set comments(comments: KaitenCommentType[]) {
    comments.sort((a, b) => new Date(a.updated) > new Date(b.updated) ? -1 : 1);
    this._comments = comments;
    
    this.providerKaitenComment.updateCommentsData(comments);
  }

  get comments() {
    return this._comments;
  }

  set userRoles(roles: KaitenRoleType[]) {
    this._userRoles = roles;
    
    this.providerKaitenTimeLog.updateRolesData(roles);
  }

  get userRoles() {
    return this._userRoles;
  }

  set commits(arr: Commit[]) {
    this._commits = arr.slice();
    this.providerKaitenTimeLog.updateCommitsData(this.commits);
    this.providerKaitenComment.updateCommitsData(this.commits);
  }

  get commits() {
    return this._commits;
  }

  public async withProgress<T>(viewId: ViewType, promise: Promise<T>) {
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

}