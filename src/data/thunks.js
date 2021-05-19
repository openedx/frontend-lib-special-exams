import { logError } from '@edx/frontend-platform/logging';
import {
  fetchExamAttemptsData,
  createExamAttempt,
  stopAttempt,
  continueAttempt,
  submitAttempt,
  pollExamAttempt,
} from './api';
import { isEmpty } from '../helpers';
import {
  setIsLoading,
  setExamState,
  expireExamAttempt,
  setActiveAttempt,
  setApiError,
} from './slice';
import { ExamStatus } from '../constants';

function handleAPIError(error, dispatch) {
  const { message, detail } = error;
  dispatch(setApiError({ errorMsg: message || detail }));
}

function updateAttemptAfter(courseId, sequenceId, promise = null, noLoading = false) {
  return async (dispatch) => {
    if (!noLoading) { dispatch(setIsLoading({ isLoading: true })); }
    if (promise) {
      try {
        const data = await promise;
        if (!data || !data.exam_attempt_id) {
          if (!noLoading) { dispatch(setIsLoading({ isLoading: false })); }
          return;
        }
      } catch (error) {
        handleAPIError(error, dispatch);
        if (!noLoading) { dispatch(setIsLoading({ isLoading: false })); }
      }
    }

    try {
      const attemptData = await fetchExamAttemptsData(courseId, sequenceId);
      dispatch(setExamState({
        exam: attemptData.exam,
        activeAttempt: !isEmpty(attemptData.active_attempt) ? attemptData.active_attempt : null,
      }));
    } catch (error) {
      handleAPIError(error, dispatch);
    } finally {
      if (!noLoading) { dispatch(setIsLoading({ isLoading: false })); }
    }
  };
}

export function getExamAttemptsData(courseId, sequenceId) {
  return updateAttemptAfter(courseId, sequenceId);
}

export function startExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    if (!exam.id) {
      logError('Failed to start exam. No exam id.');
      handleAPIError(
        { message: 'Failed to start exam. No exam id was found.' },
        dispatch,
      );
      return;
    }
    await updateAttemptAfter(
      exam.course_id, exam.content_id, createExamAttempt(exam.id),
    )(dispatch);
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
      error => handleAPIError(error, dispatch),
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
      handleAPIError(
        { message: 'Failed to stop exam. No attempt id was found.' },
        dispatch,
      );
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
      handleAPIError(
        { message: 'Failed to continue exam. No attempt id was found.' },
        dispatch,
      );
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
      handleAPIError(
        { message: 'Failed to submit exam. No attempt id was found.' },
        dispatch,
      );
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
      handleAPIError(
        { message: 'Failed to expire exam. No attempt id was provided.' },
        dispatch,
      );
      return;
    }
    await updateAttemptAfter(
      exam.course_id, exam.content_id, submitAttempt(attemptId),
    )(dispatch);
    dispatch(expireExamAttempt());
  };
}
