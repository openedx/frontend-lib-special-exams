/* eslint-disable import/prefer-default-export */
export const ExamStatus = Object.freeze({
  ELIGIBLE: 'eligible',
  CREATED: 'created',
  DOWNLOAD_SOFTWARE_CLICKED: 'download_software_clicked',
  READY_TO_START: 'ready_to_start',
  STARTED: 'started',
  READY_TO_SUBMIT: 'ready_to_submit',
  SUBMITTED: 'submitted',
  SECOND_REVIEW_REQUIRED: 'second_review_required',
  TIMED_OUT: 'timed_out',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  ERROR: 'error',
  READY_TO_RESUME: 'ready_to_resume',
  ONBOARDING_MISSING: 'onboarding_missing',
  ONBOARDING_PENDING: 'onboarding_pending',
  ONBOARDING_FAILED: 'onboarding_failed',
  ONBOARDING_EXPIRED: 'onboarding_expired',
  DECLINED: 'declined',
});

export const INCOMPLETE_STATUSES = [
  ExamStatus.ELIGIBLE, ExamStatus.CREATED, ExamStatus.DOWNLOAD_SOFTWARE_CLICKED,
  ExamStatus.READY_TO_START, ExamStatus.STARTED, ExamStatus.READY_TO_SUBMIT,
];

export const ONBOARDING_ERRORS = [
  ExamStatus.ONBOARDING_EXPIRED, ExamStatus.ONBOARDING_FAILED,
  ExamStatus.ONBOARDING_MISSING, ExamStatus.ONBOARDING_PENDING,
];

export const IS_STARTED_STATUS = (status) => [ExamStatus.STARTED, ExamStatus.READY_TO_SUBMIT].includes(status);
export const IS_INCOMPLETE_STATUS = (status) => INCOMPLETE_STATUSES.includes(status);
export const IS_ONBOARDING_ERROR = (status) => ONBOARDING_ERRORS.includes(status);

// Available actions are taken from
// https://github.com/edx/edx-proctoring/blob/1444ca40a43869fb4e2731cea4862888c5b5f286/edx_proctoring/views.py#L765
export const ExamAction = Object.freeze({
  START: 'start',
  STOP: 'stop',
  PING: 'ping',
  SUBMIT: 'submit',
  ERROR: 'error',
  RESET: 'reset_attempt',
  CLICK_DOWNLOAD_SOFTWARE: 'click_download_software',
  DECLINE: 'decline',
});

export const VerificationStatus = Object.freeze({
  PENDING: 'pending',
  MUST_REVERIFY: 'must_reverify',
  APPROVED: 'approved',
  EXPIRED: 'expired',
  NONE: 'none',
});

export const ExamType = Object.freeze({
  ONBOARDING: 'onboarding',
  PRACTICE: 'practice',
  PROCTORED: 'proctored',
  TIMED: 'timed',
});
