// The payload shapes the special-exams endpoints return.

export interface AttemptPayload {
  attempt_id: number;
  attempt_status: string;
  in_timed_exam: boolean;
  taking_as_proctored: boolean;
  exam_display_name: string;
  exam_type: string;
  exam_url_path: string;
  time_remaining_seconds: number;
  course_id: string;
  exam_started_poll_url: string;
  desktop_application_js_url: string;
  attempt_code: string;
  software_download_url: string;
  total_time: string;
  external_id?: string;
  use_legacy_attempt_api?: boolean;
  ping_interval?: number;
  timer_ends?: string;
  [field: string]: unknown;
}

export interface ExamPayload {
  id: number;
  exam_name: string;
  course_id: string;
  content_id: string;
  external_id: string | null;
  time_limit_mins: number;
  total_time: string;
  is_proctored: boolean;
  is_practice_exam: boolean;
  is_active: boolean;
  type: string;
  due_date: string | null;
  hide_after_due: boolean;
  backend: string;
  use_legacy_attempt_api?: boolean;
  attempt: Partial<AttemptPayload>;
  prerequisite_status: {
    are_prerequisites_satisifed: boolean;
    satisfied_prerequisites: unknown[];
    failed_prerequisites: unknown[];
    pending_prerequisites: unknown[];
    declined_prerequisites: unknown[];
  };
  [field: string]: unknown;
}

export interface ProctoringSettingsPayload {
  exam_proctoring_backend: {
    download_url: string;
    instructions: string[];
    name: string;
    rules: Record<string, unknown>;
  };
  provider_tech_support_email: string;
  provider_tech_support_phone: string;
  provider_tech_support_url?: string;
  provider_name: string;
  learner_notification_from_email: string;
  integration_specific_email: string;
  [field: string]: unknown;
}

export interface ExamAccessTokenPayload {
  exam_access_token: string;
  exam_access_token_expiration: string;
  [field: string]: unknown;
}

/** What `fetchExamAttemptsData` and `fetchLatestAttempt` return, with an empty attempt as `null`. */
export interface ExamState {
  exam: ExamPayload;
  activeAttempt: AttemptPayload | null;
}

export interface PollPayload {
  status: string;
  time_remaining_seconds: number;
  [field: string]: unknown;
}

export interface ReviewPolicyPayload {
  review_policy: string;
}
