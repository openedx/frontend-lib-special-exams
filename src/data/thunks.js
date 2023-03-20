import { logError } from '@edx/frontend-platform/logging';
import {
  fetchExamAttemptsData,
  fetchLatestAttempt,
  createExamAttempt,
  stopAttempt,
  continueAttempt,
  submitAttempt,
  pollExamAttempt,
  fetchProctoringSettings,
  softwareDownloadAttempt,
  fetchExamReviewPolicy,
  resetAttempt,
  declineAttempt,
  endExamWithFailure,
} from './api';
import { isEmpty } from '../helpers';
import {
  setIsLoading,
  setExamState,
  expireExamAttempt,
  setActiveAttempt,
  setProctoringSettings,
  setReviewPolicy,
  setApiError,
  setAllowProctoringOptOut,
} from './slice';
import { ExamStatus } from '../constants';
import { workerPromiseForEventNames, pingApplication } from './messages/handlers';
import actionToMessageTypesMap from './messages/constants';

function handleAPIError(error, dispatch) {
  const { message, detail } = error;
  dispatch(setApiError({ errorMsg: message || detail }));
}

const EXAM_START_TIMEOUT_MILLISECONDS = 5000;

/**
 * Fetch attempt data and update exam state after performing another action if it is provided.
 * It is assumed that action somehow modifies attempt in the backend, that's why the state needs
 * to be updated.
 * @param courseId - id of a course
 * @param sequenceId - id of a sequence
 * @param promiseToBeResolvedFirst - a promise that should get resolved before fetching attempt data
 * @param noLoading - if set to false shows spinner while executing the function
 */
function updateAttemptAfter(courseId, sequenceId, promiseToBeResolvedFirst = null, noLoading = false) {
  return async (dispatch) => {
    if (!noLoading) { dispatch(setIsLoading({ isLoading: true })); }
    if (promiseToBeResolvedFirst) {
      try {
        const response = await promiseToBeResolvedFirst;
        if (!response || !response.exam_attempt_id) {
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

export function getLatestAttemptData(courseId) {
  return async (dispatch) => {
    dispatch(setIsLoading({ isLoading: true }));
    try {
      const attemptData = await fetchLatestAttempt(courseId);
      dispatch(setExamState({
        exam: attemptData.exam,
        activeAttempt: !isEmpty(attemptData.active_attempt) ? attemptData.active_attempt : null,
      }));
    } catch (error) {
      handleAPIError(error, dispatch);
    } finally {
      dispatch(setIsLoading({ isLoading: false }));
    }
  };
}

export function getProctoringSettings() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    if (!exam.id) {
      logError('Failed to get exam settings. No exam id.');
      handleAPIError(
        { message: 'Failed to fetch proctoring settings. No exam id was found.' },
        dispatch,
      );
      return;
    }
    try {
      const proctoringSettings = await fetchProctoringSettings(exam.id);
      dispatch(setProctoringSettings({ proctoringSettings }));
    } catch (error) {
      handleAPIError(error, dispatch);
    }
  };
}

/**
 * Start a timed exam
 */
export function startTimedExam() {
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

export function createProctoredExamAttempt() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    if (!exam.id) {
      logError('Failed to create exam attempt. No exam id.');
      return;
    }
    await updateAttemptAfter(
      exam.course_id, exam.content_id, createExamAttempt(exam.id, false, true),
    )(dispatch);
  };
}

/**
 * Start a proctored exam (including onboarding and practice exams)
 */
export function startProctoredExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    const { attempt } = exam || {};
    if (!exam.id) {
      logError('Failed to start proctored exam. No exam id.');
      return;
    }
    const { desktop_application_js_url: workerUrl } = attempt || {};
    const useWorker = window.Worker && workerUrl;

    if (useWorker) {
      const startExamTimeoutMilliseconds = EXAM_START_TIMEOUT_MILLISECONDS;
      workerPromiseForEventNames(actionToMessageTypesMap.start, exam.attempt.desktop_application_js_url)(
        startExamTimeoutMilliseconds,
        attempt.external_id,
      ).then(() => updateAttemptAfter(
        exam.course_id, exam.content_id, continueAttempt(attempt.attempt_id),
      )(dispatch))
        .catch(error => {
          const message = error?.message || 'Worker failed to respond.';
          logError(
            message,
            {
              attemptId: attempt.attempt_id,
              attemptStatus: attempt.attempt_status,
              courseId: attempt.course_id,
              examId: exam.id,
            },
          );
          handleAPIError(
            { message: 'Something has gone wrong starting your exam. Please double-check that the application is running.' },
            dispatch,
          );
        });
    } else {
      await updateAttemptAfter(
        exam.course_id, exam.content_id, continueAttempt(attempt.attempt_id),
      )(dispatch);
    }
  };
}

export function skipProctoringExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    if (!exam.id) {
      logError('Failed to skip proctored exam. No exam id.');
      return;
    }
    const attemptId = exam.attempt.attempt_id;
    if (attemptId) {
      await updateAttemptAfter(
        exam.course_id, exam.content_id, declineAttempt(attemptId),
      )(dispatch);
    } else {
      await updateAttemptAfter(
        exam.course_id, exam.content_id, createExamAttempt(exam.id, true, false),
      )(dispatch);
    }
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

    try {
      const data = await pollExamAttempt(url);
      const updatedAttempt = {
        ...currentAttempt,
        time_remaining_seconds: data.time_remaining_seconds,
        accessibility_time_string: data.accessibility_time_string,
        attempt_status: data.attempt_status,
      };
      dispatch(setActiveAttempt({
        activeAttempt: updatedAttempt,
      }));
      if (data.status === ExamStatus.SUBMITTED) {
        dispatch(expireExamAttempt());
      }
    } catch (error) {
      handleAPIError(error, dispatch);
    }
  };
}

export function stopExam() {
  return async (dispatch, getState) => {
    const { exam, activeAttempt } = getState().examState;

    if (!activeAttempt) {
      logError('Failed to stop exam. No active attempt.');
      handleAPIError(
        { message: 'Failed to stop exam. No active attempt was found.' },
        dispatch,
      );
      return;
    }

    const { attempt_id: attemptId, exam_url_path: examUrl } = activeAttempt;
    if (!exam.attempt || attemptId !== exam.attempt.attempt_id) {
      try {
        await stopAttempt(attemptId);
        window.location.href = examUrl;
      } catch (error) {
        handleAPIError(error, dispatch);
      }
      return;
    }

    await updateAttemptAfter(
      exam.course_id, exam.content_id, stopAttempt(attemptId),
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
      exam.course_id, exam.content_id, continueAttempt(attemptId),
    )(dispatch);
  };
}

export function resetExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    const attemptId = exam.attempt.attempt_id;
    if (!attemptId) {
      logError('Failed to reset exam attempt. No attempt id.');
      handleAPIError(
        { message: 'Failed to reset exam attempt. No attempt id was found.' },
        dispatch,
      );
      return;
    }
    await updateAttemptAfter(
      exam.course_id, exam.content_id, resetAttempt(attemptId),
    )(dispatch);
  };
}

export function submitExam() {
  return async (dispatch, getState) => {
    const { exam, activeAttempt } = getState().examState;
    const { desktop_application_js_url: workerUrl, external_id: attemptExternalId } = activeAttempt || {};
    const useWorker = window.Worker && activeAttempt && workerUrl;

    const handleBackendProviderSubmission = () => {
      // if a backend provider is being used during the exam
      // send it a message that exam is being submitted
      if (useWorker) {
        workerPromiseForEventNames(actionToMessageTypesMap.submit, workerUrl)(0, attemptExternalId)
          .catch(() => handleAPIError(
            { message: 'Something has gone wrong submitting your exam. Please double-check that the application is running.' },
            dispatch,
          ));
      }
    };

    if (!activeAttempt) {
      logError('Failed to submit exam. No active attempt.');
      handleAPIError(
        { message: 'Failed to submit exam. No active attempt was found.' },
        dispatch,
      );
      return;
    }

    const { attempt_id: attemptId, exam_url_path: examUrl } = activeAttempt;
    if (!exam.attempt || attemptId !== exam.attempt.attempt_id) {
      try {
        await submitAttempt(attemptId);
        window.location.href = examUrl;
        handleBackendProviderSubmission();
      } catch (error) {
        handleAPIError(error, dispatch);
      }
      return;
    }

    await updateAttemptAfter(exam.course_id, exam.content_id, submitAttempt(attemptId))(dispatch);
    handleBackendProviderSubmission();
  };
}

export function expireExam() {
  return async (dispatch, getState) => {
    const { exam, activeAttempt } = getState().examState;
    const {
      desktop_application_js_url: workerUrl,
      attempt_id: attemptId,
      external_id: attemptExternalId,
    } = activeAttempt || {};
    const useWorker = window.Worker && activeAttempt && workerUrl;

    if (!attemptId) {
      logError('Failed to expire exam. No attempt id.');
      handleAPIError(
        { message: 'Failed to expire exam. No attempt id was found.' },
        dispatch,
      );
      return;
    }

    await updateAttemptAfter(
      activeAttempt.course_id, exam.content_id, submitAttempt(attemptId),
    )(dispatch);
    dispatch(expireExamAttempt());

    if (useWorker) {
      workerPromiseForEventNames(actionToMessageTypesMap.submit, workerUrl)(0, attemptExternalId)
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
  return async (dispatch, getState) => {
    const { exam, activeAttempt } = getState().examState;
    await pingApplication(timeoutInSeconds, activeAttempt.external_id, workerUrl)
      .catch(async (error) => {
        const message = error?.message || 'Worker failed to respond.';
        /**
         * Note: The exam id logged here represents the current section being rendered.
         * This may be different from the exam they are currently attempting
         * if the learner has navigated to other course content during the exam.
         * */
        logError(
          message,
          {
            attemptId: activeAttempt.attempt_id,
            attemptStatus: activeAttempt.attempt_status,
            courseId: activeAttempt.course_id,
            examId: exam.id,
          },
        );
        await updateAttemptAfter(
          exam.course_id, exam.content_id, endExamWithFailure(activeAttempt.attempt_id, message),
        )(dispatch);
      });
  };
}

export function startProctoringSoftwareDownload() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    const attemptId = exam.attempt.attempt_id;
    if (!attemptId) {
      logError('Failed to start downloading proctoring software. No attempt id.');
      handleAPIError(
        { message: 'Failed to start downloading proctoring software. No attempt id was found.' },
        dispatch,
      );
      return;
    }
    await updateAttemptAfter(
      exam.course_id, exam.content_id, softwareDownloadAttempt(attemptId),
    )(dispatch);
  };
}

export function getExamReviewPolicy() {
  return async (dispatch, getState) => {
    const { exam } = getState().examState;
    if (!exam.id) {
      logError('Failed to fetch exam review policy. No exam id.');
      handleAPIError(
        { message: 'Failed to fetch exam review policy. No exam id was found.' },
        dispatch,
      );
      return;
    }
    try {
      const data = await fetchExamReviewPolicy(exam.id);
      dispatch(setReviewPolicy({ policy: data.review_policy }));
    } catch (error) {
      handleAPIError(error, dispatch);
    }
  };
}

export function getAllowProctoringOptOut(allowProctoringOptOut) {
  return (dispatch) => {
    dispatch(setAllowProctoringOptOut({ allowProctoringOptOut }));
  };
}
