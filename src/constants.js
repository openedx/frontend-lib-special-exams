/* eslint-disable import/prefer-default-export */
export const ExamStatus = Object.freeze({
  CREATED: 'created',
  DOWNLOAD_SOFTWARE_CLICKED: 'download_software_clicked',
  READY_TO_START: 'ready_to_start',
  STARTED: 'started',
  READY_TO_SUBMIT: 'ready_to_submit',
  SUBMITTED: 'submitted',
  TIMED_OUT: 'timed_out',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
});

export const IS_STARTED_STATUS = (status) => [ExamStatus.STARTED, ExamStatus.READY_TO_SUBMIT].includes(status);

// Available actions are taken from
// https://github.com/edx/edx-proctoring/blob/1444ca40a43869fb4e2731cea4862888c5b5f286/edx_proctoring/views.py#L765
export const ExamAction = Object.freeze({
  START: 'start',
  STOP: 'stop',
  PING: 'ping',
  SUBMIT: 'submit',
  ERROR: 'error',
  CLICK_DOWNLOAD_SOFTWARE: 'click_download_software',
});

export const VerificationStatus = Object.freeze({
  PENDING: 'pending',
  MUST_REVERIFY: 'must_reverify',
  APPROVED: 'approved',
  EXPIRED: 'expired',
});
