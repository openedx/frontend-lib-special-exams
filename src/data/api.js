import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { ExamAction } from '../constants';

const BASE_API_URL = '/api/edx_proctoring/v1/proctored_exam/attempt';

async function fetchActiveAttempt() {
  const activeAttemptUrl = new URL(`${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt/latest`);
  const activeAttemptResponse = await getAuthenticatedHttpClient().get(activeAttemptUrl.href);
  return activeAttemptResponse.data;
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
  let data;
  if (!getConfig().EXAMS_BASE_URL) {
    const edxProctoringURL = new URL(
      `${getConfig().LMS_BASE_URL}${url}`,
    );
    const urlResponse = await getAuthenticatedHttpClient().get(edxProctoringURL.href);
    data = urlResponse.data;
  } else {
    data = await fetchActiveAttempt();

    // Update dictionaries returned by edx-exams to have correct status key for legacy compatibility
    if (data.attempt_status) {
      data.status = data.attempt_status;
      delete data.attempt_status;
    }
  }
  return data;
}

export async function createExamAttempt(examId, legacyAttempt, startClock = true, attemptProctored = false) {
  let urlString;
  if (!getConfig().EXAMS_BASE_URL || legacyAttempt) {
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

export async function updateAttemptStatus(attemptId, action, legacyAttempt, detail = null) {
  let urlString;
  if (!getConfig().EXAMS_BASE_URL || legacyAttempt) {
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

export async function stopAttempt(attemptId, legacyAttempt = false) {
  return updateAttemptStatus(attemptId, ExamAction.STOP, legacyAttempt);
}

export async function continueAttempt(attemptId, legacyAttempt = false) {
  return updateAttemptStatus(attemptId, ExamAction.START, legacyAttempt);
}

export async function submitAttempt(attemptId, legacyAttempt = false) {
  return updateAttemptStatus(attemptId, ExamAction.SUBMIT, legacyAttempt);
}

export async function resetAttempt(attemptId, legacyAttempt = false) {
  return updateAttemptStatus(attemptId, ExamAction.RESET, legacyAttempt);
}

export async function endExamWithFailure(attemptId, error, legacyAttempt = false) {
  return updateAttemptStatus(attemptId, ExamAction.ERROR, legacyAttempt, error);
}

export async function softwareDownloadAttempt(attemptId, legacyAttempt = false) {
  return updateAttemptStatus(attemptId, ExamAction.CLICK_DOWNLOAD_SOFTWARE, legacyAttempt);
}

export async function declineAttempt(attemptId, legacyAttempt = false) {
  return updateAttemptStatus(attemptId, ExamAction.DECLINE, legacyAttempt);
}

export async function fetchExamReviewPolicy(examId) {
  const url = new URL(
    `${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/review_policy/exam_id/${examId}/`,
  );
  const { data } = await getAuthenticatedHttpClient().get(url.href);
  return data;
}

export async function fetchProctoringSettings(courseId, examId) {
  let url;
  if (!getConfig().EXAMS_BASE_URL) {
    url = new URL(`${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/settings/exam_id/${examId}/`);
  } else {
    url = new URL(`${getConfig().EXAMS_BASE_URL}/api/v1/exam/provider_settings/course_id/${courseId}/exam_id/${examId}`);
  }
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
