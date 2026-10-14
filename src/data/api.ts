import { ExamAction } from '../constants';
import { generateHumanizedTime } from '../helpers';
import type { HttpClient, SpecialExamsConfig } from '../core/SpecialExamsProvider';
import type {
  AttemptPayload, ExamAccessTokenPayload, ExamPayload, PollPayload, ProctoringSettingsPayload, ReviewPolicyPayload,
} from './types';

export interface ApiServices {
  config: SpecialExamsConfig;
  httpClient: HttpClient;
}

/** The exam and, when one is running, the attempt; an empty object when none is. */
export interface ExamAttemptsResponse {
  exam: ExamPayload;
  active_attempt?: AttemptPayload | Record<string, never>;
}

export interface AttemptActionResponse {
  exam_attempt_id?: number;
  [field: string]: unknown;
}

const BASE_API_URL = '/api/edx_proctoring/v1/proctored_exam/attempt';

type LatestAttemptResponse = AttemptPayload | Record<string, never>;

async function fetchActiveAttempt<T = LatestAttemptResponse>({ config, httpClient }: ApiServices) {
  // fetch 'active' (timer is running) attempt if it exists
  const activeAttemptUrl = new URL(`${config.examsBaseUrl}/api/v1/exams/attempt/latest`);
  const activeAttemptResponse = await httpClient.get<T>(activeAttemptUrl.href);
  return activeAttemptResponse.data;
}

async function fetchAttemptForExamSequnceId<T = LatestAttemptResponse>(
  { config, httpClient }: ApiServices,
  sequenceId: string,
) {
  const attemptUrl = new URL(`${config.examsBaseUrl}/api/v1/exams/attempt/latest`);
  // the calls the same endpoint as fetchActiveAttempt but it behaves slightly different
  // with an exam's section specified. The attempt for that requested exam is always returned
  // even if it is not 'active' (timer is not running)
  attemptUrl.searchParams.append('content_id', sequenceId);
  const attemptResponse = await httpClient.get<T>(attemptUrl.href);
  return attemptResponse.data;
}

export async function fetchExamAttemptsData(
  services: ApiServices,
  courseId?: string,
  sequenceId?: string,
): Promise<ExamAttemptsResponse> {
  const { config, httpClient } = services;
  let data: ExamAttemptsResponse;
  if (!config.examsBaseUrl) {
    const url = new URL(
      `${config.lmsBaseUrl}${BASE_API_URL}/course_id/${courseId}`,
    );
    url.searchParams.append('content_id', String(sequenceId));
    url.searchParams.append('is_learning_mfe', 'true');
    const urlResponse = await httpClient.get<ExamAttemptsResponse>(url.href);
    data = urlResponse.data;
  } else {
    const examUrl = new URL(`${config.examsBaseUrl}/api/v1/student/exam/attempt/course_id/${courseId}/content_id/${sequenceId}`);
    const examResponse = await httpClient.get<ExamAttemptsResponse>(examUrl.href);
    data = examResponse.data;

    // humanize total time if response is from edx-exams
    const totalTime: unknown = data.exam.total_time;
    data.exam.total_time = Number.isInteger(totalTime)
      ? generateHumanizedTime((totalTime as number) * 60)
      : data.exam.total_time;

    const attemptData = await fetchActiveAttempt(services);
    data.active_attempt = attemptData;
  }
  return data;
}

export async function fetchLatestAttempt(services: ApiServices, courseId?: string): Promise<ExamAttemptsResponse> {
  const { config, httpClient } = services;
  let data: ExamAttemptsResponse;
  if (!config.examsBaseUrl) {
    const url = new URL(
      `${config.lmsBaseUrl}${BASE_API_URL}/course_id/${courseId}`,
    );
    url.searchParams.append('is_learning_mfe', 'true');
    const urlResponse = await httpClient.get<ExamAttemptsResponse>(url.href);
    data = urlResponse.data;
  } else {
    // initialize data dictionary to be similar to what edx-proctoring returns
    data = { exam: {} as ExamPayload };

    const attemptData = await fetchActiveAttempt(services);
    data.active_attempt = attemptData;
  }
  return data;
}

export async function pollExamAttempt(
  services: ApiServices,
  pollUrl?: string,
  sequenceId?: string,
): Promise<PollPayload> {
  const { config, httpClient } = services;
  // edx-exams answers with the attempt, whose `attempt_status` is renamed below.
  type PollResponse = PollPayload & { attempt_status?: string };
  let data: PollResponse;

  // sites configured with only edx-proctoring must have pollUrl set
  if (pollUrl) {
    const edxProctoringURL = new URL(
      `${config.lmsBaseUrl}${pollUrl}`,
    );
    const urlResponse = await httpClient.get<PollPayload>(edxProctoringURL.href);
    data = urlResponse.data;

    return data;

  // exams configured with edx-exams expect sequenceId if pollUrl is not set when viewing the exam sequence
  } if (sequenceId) {
    data = await fetchAttemptForExamSequnceId<PollResponse>(services, sequenceId);
  // outside the exam sequence, we can't get the sequenceId easily, so here we just call the last active attempt
  } else {
    data = await fetchActiveAttempt<PollResponse>(services);
  }

  // Update dictionaries returned by edx-exams to have correct status key for legacy compatibility
  if (data.attempt_status) {
    data.status = data.attempt_status;
    delete data.attempt_status;
  }

  return data;
}

export async function createExamAttempt(
  { config, httpClient }: ApiServices,
  examId: number,
  legacyAttempt?: boolean,
  startClock = true,
  attemptProctored = false,
): Promise<AttemptActionResponse> {
  let urlString;
  if (!config.examsBaseUrl || legacyAttempt) {
    urlString = `${config.lmsBaseUrl}${BASE_API_URL}`;
  } else {
    urlString = `${config.examsBaseUrl}/api/v1/exams/attempt`;
  }
  const url = new URL(urlString);
  const payload = {
    exam_id: examId,
    start_clock: startClock.toString(),
    attempt_proctored: attemptProctored.toString(),
  };
  const { data } = await httpClient.post<AttemptActionResponse>(url.href, payload);
  return data;
}

export async function updateAttemptStatus(
  { config, httpClient }: ApiServices,
  attemptId: number,
  action: string,
  legacyAttempt?: boolean,
  detail: string | null = null,
): Promise<AttemptActionResponse> {
  let urlString;
  if (!config.examsBaseUrl || legacyAttempt) {
    urlString = `${config.lmsBaseUrl}${BASE_API_URL}/${attemptId}`;
  } else {
    urlString = `${config.examsBaseUrl}/api/v1/exams/attempt/${attemptId}`;
  }
  const url = new URL(urlString);
  const payload: { action: string; detail?: string } = { action };
  if (detail) {
    payload.detail = detail;
  }
  const { data } = await httpClient.put<AttemptActionResponse>(url.href, payload);
  return data;
}

export async function stopAttempt(services: ApiServices, attemptId: number, legacyAttempt = false) {
  return updateAttemptStatus(services, attemptId, ExamAction.STOP, legacyAttempt);
}

export async function continueAttempt(services: ApiServices, attemptId: number, legacyAttempt = false) {
  return updateAttemptStatus(services, attemptId, ExamAction.START, legacyAttempt);
}

export async function submitAttempt(services: ApiServices, attemptId: number, legacyAttempt = false) {
  return updateAttemptStatus(services, attemptId, ExamAction.SUBMIT, legacyAttempt);
}

export async function resetAttempt(services: ApiServices, attemptId: number, legacyAttempt = false) {
  return updateAttemptStatus(services, attemptId, ExamAction.RESET, legacyAttempt);
}

export async function endExamWithFailure(
  services: ApiServices,
  attemptId: number,
  error: string,
  legacyAttempt = false,
) {
  return updateAttemptStatus(services, attemptId, ExamAction.ERROR, legacyAttempt, error);
}

export async function softwareDownloadAttempt(services: ApiServices, attemptId: number, legacyAttempt = false) {
  return updateAttemptStatus(services, attemptId, ExamAction.CLICK_DOWNLOAD_SOFTWARE, legacyAttempt);
}

export async function declineAttempt(services: ApiServices, attemptId: number, legacyAttempt = false) {
  return updateAttemptStatus(services, attemptId, ExamAction.DECLINE, legacyAttempt);
}

export async function fetchExamReviewPolicy({ config, httpClient }: ApiServices, examId?: number | null) {
  const url = new URL(
    `${config.lmsBaseUrl}/api/edx_proctoring/v1/proctored_exam/review_policy/exam_id/${examId}/`,
  );
  const { data } = await httpClient.get<ReviewPolicyPayload>(url.href);
  return data;
}

export async function fetchProctoringSettings(
  { config, httpClient }: ApiServices,
  courseId?: string,
  examId?: number | null,
) {
  let url;
  if (!config.examsBaseUrl) {
    url = new URL(`${config.lmsBaseUrl}/api/edx_proctoring/v1/proctored_exam/settings/exam_id/${examId}/`);
  } else {
    url = new URL(`${config.examsBaseUrl}/api/v1/exam/provider_settings/course_id/${courseId}/exam_id/${examId}`);
  }
  const { data } = await httpClient.get<ProctoringSettingsPayload>(url.href);
  return data;
}

export async function fetchExamAccessToken({ config, httpClient }: ApiServices, examId?: number | null) {
  const url = new URL(
    `${config.examsBaseUrl}/api/v1/access_tokens/exam_id/${examId}/`,
  );
  const { data } = await httpClient.get<ExamAccessTokenPayload>(url.href);
  return data;
}
