import { createSlice } from '@reduxjs/toolkit';

/* eslint-disable no-param-reassign */
export const examSlice = createSlice({
  name: 'exam',
  initialState: {
    isLoading: true,
    timeIsOver: false,
    activeAttempt: null,
    allowProctoringOptOut: false,
    proctoringSettings: {},
    exam: {},
    verification: {},
    apiErrorMsg: '',
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
    expireExamAttempt: (state) => {
      state.timeIsOver = true;
    },
    getExamId: (state) => state.examId,
    setVerificationData: (state, { payload }) => {
      state.verification = payload.verification;
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
  setIsLoading, setExamState, getExamId, expireExamAttempt,
  setActiveAttempt, setProctoringSettings, setVerificationData,
  setReviewPolicy, setApiError, setAllowProctoringOptOut,
} = examSlice.actions;

export default examSlice.reducer;
