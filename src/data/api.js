import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { ExamAction } from '../constants';

const BASE_API_URL = '/api/edx_proctoring/v1/proctored_exam/attempt';

async function fetchActiveAttempt() {
  const activeAttemptUrl = new URL(`${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt/latest`);
  const activeAttemptResponse = await getAuthenticatedHttpClient().get(activeAttemptUrl.href);
  return activeAttemptResponse.data.attempt;
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
  return data;
}

//
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
  return data;
}

export async function pollExamAttempt(url) {
  const { data } = await getAuthenticatedHttpClient().get(`${getConfig().LMS_BASE_URL}${url}`);
  return data;
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
    urlString = `${getConfig().EXAMS_BASE_URL}/api/v1/attempt/${attemptId}`;
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
