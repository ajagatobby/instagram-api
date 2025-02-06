export interface InstagramPost {
  pk: string;
  id: string;
  code: string;
  media_type: number;
  play_count?: number;
  view_count?: number;
  like_count: number;
  comment_count: number;
  image_versions2: {
    candidates: Array<{
      height: number;
      width: number;
      url: string;
    }>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string;
  };
}

export interface CommentResponse {
  id: string;
  from: {
    id: string;
    username: string;
    full_name: string;
    profile_picture: string;
  };
  text: string;
  created_time: number;
  status: string;
}

export interface InstagramSession {
  sessionid: string;
  csrftoken: string;
  ds_user_id: string;
  ig_did: string;
  rur?: string;
}
