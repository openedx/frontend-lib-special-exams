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
  fetchExamReviewPolicy,
} from './api';
import { isEmpty } from '../helpers';
import {
  setIsLoading,
  setExamState,
  expireExamAttempt,
  setActiveAttempt,
  setProctoringSettings,
  setVerificationData,
  setReviewPolicy,
  setApiError,
} from './slice';
import { ExamStatus } from '../constants';
import { workerPromiseForEventNames, pingApplication } from './messages/handlers';
import actionToMessageTypesMap from './messages/constants';

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
    const { exam, activeAttempt } = getState().examState;
    if (!exam.id) {
      logError('Failed to start exam. No exam id.');
      handleAPIError(
        { message: 'Failed to start exam. No exam id was found.' },
        dispatch,
      );
      return;
    }

    const useWorker = window.Worker && activeAttempt && activeAttempt.desktop_application_js_url;

    if (useWorker) {
      workerPromiseForEventNames(actionToMessageTypesMap.ping, activeAttempt.desktop_application_js_url)()
        .then(() => updateAttemptAfter(exam.course_id, exam.content_id, createExamAttempt(exam.id))(dispatch))
        .catch(() => handleAPIError(
          { message: 'Something has gone wrong starting your exam. Please double-check that the application is running.' },
          dispatch,
        ));
    } else {
      await updateAttemptAfter(
        exam.course_id, exam.content_id, createExamAttempt(exam.id),
      )(dispatch);
    }
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

export function skipProctoringExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    if (!exam.id) {
      logError('Failed to skip proctored exam. No exam id.');
      return;
    }
    await updateAttemptAfter(
      exam.course_id, exam.content_id, createExamAttempt(exam.id, true, false),
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

    // If the learner is in a state where they've finished the exam
    // and the attempt can be submitted (i.e. they are "ready_to_submit"),
    // don't ping the proctoring app (which action could move
    // the attempt into an error state).
    if (currentAttempt && currentAttempt.attempt_status === ExamStatus.READY_TO_SUBMIT) {
      return;
    }

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

export function continueExam(noLoading = true) {
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
      exam.course_id, exam.content_id, continueAttempt(attemptId), noLoading,
    )(dispatch);
  };
}

export function submitExam() {
  return async (dispatch, getState) => {
    const { exam, activeAttempt } = getState().examState;
    const attemptId = exam.attempt.attempt_id;
    const { desktop_application_js_url: workerUrl } = activeAttempt || {};
    const useWorker = window.Worker && activeAttempt && workerUrl;

    if (!attemptId) {
      logError('Failed to submit exam. No attempt id.');
      handleAPIError(
        { message: 'Failed to submit exam. No attempt id was found.' },
        dispatch,
      );
      return;
    }
    await updateAttemptAfter(exam.course_id, exam.content_id, submitAttempt(attemptId))(dispatch);

    if (useWorker) {
      workerPromiseForEventNames(actionToMessageTypesMap.submit, workerUrl)()
        .catch(() => handleAPIError(
          { message: 'Something has gone wrong submitting your exam. Please double-check that the application is running.' },
          dispatch,
        ));
    }
  };
}

export function expireExam() {
  return async (dispatch, getState) => {
    const { exam, activeAttempt } = getState().examState;
    const attemptId = exam.attempt.attempt_id;
    const { desktop_application_js_url: workerUrl } = activeAttempt || {};
    const useWorker = window.Worker && activeAttempt && workerUrl;

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

    if (useWorker) {
      workerPromiseForEventNames(actionToMessageTypesMap.submit, workerUrl)()
        .catch(() => handleAPIError(
          { message: 'Something has gone wrong submitting your exam. Please double-check that the application is running.' },
          dispatch,
        ));
    }
  };
}

/**
 * Ping provider application (used for proctored exams).
 * @param timeoutInSeconds - time to wait for worker response before raising an error
 * @param workerUrl - location of the worker from the provider
 */
export function pingAttempt(timeoutInSeconds, workerUrl) {
  return async (dispatch) => {
    await pingApplication(timeoutInSeconds, workerUrl)
      .catch((error) => handleAPIError(
        { message: error ? error.message : 'Worker failed to respond.' },
        dispatch,
      ));
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

export function getExamReviewPolicy() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    if (!exam.id) {
      logError('Failed to fetch exam review policy. No exam id.');
      return;
    }
    const data = await fetchExamReviewPolicy(exam.id);
    dispatch(setReviewPolicy({ policy: data.review_policy }));
  };
}
