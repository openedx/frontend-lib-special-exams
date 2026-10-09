// What a reader sees before its query has data: the shapes the slice used to initialise with.
import type { ExamPayload, ProctoringSettingsPayload } from './types';

export const defaultExam: ExamPayload = {
  id: null as unknown as number,
  course_id: '',
  content_id: '',
  external_id: '',
  exam_name: '',
  time_limit_mins: null as unknown as number,
  total_time: '',
  is_proctored: false,
  is_practice_exam: false,
  is_active: true,
  type: '',
  due_date: null,
  hide_after_due: false,
  backend: '',
  prerequisite_status: {
    are_prerequisites_satisifed: true,
    satisfied_prerequisites: [],
    failed_prerequisites: [],
    pending_prerequisites: [],
    declined_prerequisites: [],
  },
  attempt: {
    in_timed_exam: true,
    taking_as_proctored: true,
    exam_type: '',
    exam_display_name: '',
    exam_url_path: '',
    time_remaining_seconds: null as unknown as number,
    course_id: '',
    attempt_id: null as unknown as number,
    attempt_status: '',
    exam_started_poll_url: '',
    desktop_application_js_url: '',
    ping_interval: null as unknown as number,
    attempt_code: '',
    external_id: '',
    use_legacy_attempt_api: true,
  },
};

export const defaultProctoringSettings: ProctoringSettingsPayload = {
  exam_proctoring_backend: {
    download_url: '',
    instructions: [],
    name: '',
    rules: {},
  },
  provider_tech_support_email: '',
  provider_tech_support_phone: '',
  provider_tech_support_url: '',
  provider_name: '',
  learner_notification_from_email: '',
  integration_specific_email: '',
};
