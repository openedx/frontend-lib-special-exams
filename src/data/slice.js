import { createSlice } from '@reduxjs/toolkit';

/* eslint-disable no-param-reassign */
export const examSlice = createSlice({
  name: 'exam',
  initialState: {
    isLoading: true,
    timeIsOver: false,
    activeAttempt: null, // has the same structure as attempt in exam object
    allowProctoringOptOut: false,
    proctoringSettings: {
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
    },
    exam: {
      id: null,
      course_id: '',
      content_id: '',
      external_id: '',
      exam_name: '',
      time_limit_mins: null,
      is_proctored: false,
      is_practice_exam: false,
      is_active: true,
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
        time_remaining_seconds: null,
        low_threshold_sec: null,
        critically_low_threshold_sec: null,
        course_id: '',
        attempt_id: null,
        attempt_status: '',
        exam_started_poll_url: '',
        desktop_application_js_url: '',
        ping_interval: null,
        attempt_code: '',
        external_id: '',
      },
      type: '',
    },
    apiErrorMsg: '',
    examAccessToken: {
      exam_access_token: '',
      exam_access_token_expiration: '',
    },
  },
  reducers: {
    setAllowProctoringOptOut: (state, { payload }) => {
      state.allowProctoringOptOut = payload.allowProctoringOptOut;
    },
    setIsLoading: (state, { payload }) => {
      state.isLoading = payload.isLoading;
    },
    setExamState: (state, { payload }) => {
      state.exam = payload.exam;
      state.activeAttempt = payload.activeAttempt;
    },
    setActiveAttempt: (state, { payload }) => {
      state.activeAttempt = payload.activeAttempt;
      state.apiErrorMsg = '';
    },
    setProctoringSettings: (state, { payload }) => {
      state.proctoringSettings = payload.proctoringSettings;
    },
    setExamAccessToken: (state, { payload }) => {
      state.examAccessToken = payload.examAccessToken;
    },
    expireExamAttempt: (state) => {
      state.timeIsOver = true;
    },
    setReviewPolicy: (state, { payload }) => {
      state.exam.reviewPolicy = payload.policy;
    },
    setApiError: (state, { payload }) => {
      state.apiErrorMsg = payload.errorMsg;
    },
  },
});

export const {
  setIsLoading, setExamState, expireExamAttempt,
  setActiveAttempt, setProctoringSettings, setExamAccessToken,
  setReviewPolicy, setApiError, setAllowProctoringOptOut,
} = examSlice.actions;

export default examSlice.reducer;
