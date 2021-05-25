import { logError } from '@edx/frontend-platform/logging';
import {
  fetchExamAttemptsData,
  createExamAttempt,
  stopAttempt,
  continueAttempt,
  submitAttempt,
  pollExamAttempt,
  fetchProctoringSettings,
  softwareDownloadAttempt,
  fetchVerificationStatus,
} from './api';
import { isEmpty } from '../helpers';
import {
  setIsLoading,
  setExamState,
  expireExamAttempt,
  setActiveAttempt,
  setProctoringSettings,
  setVerificationData,
} from './slice';
import { ExamStatus } from '../constants';

function updateAttemptAfter(courseId, sequenceId, promise = null, noLoading = false) {
  return async (dispatch) => {
    let data;
    if (!noLoading) { dispatch(setIsLoading({ isLoading: true })); }
    if (promise) {
      data = await promise.catch(err => err);
      if (!data || !data.exam_attempt_id) {
        if (!noLoading) { dispatch(setIsLoading({ isLoading: false })); }
        return;
      }
    }

    const attemptData = await fetchExamAttemptsData(courseId, sequenceId);
    dispatch(setExamState({
      exam: attemptData.exam,
      activeAttempt: !isEmpty(attemptData.active_attempt) ? attemptData.active_attempt : null,
    }));
    if (!noLoading) { dispatch(setIsLoading({ isLoading: false })); }
  };
}

export function getExamAttemptsData(courseId, sequenceId) {
  return updateAttemptAfter(courseId, sequenceId);
}

export function getProctoringSettings() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    if (!exam.id) {
      logError('Failed to get exam settings. No exam id.');
      return;
    }
    dispatch(setIsLoading({ isLoading: true }));
    const proctoringSettings = await fetchProctoringSettings(exam.id);
    dispatch(setProctoringSettings({ proctoringSettings }));
    dispatch(setIsLoading({ isLoading: false }));
  };
}

export function startExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    if (!exam.id) {
      logError('Failed to start exam. No exam id.');
      return;
    }
    await updateAttemptAfter(
      exam.course_id, exam.content_id, createExamAttempt(exam.id),
    )(dispatch);
  };
}

export function startProctoringExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    if (!exam.id) {
      logError('Failed to start exam. No exam id.');
      return;
    }
    await updateAttemptAfter(
      exam.course_id, exam.content_id, createExamAttempt(exam.id, false, true),
    )(dispatch);
    const proctoringSettings = await fetchProctoringSettings(exam.id);
    dispatch(setProctoringSettings({ proctoringSettings }));
  };
}

/**
 * Poll exam active attempt status.
 * @param url - poll attempt url
 */
export function pollAttempt(url) {
  return async (dispatch, getState) => {
    const currentAttempt = getState().examState.activeAttempt;
    const data = await pollExamAttempt(url).catch(
      err => logError(err),
    );
    const updatedAttempt = {
      ...currentAttempt,
      time_remaining_seconds: data.time_remaining_seconds,
      accessibility_time_string: data.accessibility_time_string,
      attempt_status: data.status,
    };
    dispatch(setActiveAttempt({
      activeAttempt: updatedAttempt,
    }));
    if (data.status === ExamStatus.SUBMITTED) {
      dispatch(expireExamAttempt());
    }
  };
}

export function stopExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    const attemptId = exam.attempt.attempt_id;
    if (!attemptId) {
      logError('Failed to stop exam. No attempt id.');
      return;
    }
    await updateAttemptAfter(
      exam.course_id, exam.content_id, stopAttempt(attemptId), true,
    )(dispatch);
  };
}

export function continueExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    const attemptId = exam.attempt.attempt_id;
    if (!attemptId) {
      logError('Failed to continue exam. No attempt id.');
      return;
    }
    await updateAttemptAfter(
      exam.course_id, exam.content_id, continueAttempt(attemptId), true,
    )(dispatch);
  };
}

export function submitExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    const attemptId = exam.attempt.attempt_id;
    if (!attemptId) {
      logError('Failed to submit exam. No attempt id.');
      return;
    }
    await updateAttemptAfter(
      exam.course_id, exam.content_id, submitAttempt(attemptId),
    )(dispatch);
  };
}

export function expireExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    const attemptId = exam.attempt.attempt_id;
    if (!attemptId) {
      logError('Failed to expire exam. No attempt id.');
      return;
    }
    await updateAttemptAfter(
      exam.course_id, exam.content_id, submitAttempt(attemptId),
    )(dispatch);
    dispatch(expireExamAttempt());
  };
}

export function startProctoringSoftwareDownload() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    const attemptId = exam.attempt.attempt_id;
    if (!attemptId) {
      logError('Failed to start downloading proctoring software. No attempt id.');
      return;
    }
    await updateAttemptAfter(
      exam.course_id, exam.content_id, softwareDownloadAttempt(attemptId),
    )(dispatch);
  };
}

export function getVerificationData() {
  return async (dispatch) => {
    const data = await fetchVerificationStatus();
    dispatch(setVerificationData({ verification: data }));
  };
}
