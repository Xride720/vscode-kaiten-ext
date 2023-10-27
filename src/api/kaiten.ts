import fetch from "node-fetch";
import { AddCommentDataType, AddCommentResponseType, AddKaitenChecklistType, AddTimeLogDataType, AddTimeLogResponseDataType, KaitenCardType, KaitenChecklistItemType, KaitenChecklistType, KaitenCommentType, KaitenRoleType, KaitenTimeLogType, KaitenUserType, UpdateChecklistItemType, UpdateCommentDataType, UpdateCommentResponseType, UpdateKaitenChecklistType, UpdateTimeLogDataType, UpdateTimeLogResponseDataType } from "./kaiten.dto";

const SUCCESS_STATUSES = [200, 201];

export class KaitenApiService {
  private baseUrl: string;
  private apiKey: string;
  constructor(
    baseUrl: string,
    apiKey: string
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async getTask(id: string) {
    try {
      const result = await this.request<KaitenCardType>(
        this.baseUrl + '/api/latest/cards/' + id,
        this.kaitenOptions({
          method: 'GET'
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }

  async getRoles() {
    try {
      const result = await this.request<KaitenRoleType[]>(
        this.baseUrl + '/api/latest/user-roles',
        this.kaitenOptions({
          method: 'GET'
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }

  async getCurrentUser() {
    try {
      const result = await this.request<KaitenUserType>(
        this.baseUrl + '/api/latest/users/current',
        this.kaitenOptions({
          method: 'GET'
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }

  async getTimeLogs(taskId: string) {
    try {
      const result = await this.request<KaitenTimeLogType[]>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/time-logs',
        this.kaitenOptions({
          method: 'GET'
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }
  async addTimeLog(taskId: string, payload: AddTimeLogDataType) {
    try {
      const result = await this.request<AddTimeLogResponseDataType>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/time-logs',
        this.kaitenOptions({
          method: 'POST',
          body: JSON.stringify(payload)
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }
  async updateTimeLog(taskId: string, logId: string, payload: UpdateTimeLogDataType) {
    try {
      const result = await this.request<UpdateTimeLogResponseDataType>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/time-logs/' + logId,
        this.kaitenOptions({
          method: 'PATCH',
          body: JSON.stringify(payload)
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }
  async removeTimeLog(taskId: string, logId: string) {
    try {
      const result = await this.request<{ id: number }>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/time-logs/' + logId,
        this.kaitenOptions({
          method: 'DELETE'
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }

  async getComments(taskId: string) {
    try {
      const result = await this.request<KaitenCommentType[]>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/comments',
        this.kaitenOptions({
          method: 'GET'
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }
  async addComment(taskId: string, payload: AddCommentDataType) {
    try {
      const result = await this.request<AddCommentResponseType>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/comments',
        this.kaitenOptions({
          method: 'POST',
          body: JSON.stringify(payload)
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }
  async updateComment(taskId: string, commentId: string, payload: UpdateCommentDataType) {
    try {
      const result = await this.request<UpdateCommentResponseType>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/comments/' + commentId,
        this.kaitenOptions({
          method: 'PATCH',
          body: JSON.stringify(payload)
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }
  async removeComment(taskId: string, commentId: string) {
    try {
      const result = await this.request<{ id: number }>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/comments/' + commentId,
        this.kaitenOptions({
          method: 'DELETE'
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }

  async addCheckList(taskId: string, payload: AddKaitenChecklistType) {
    try {
      const result = await this.request<KaitenChecklistType>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/checklists',
        this.kaitenOptions({
          method: 'POST',
          body: JSON.stringify(payload)
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }
  async updateCheckList(taskId: string, checklistId: number, payload: UpdateKaitenChecklistType) {
    try {
      const result = await this.request<KaitenChecklistType>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/checklists/' + checklistId,
        this.kaitenOptions({
          method: 'PATCH',
          body: JSON.stringify(payload)
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }
  async deleteCheckList(taskId: string, checklistId: number) {
    try {
      const result = await this.request<{ id: number }>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/checklists/' + checklistId,
        this.kaitenOptions({
          method: 'DELETE'
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }

  async addCheckListItem(taskId: string, checklistId: number, payload: { text: string }) {
    try {
      const result = await this.request<KaitenChecklistItemType>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/checklists/' + checklistId + '/items',
        this.kaitenOptions({
          method: 'POST',
          body: JSON.stringify(payload)
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }
  async updateCheckListItem(taskId: string, checklistId: number, itemId: number, payload: UpdateChecklistItemType) {
    try {
      const result = await this.request<KaitenChecklistItemType>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/checklists/' + checklistId + '/items/' + itemId,
        this.kaitenOptions({
          method: 'PATCH',
          body: JSON.stringify(payload)
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }
  async deleteCheckListItem(taskId: string, checklistId: number, itemId: number) {
    try {
      const result = await this.request<{ id: number }>(
        this.baseUrl + '/api/latest/cards/' + taskId + '/checklists/' + checklistId + '/items/' + itemId,
        this.kaitenOptions({
          method: 'DELETE'
        })
      );

      return { error: false, data: result };
    } catch (error) {
      return {
        error: true,
        errorMessage: error as string
      };
    }
  }

  request<T>(url: string, options: Record<string, any>): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        fetch(url, options).then(async (res) => {
          if (res.status === 401) {
            reject(
              `${res.status} ${res.statusText}`
                + (res.url.includes('kaiten') ? '. Проверьте или обновите Kaiten api key' : '')
            );
          } else {
            let data: any;
            try {
              data = await res.json();
            } catch (error) {
              data = {};
            }
            if (!SUCCESS_STATUSES.includes(res.status)) {
              reject(data.message || data.error || `${res.status} ${res.statusText}. URL: ${url}`);
            } else {
              resolve(data);
            }
          }
        }).catch(err => {
          console.log(err);
          reject(`${err.message}. URL: ${url}`);
          return err;
        })
      } catch (error) {
        console.log(error);
      }
      
    });
  }
  
  kaitenOptions(params = {}) {
    return {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        Accept: 'application/json',
        Authorization: 'Bearer ' + this.apiKey
      },
      ...params
    };
  }
}