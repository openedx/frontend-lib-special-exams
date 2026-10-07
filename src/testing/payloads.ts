// The payload shapes the special-exams endpoints return, with the defaults the library's own
// tests use (`src/data/__factories__`). Each builder returns a fresh object with `overrides` applied.

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

export const buildAttempt = (overrides: Partial<AttemptPayload> = {}): AttemptPayload => ({
  attempt_id: 1,
  attempt_status: 'started',
  in_timed_exam: true,
  taking_as_proctored: false,
  exam_display_name: 'a timed exam',
  exam_type: 'timed',
  exam_url_path: 'http://localhost:2000/course/course-v1:test+special+exam/block-v1:test+special+exam+type@sequential+block@abc123',
  time_remaining_seconds: 1799.9,
  course_id: 'course-v1:test+special+exam',
  exam_started_poll_url: '/api/edx_proctoring/v1/proctored_exam/attempt/1',
  desktop_application_js_url: '',
  attempt_code: '',
  software_download_url: '',
  total_time: '30 minutes',
  ...overrides,
});

export const buildExam = (overrides: Partial<ExamPayload> = {}): ExamPayload => ({
  id: 1,
  exam_name: 'prock exam',
  course_id: 'course-v1:test+special+exam',
  content_id: 'block-v1:test+special+exam+type@sequential+block@abc123',
  external_id: null,
  time_limit_mins: 30,
  total_time: '30 minutes',
  is_proctored: false,
  is_practice_exam: false,
  is_active: true,
  type: 'timed',
  due_date: null,
  hide_after_due: false,
  backend: 'test',
  attempt: {},
  prerequisite_status: {
    are_prerequisites_satisifed: true,
    satisfied_prerequisites: [],
    failed_prerequisites: [],
    pending_prerequisites: [],
    declined_prerequisites: [],
  },
  ...overrides,
});

export const buildProctoringSettings = (
  overrides: Partial<ProctoringSettingsPayload> = {},
): ProctoringSettingsPayload => ({
  exam_proctoring_backend: {
    download_url: '',
    instructions: [],
    name: '',
    rules: {},
  },
  provider_tech_support_email: '',
  provider_tech_support_phone: '',
  provider_name: '',
  learner_notification_from_email: '',
  integration_specific_email: '',
  ...overrides,
});

export const buildExamAccessToken = (
  overrides: Partial<ExamAccessTokenPayload> = {},
): ExamAccessTokenPayload => ({
  exam_access_token: 'Z173480948902JK34432',
  exam_access_token_expiration: '60',
  ...overrides,
});
