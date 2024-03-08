import { logError } from '@edx/frontend-platform/logging';
import { getConfig } from '@edx/frontend-platform';
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
  fetchExamAccessToken,
} from './api';
import { isEmpty } from '../helpers';
import {
  setIsLoading,
  setExamState,
  expireExamAttempt,
  setActiveAttempt,
  setProctoringSettings,
  setExamAccessToken,
  setReviewPolicy,
  setApiError,
  setAllowProctoringOptOut,
} from './slice';
import { ExamStatus, ExamType, IS_PROCTORED_STATUS } from '../constants';
import { workerPromiseForEventNames, pingApplication } from './messages/handlers';
import actionToMessageTypesMap from './messages/constants';
import { checkAppStatus, notifyStartExam } from './messages/proctorio';

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
    const { exam } = getState().specialExams;
    if (!exam.id) {
      logError('Failed to get exam settings. No exam id.');
      handleAPIError(
        { message: 'Failed to fetch proctoring settings. No exam id was found.' },
        dispatch,
      );
      return;
    }
    try {
      const proctoringSettings = await fetchProctoringSettings(exam.course_id, exam.id);
      dispatch(setProctoringSettings({ proctoringSettings }));
    } catch (error) {
      handleAPIError(error, dispatch);
    }
  };
}

export function examRequiresAccessToken() {
  return async (dispatch, getState) => {
    if (!getConfig().EXAMS_BASE_URL) {
      return;
    }
    const { exam } = getState().specialExams;
    if (!exam.id) {
      logError('Failed to get exam access token. No exam id.');
      return;
    }
    try {
      const examAccessToken = await fetchExamAccessToken(exam.id);
      dispatch(setExamAccessToken({ examAccessToken }));
    } catch (error) {
      logError('Exam access token was not granted.');
    }
  };
}

/**
 * Start a timed exam
 */
export function startTimedExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().specialExams;
    if (!exam.id) {
      logError('Failed to start exam. No exam id.');
      handleAPIError(
        { message: 'Failed to start exam. No exam id was found.' },
        dispatch,
      );
      return;
    }
    await updateAttemptAfter(
      exam.course_id,
      exam.content_id,
      createExamAttempt(exam.id, exam.use_legacy_attempt_api),
    )(dispatch);
  };
}

export function createProctoredExamAttempt() {
  return async (dispatch, getState) => {
    const { exam } = getState().specialExams;
    if (!exam.id) {
      logError('Failed to create exam attempt. No exam id.');
      return;
    }
    await updateAttemptAfter(
      exam.course_id,
      exam.content_id,
      createExamAttempt(exam.id, exam.use_legacy_attempt_api, false, true),
    )(dispatch);
  };
}

/**
 * Start a proctored exam (including onboarding and practice exams)
 */
export function startProctoredExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().specialExams;
    const { attempt } = exam || {};
    if (!exam.id) {
      logError('Failed to start proctored exam. No exam id.');
      return;
    }
    const { desktop_application_js_url: workerUrl } = attempt || {};
    const useWorker = window.Worker && workerUrl;
    const examHasLtiProvider = !exam.useLegacyAttemptApi;

    if (useWorker) {
      const startExamTimeoutMilliseconds = EXAM_START_TIMEOUT_MILLISECONDS;
      workerPromiseForEventNames(actionToMessageTypesMap.start, exam.attempt.desktop_application_js_url)(
        startExamTimeoutMilliseconds,
        attempt.external_id,
      ).then(() => updateAttemptAfter(
        exam.course_id,
        exam.content_id,
        continueAttempt(attempt.attempt_id, attempt.use_legacy_attempt_api),
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
      if (examHasLtiProvider) {
        notifyStartExam();
      }
      await updateAttemptAfter(
        exam.course_id,
        exam.content_id,
        continueAttempt(attempt.attempt_id, attempt.use_legacy_attempt_api),
      )(dispatch);
    }
  };
}

export function skipProctoringExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().specialExams;
    if (!exam.id) {
      logError('Failed to skip proctored exam. No exam id.');
      return;
    }
    const attemptId = exam.attempt.attempt_id;
    const useLegacyAttemptApi = exam.use_legacy_attempt_api;
    if (attemptId) {
      await updateAttemptAfter(
        exam.course_id,
        exam.content_id,
        declineAttempt(attemptId, useLegacyAttemptApi),
      )(dispatch);
    } else {
      await updateAttemptAfter(
        exam.course_id,
        exam.content_id,
        createExamAttempt(exam.id, true, false, useLegacyAttemptApi),
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
    const currentAttempt = getState().specialExams.activeAttempt;

    // If the learner is in a state where they've finished the exam
    // and the attempt can be submitted (i.e. they are "ready_to_submit"),
    // don't ping the proctoring app (which action could move
    // the attempt into an error state).
    if (currentAttempt && currentAttempt.attempt_status === ExamStatus.READY_TO_SUBMIT) {
      return;
    }

    try {
      // TODO: make sure sequenceId pulled here is correct both in-exam-sequence and in outline
      // test w/ timed exam
      const { exam } = getState().specialExams;
      const data = await pollExamAttempt(url, exam.content_id);
      if (!data) {
        throw new Error('Poll Exam failed to fetch.');
      }
      const updatedAttempt = {
        ...currentAttempt,
        time_remaining_seconds: data.time_remaining_seconds,
        attempt_status: data.status,
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
    const { exam, activeAttempt } = getState().specialExams;

    if (!activeAttempt) {
      logError('Failed to stop exam. No active attempt.');
      handleAPIError(
        { message: 'Failed to stop exam. No active attempt was found.' },
        dispatch,
      );
      return;
    }

    const {
      attempt_id: attemptId,
      exam_url_path: examUrl,
      use_legacy_attempt_api: useLegacyAttemptAPI,
    } = activeAttempt;
    if (!exam.attempt || attemptId !== exam.attempt.attempt_id) {
      try {
        await stopAttempt(attemptId, useLegacyAttemptAPI);
        window.location.href = examUrl;
      } catch (error) {
        handleAPIError(error, dispatch);
      }
      return;
    }

    await updateAttemptAfter(exam.course_id, exam.content_id, stopAttempt(attemptId, useLegacyAttemptAPI))(dispatch);
  };
}

export function continueExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().specialExams;
    const attemptId = exam.attempt.attempt_id;
    const useLegacyAttemptAPI = exam.attempt.use_legacy_attempt_api;
    if (!attemptId) {
      logError('Failed to continue exam. No attempt id.');
      handleAPIError(
        { message: 'Failed to continue exam. No attempt id was found.' },
        dispatch,
      );
      return;
    }
    await updateAttemptAfter(
      exam.course_id,
      exam.content_id,
      continueAttempt(attemptId, useLegacyAttemptAPI),
    )(dispatch);
  };
}

export function resetExam() {
  return async (dispatch, getState) => {
    const { exam } = getState().specialExams;
    const attemptId = exam.attempt.attempt_id;
    const useLegacyAttemptAPI = exam.attempt.use_legacy_attempt_api;
    if (!attemptId) {
      logError('Failed to reset exam attempt. No attempt id.');
      handleAPIError(
        { message: 'Failed to reset exam attempt. No attempt id was found.' },
        dispatch,
      );
      return;
    }
    await updateAttemptAfter(exam.course_id, exam.content_id, resetAttempt(attemptId, useLegacyAttemptAPI))(dispatch);
  };
}

export function submitExam() {
  return async (dispatch, getState) => {
    const { exam, activeAttempt } = getState().specialExams;
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

    const {
      attempt_id: attemptId,
      exam_url_path: examUrl,
      use_legacy_attempt_api: useLegacyAttemptAPI,
    } = activeAttempt;
    if (!exam.attempt || attemptId !== exam.attempt.attempt_id) {
      try {
        await submitAttempt(attemptId, useLegacyAttemptAPI);
        window.location.href = examUrl;
        handleBackendProviderSubmission();
      } catch (error) {
        handleAPIError(error, dispatch);
      }
      return;
    }

    await updateAttemptAfter(exam.course_id, exam.content_id, submitAttempt(attemptId, useLegacyAttemptAPI))(dispatch);
    handleBackendProviderSubmission();
  };
}

export function expireExam() {
  return async (dispatch, getState) => {
    const { exam, activeAttempt } = getState().specialExams;
    const {
      desktop_application_js_url: workerUrl,
      attempt_id: attemptId,
      external_id: attemptExternalId,
      use_legacy_attempt_api: useLegacyAttemptAPI,
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

    // this sure looks like a bug
    await updateAttemptAfter(
      activeAttempt.course_id,
      exam.content_id,
      submitAttempt(attemptId, useLegacyAttemptAPI),
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
    const { exam, activeAttempt } = getState().specialExams;
    const useLegacyAttemptAPI = exam.attempt.use_legacy_attempt_api;
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

        // eslint-disable-next-line function-paren-newline
        await updateAttemptAfter(
          exam.course_id,
          exam.content_id,
          endExamWithFailure(activeAttempt.attempt_id, message, useLegacyAttemptAPI),
        )(dispatch);
      });
  };
}

export function startProctoringSoftwareDownload() {
  return async (dispatch, getState) => {
    const { exam } = getState().specialExams;
    const attemptId = exam.attempt.attempt_id;
    const useLegacyAttemptAPI = exam.attempt.use_legacy_attempt_api;
    if (!attemptId) {
      logError('Failed to start downloading proctoring software. No attempt id.');
      handleAPIError(
        { message: 'Failed to start downloading proctoring software. No attempt id was found.' },
        dispatch,
      );
      return;
    }
    await updateAttemptAfter(
      exam.course_id,
      exam.content_id,
      softwareDownloadAttempt(attemptId, useLegacyAttemptAPI),
    )(dispatch);
  };
}

export function getExamReviewPolicy() {
  return async (dispatch, getState) => {
    const { exam } = getState().specialExams;
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

/**
 * Check if we are allowed to enter an exam where proctoring has started.
 * There is no support for reentry with LTI. The exam must be completed
 * in the proctored window. If a non-proctored window is opened, the exam will
 * be ended with an error.
 *
 * This check is necessary to prevent using a second browser to access the exam
 * content unproctored.
 */
export function checkExamEntry() {
  return async (dispatch, getState) => {
    const { exam } = getState().specialExams;
    const useLegacyAttemptAPI = exam.attempt.use_legacy_attempt_api;
    // Check only applies to LTI exams
    if (
      !exam?.attempt
      || exam.attempt.exam_type !== ExamType.PROCTORED
      || exam.attempt.use_legacy_attempt_api
    ) { return; }

    if (IS_PROCTORED_STATUS(exam.attempt.attempt_status)) {
      Promise.race([
        checkAppStatus(),
        new Promise((resolve, reject) => {
          setTimeout(() => reject(), EXAM_START_TIMEOUT_MILLISECONDS);
        }),
      ]).catch(() => {
        dispatch(setApiError({ errorMsg: 'Something has gone wrong with your exam. Proctoring application not detected.' }));
        updateAttemptAfter(exam.course_id, exam.content_id, endExamWithFailure(exam.attempt.attempt_id, 'exam reentry disallowed', useLegacyAttemptAPI))(dispatch);
      });
    }
  };
}
