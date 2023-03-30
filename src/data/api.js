import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { ExamAction } from '../constants';

const BASE_API_URL = '/api/edx_proctoring/v1/proctored_exam/attempt';

async function fetchActiveAttempt() {
  const activeAttemptUrl = new URL(`${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt/latest`);
  const activeAttemptResponse = await getAuthenticatedHttpClient().get(activeAttemptUrl.href);
  return activeAttemptResponse.data;
}

/**
 * Converts the given value in minutes to a more human readable format
 * 1 -> 1 Minute
 * 2 -> 2 Minutes
 * 60 -> 1 hour
 * 90 -> 1 hour and 30 Minutes
 * 120 -> 2 hours
 * @param timeInMinutes - The exam time remaining as an integer of minutes
 * @returns - The time remaining as a human-readable string
 */
function humanizedTime(timeInMinutes) {
  const hours = Number.parseInt(timeInMinutes / 60, 10);
  const minutes = timeInMinutes % 60;
  let remainingTime = '';

  if (hours !== 0) {
    remainingTime += `${hours} hour`;
    if (hours >= 2) {
      remainingTime += 's';
    }
    remainingTime += ' and ';
  }
  remainingTime += `${minutes} minute`;
  if (minutes !== 1) {
    remainingTime += 's';
  }

  return remainingTime;
}

/**
 * Generates an accessibility_time_string.
 * @param timeRemainingSeconds -  The exam time remaining as an integer of minutes
 * @returns - An accessibility string for knowing how much time emains in the exam
 */
function generateAccessibilityString(timeRemainingSeconds) {
  const remainingTime = humanizedTime(parseInt(Math.floor(timeRemainingSeconds / 60.0, 0), 10));

  /**
  * INTL NOTE: At the moment, these strings are NOT internationalized/translated.
  * The back-end also does not support this either.
  *
  * It is TBD if this needs to be implemented
  */
  return `you have ${remainingTime} remaining`;
}

export async function fetchExamAttemptsData(courseId, sequenceId) {
  let data;
  if (!getConfig().EXAMS_BASE_URL) {
    const url = new URL(
      `${getConfig().LMS_BASE_URL}${BASE_API_URL}/course_id/${courseId}`,
    );
    url.searchParams.append('content_id', sequenceId);
    url.searchParams.append('is_learning_mfe', true);
    const urlResponse = await getAuthenticatedHttpClient().get(url.href);
    data = urlResponse.data;
  } else {
    const examUrl = new URL(`${getConfig().EXAMS_BASE_URL}/api/v1/student/exam/attempt/course_id/${courseId}/content_id/${sequenceId}`);
    const examResponse = await getAuthenticatedHttpClient().get(examUrl.href);
    data = examResponse.data;

    const attemptData = await fetchActiveAttempt();
    data.active_attempt = attemptData;
  }

  // Only add a11y string if data was received from backend
  if (Object.keys(data.active_attempt).length) {
    const timeRemainingSeconds = data.active_attempt.time_remaining_seconds;
    data.active_attempt.accessibility_time_string = generateAccessibilityString(timeRemainingSeconds);
  }
  return data;
}

export async function fetchLatestAttempt(courseId) {
  let data;
  if (!getConfig().EXAMS_BASE_URL) {
    const url = new URL(
      `${getConfig().LMS_BASE_URL}${BASE_API_URL}/course_id/${courseId}`,
    );
    url.searchParams.append('is_learning_mfe', true);
    const urlResponse = await getAuthenticatedHttpClient().get(url.href);
    data = urlResponse.data;
  } else {
    // initialize data dictionary to be similar to what edx-proctoring returns
    data = { exam: {} };

    const attemptData = await fetchActiveAttempt();
    data.active_attempt = attemptData;
  }

  if (Object.keys(data.active_attempt).length) {
    const timeRemainingSeconds = data.active_attempt.time_remaining_seconds;
    data.active_attempt.accessibility_time_string = generateAccessibilityString(timeRemainingSeconds);
  }
  return data;
}

export async function pollExamAttempt(url) {
  let activeAttemptResponse;
  if (!getConfig().EXAMS_BASE_URL) {
    const edxProctoringURL = new URL(
      `${getConfig().LMS_BASE_URL}${url}`,
    );
    const urlResponse = await getAuthenticatedHttpClient().get(edxProctoringURL.href);
    activeAttemptResponse = urlResponse.activeAttemptResponse;
  } else {
    activeAttemptResponse = await fetchActiveAttempt();

    // Update dictionaries returned by edx-exams to have correct status key for legacy compatibility
    if (activeAttemptResponse.attempt_status) {
      activeAttemptResponse.status = activeAttemptResponse.attempt_status;
      delete activeAttemptResponse.attempt_status;
    }
  }
  if (Object.keys(activeAttemptResponse).length) {
    const timeRemainingSeconds = activeAttemptResponse.time_remaining_seconds;
    activeAttemptResponse.accessibility_time_string = generateAccessibilityString(timeRemainingSeconds);
  }
  return activeAttemptResponse;
}

export async function createExamAttempt(examId, startClock = true, attemptProctored = false) {
  let urlString;
  if (!getConfig().EXAMS_BASE_URL) {
    urlString = `${getConfig().LMS_BASE_URL}${BASE_API_URL}`;
  } else {
    urlString = `${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt`;
  }
  const url = new URL(urlString);
  const payload = {
    exam_id: examId,
    start_clock: startClock.toString(),
    attempt_proctored: attemptProctored.toString(),
  };
  const { data } = await getAuthenticatedHttpClient().post(url.href, payload);
  return data;
}

export async function updateAttemptStatus(attemptId, action, detail = null) {
  let urlString;
  if (!getConfig().EXAMS_BASE_URL) {
    urlString = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/${attemptId}`;
  } else {
    urlString = `${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt/${attemptId}`;
  }
  const url = new URL(urlString);
  const payload = { action };
  if (detail) {
    payload.detail = detail;
  }
  const { data } = await getAuthenticatedHttpClient().put(url.href, payload);
  return data;
}

export async function stopAttempt(attemptId) {
  return updateAttemptStatus(attemptId, ExamAction.STOP);
}

export async function continueAttempt(attemptId) {
  return updateAttemptStatus(attemptId, ExamAction.START);
}

export async function submitAttempt(attemptId) {
  return updateAttemptStatus(attemptId, ExamAction.SUBMIT);
}

export async function resetAttempt(attemptId) {
  return updateAttemptStatus(attemptId, ExamAction.RESET);
}

export async function endExamWithFailure(attemptId, error) {
  return updateAttemptStatus(attemptId, ExamAction.ERROR, error);
}

export async function softwareDownloadAttempt(attemptId) {
  return updateAttemptStatus(attemptId, ExamAction.CLICK_DOWNLOAD_SOFTWARE);
}

export async function declineAttempt(attemptId) {
  return updateAttemptStatus(attemptId, ExamAction.DECLINE);
}

export async function fetchExamReviewPolicy(examId) {
  const url = new URL(
    `${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/review_policy/exam_id/${examId}/`,
  );
  const { data } = await getAuthenticatedHttpClient().get(url.href);
  return data;
}

export async function fetchProctoringSettings(examId) {
  const url = new URL(`${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/settings/exam_id/${examId}/`);
  const { data } = await getAuthenticatedHttpClient().get(url.href);
  return data;
}

export async function fetchExamAccessToken(examId) {
  const url = new URL(
    `${getConfig().EXAMS_BASE_URL}/api/v1/access_tokens/exam_id/${examId}/`,
  );
  const { data } = await getAuthenticatedHttpClient().get(url.href);
  return data;
}
