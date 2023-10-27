export enum CardStateEnum {
  queued = 1,
  inProgress = 2,
  done = 3
}
export enum CardConditionEnum {
  live = 1,
  archived = 2
}

export type KaitenChecklistItemType = {
  updated: string,
  created: string,
  id: number,
  checklist_id: number,
  text: string,
  sort_order: number,
  checked: boolean,
  checked_by?: KaitenUserType,
  checker_id: null | number,
  user_id: number, // ?? string or number
  checked_at: null | string,
  responsible_id: null | number,
  deleted: boolean,
  due_date: null | string
};

export type UpdateChecklistItemType = Partial<Pick<KaitenChecklistItemType, 'checked' | 'checklist_id' | 'text' | 'sort_order'>>;

export type KaitenChecklistType = {
  updated: string;
  created: string;
  id: number;
  sort_order: number;
  name: string;
  policy_id: null | number;
  items?: KaitenChecklistItemType[];
};

export type AddKaitenChecklistType = Partial<Pick<KaitenChecklistType, 'name' | 'sort_order'>>;

export type UpdateKaitenChecklistType = Partial<Pick<KaitenChecklistType, 'name' | 'sort_order'>> & { card_id?: number };


export type KaitenCardType = {
  updated: string,
  created: string,
  archived: boolean,
  id: number,
  title: string,
  description: null | string,
  asap: boolean,
  due_date: null | string,
  sort_order: number,
  fifo_order: number,
  state: CardStateEnum,
  condition: CardConditionEnum,
  expires_later: boolean,
  parents_count: number,
  children_count: number,
  children_done: number,
  has_blocked_children: boolean,
  goals_total: number,
  goals_done: number,
  time_spent_sum: number,
  time_blocked_sum: number,
  children_number_properties_sum: null | {
    size: number;
    time_spent_sum: number;
  },
  calculated_planned_start: null | string,
  calculated_planned_end: null | string,
  parent_checklist_ids: null | string[],
  parents_ids: null | string[],
  children_ids: null | string[],
  blocking_card: boolean,
  blocked: boolean,
  size: null | number,
  size_unit: null | string,
  size_text: null | string,
  due_date_time_present: boolean,
  board_id: number,
  column_id: number,
  lane_id: number,
  owner_id: number,
  type_id: number,
  version: number,
  updater_id: number,
  completed_on_time: null | boolean,
  completed_at: null | string,
  last_moved_at: null | string,
  lane_changed_at: null | string,
  column_changed_at: null | string,
  first_moved_to_in_progress_at: null | string,
  last_moved_to_done_at: null | string,
  sprint_id: number,
  external_id: null | string,
  service_id: number,
  comments_total: number,
  comment_last_added_at: null | string,
  properties: null | Record<string, string | number | null | object>,
  planned_start: null | string,
  planned_end: null | string,
  counters_recalculated_at: string,
  sd_new_comment: boolean,
  import_id: null | number,
  public: boolean,
  share_settings: null | {
    fields: object; // есть в доках можно дополнить при необходимости
    share_due_date: string | null;
  },
  share_id: null | string,
  external_user_emails: null | string,
  description_filled: boolean,
  estimate_workload: number,
  checklists: KaitenChecklistType[],
  owner: object; // есть в доках можно дополнить при необходимости
  type: object; // есть в доках можно дополнить при необходимости
  board: object; // есть в доках можно дополнить при необходимости
  blockers: object[]; // есть в доках можно дополнить при необходимости
  members: object[]; // есть в доках можно дополнить при необходимости
  column: object; // есть в доках можно дополнить при необходимости
  lane: object; // есть в доках можно дополнить при необходимости
  blocked_at: string,
  blocker_id: number,
  blocker: object; // есть в доках можно дополнить при необходимости
  block_reason: string,
  children: object[]; // есть в доках можно дополнить при необходимости
  parents: object[]; // есть в доках можно дополнить при необходимости
  external_links: object[]; // есть в доках можно дополнить при необходимости
  files: object[]; // есть в доках можно дополнить при необходимости
  tags: object[]; // есть в доках можно дополнить при необходимости
  cardRole: number,
  email: string
};

export type KaitenRoleType = {
  created: string,
  updated: string,
  id: number,
  name: string,
  company_id: null | number,
  uid: string
};

export enum AvatarEnum {
  gravatar = 1,
  initials = 2,
  uploaded = 3
}

export enum ThemeEnum {
  light = 'light',
  dark = 'dark',
  auto = 'auto'
}

export type KaitenUserType = {
  id: number,
  full_name: string,
  email: string,
  username: string,
  updated: string,
  created: string,
  avatar_initials_url: string,
  avatar_uploaded_url: null | string,
  activated: boolean,
  initials: string,
  avatar_type: AvatarEnum,
  lng: string,
  timezone: string,
  theme: ThemeEnum
};

export type KaitenTimeLogType = {
  updated: string,
  created: string,
  id: number,
  card_id: number,
  user_id: number,
  role_id: number,
  author_id: number,
  updater_id: number,
  time_spent: number,
  for_date: string,
  comment: null | string,
  role: KaitenRoleType,
  user: KaitenUserType,
  author: KaitenUserType
};

export type AddTimeLogDataType = {
  role_id: number;
  time_spent: number;
  for_date: string; // Log date in format YYYY-MM-DD
  comment?: string;
};
export type AddTimeLogResponseDataType = Omit<KaitenTimeLogType, 'role' | 'user' | 'author'>;

export type UpdateTimeLogDataType = {
  role_id?: number;
  time_spent?: number;
  for_date?: string; // Log date in format YYYY-MM-DD
  comment?: string;
};
export type UpdateTimeLogResponseDataType = Omit<KaitenTimeLogType, 'role' | 'user' | 'author'>;

export enum KaitenCommentTypeEnum {
  markdown = 1,
  html = 2
}

export enum KaitenAttacmentTypeEnum {
  attachment = 1,
  googleDrive = 2,
  dropBox = 3,
  box = 4,
  oneDrive = 5,
  'yandex disc' = 6,
  'comment email' = 7,
  commentAttachment = 8,
}

export type KaitenAttacmentsType = {
  updated: string,
  created: string,
  card_cover: boolean,
  author_id: number,
  card_id: number,
  comment_id: number,
  deleted: boolean,
  external: boolean,
  id: number,
  name: string,
  size: number,
  sort_order: number,
  type: KaitenAttacmentTypeEnum,
  url: string
};

export type KaitenCommentType = {
  updated: string,
  created: string,
  id: number,
  text: string,
  type: KaitenCommentTypeEnum,
  edited: boolean,
  card_id: number,
  author_id: number,
  mail_addresses_to: string,
  internal: boolean,
  sd_external_recipients_cc: null |string,
  notification_sent: null | string,
  sent_slack_messages_data: null | {
    channel: string,
    ts: string
  },
  attacments: KaitenAttacmentsType[],
  author: KaitenUserType
};

export type AddCommentDataType = Pick<KaitenCommentType, 'text'> & {
  files: any[]
};
export type AddCommentResponseType = Omit<KaitenCommentType, 'author' | 'sent_slack_messages_data'>;

export type UpdateCommentDataType = Pick<KaitenCommentType, 'text'> & {
  files: any[]
};
export type UpdateCommentResponseType = Omit<KaitenCommentType, 'author' | 'sent_slack_messages_data'>;

// Array.from($0.childNodes).reduce((acc, curr) => { const key = curr.childNodes[0].innerText; const value = curr.childNodes[1].innerText; acc[key]=value; return acc; }, {});