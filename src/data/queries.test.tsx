import React from 'react';
import { Factory } from 'rosie';
import MockAdapter from 'axios-mock-adapter';
import {
  act, configure, renderHook, waitFor,
} from '@testing-library/react';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  activeAttemptQueryOptions,
  examQueryOptions,
  specialExamsQueryKeys,
  useAccessTokenQuery,
  useCheckExamEntry,
  useExamQuery,
  usePingAttempt,
  usePollQuery,
  withPolledAttempt,
  useProctoringSettingsQuery,
  useReportQueryError,
  useReviewPolicyQuery,
} from './queries';
import { useEndExamWithFailure } from './mutations';
import {
  createTestQueryClient, createTestSequenceExam, httpClient, initializeMockApp, testConfig, testServices,
} from '../setupTest';
import { ExamStatus, ExamType } from '../constants';
import type { SequenceExamIdentity } from '../core/SequenceExamContext';
import type { ExamState } from './types';
import SpecialExamsProvider, { type SpecialExamsServices } from '../core/SpecialExamsProvider';

const BASE_API_URL = '/api/edx_proctoring/v1/proctored_exam/attempt';

const { loggingService } = initializeMockApp();
const axiosMock = new MockAdapter(httpClient);

jest.mock('./messages/handlers', () => ({
  ...jest.requireActual('./messages/handlers'),
  pingApplication: jest.fn(() => Promise.reject(Error('test error'))),
}));

describe('Exam queries', () => {
  const exam = Factory.build('exam', { attempt: Factory.build('attempt') });
  const { course_id: courseId, content_id: contentId, attempt } = exam;
  const fetchExamAttemptsDataLegacyUrl = `${testConfig.lmsBaseUrl}${BASE_API_URL}/course_id/${courseId}`
    + `?content_id=${encodeURIComponent(contentId)}&is_learning_mfe=true`;
  const fetchLatestAttemptLegacyUrl = `${testConfig.lmsBaseUrl}${BASE_API_URL}/course_id/${courseId}?is_learning_mfe=true`;
  const fetchProctoringSettingsLegacyUrl = `${testConfig.lmsBaseUrl}/api/edx_proctoring/v1/proctored_exam/settings/exam_id/${exam.id}/`;

  const createUpdateAttemptURL = `${testConfig.examsBaseUrl}/api/v1/exams/attempt`;
  const fetchExamAttemptsDataUrl = `${testConfig.examsBaseUrl}/api/v1/student/exam/attempt/course_id/${courseId}/content_id/${contentId}`;
  const latestAttemptURL = `${testConfig.examsBaseUrl}/api/v1/exams/attempt/latest`;
  const fetchProctoringSettingsUrl = `${testConfig.examsBaseUrl}/api/v1/exam/provider_settings/course_id/${courseId}/exam_id/${exam.id}`;
  const examKey = specialExamsQueryKeys.exam(courseId, contentId);
  const inSequence: SequenceExamIdentity = { courseId, sequenceId: contentId, isTimeLimited: true };

  let clientState: () => { timeIsOver: boolean; apiErrorMsg: string };
  let queryClient: QueryClient;
  let services: SpecialExamsServices;

  const initWithExamAttempt = async (testExam = exam, testAttempt = attempt) => {
    axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: testExam });
    axiosMock.onGet(latestAttemptURL).reply(200, testAttempt);
    return queryClient.fetchQuery(examQueryOptions(services, courseId, contentId));
  };
  const examState = () => queryClient.getQueryData<ExamState>(examKey);

  function renderIn<T>(useHook: () => T, sequenceExam: SequenceExamIdentity = inSequence) {
    const testSequenceExam = createTestSequenceExam(sequenceExam);
    clientState = testSequenceExam.clientState;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SpecialExamsProvider {...services}>
        <QueryClientProvider client={queryClient}>
          <testSequenceExam.SequenceExamProvider>{children}</testSequenceExam.SequenceExamProvider>
        </QueryClientProvider>
      </SpecialExamsProvider>
    );
    return renderHook(useHook, { wrapper });
  }
  // An owner observer plus the error report, as `ExamWrapper` / `Exam` mount them.
  const renderOwner = <T extends { error: unknown }>(useOwner: () => T) => renderIn(() => {
    const query = useOwner();
    useReportQueryError(query);
    return query;
  });

  beforeEach(() => {
    services = testServices;
    axiosMock.reset();
    loggingService.logError.mockReset();
    queryClient = createTestQueryClient();
  });

  describe('the exam query', () => {
    it('fetches the exam and the running attempt together', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam });
      axiosMock.onGet(latestAttemptURL).replyOnce(200, attempt);

      const state = await queryClient.fetchQuery(examQueryOptions(services, courseId, contentId));

      expect(state.exam).toMatchObject({ id: exam.id, content_id: contentId });
      expect(state.activeAttempt).toMatchObject({ attempt_id: attempt.attempt_id, attempt_status: ExamStatus.STARTED });
    });

    it('stores an empty running attempt as null', async () => {
      const state = await initWithExamAttempt(exam, {});
      expect(state.activeAttempt).toBeNull();
    });

    it('humanizes an edx-exams integer total time', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam: { ...exam, total_time: 30 } });
      axiosMock.onGet(latestAttemptURL).replyOnce(200, attempt);

      const state = await queryClient.fetchQuery(examQueryOptions(services, courseId, contentId));

      expect(state.exam.total_time).toBe('30 minutes');
    });

    it('surfaces a failed fetch as the page error', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).networkError();

      const { result } = renderOwner(() => useExamQuery(courseId, contentId));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(clientState().apiErrorMsg).toBe('Network Error');
    });
  });

  describe('the active-attempt query', () => {
    it('fetches the course-level attempt on edx-proctoring', async () => {
      services = { ...testServices, config: { ...testConfig, examsBaseUrl: null } };
      axiosMock.onGet(fetchLatestAttemptLegacyUrl).reply(200, { exam: {}, active_attempt: attempt });

      const state = await queryClient.fetchQuery(activeAttemptQueryOptions(services, courseId));

      expect(state.activeAttempt).toMatchObject({ attempt_id: attempt.attempt_id, attempt_status: ExamStatus.STARTED });
      expect(axiosMock.history.get[0].url).toBe(fetchLatestAttemptLegacyUrl);
    });

    it('fetches the latest attempt on edx-exams', async () => {
      axiosMock.onGet(latestAttemptURL).reply(200, Factory.build('attempt', { attempt_id: 1234 }));

      const state = await queryClient.fetchQuery(activeAttemptQueryOptions(services, courseId));

      expect(state.activeAttempt?.attempt_id).toBe(1234);
      expect(state.exam).toEqual({});
    });
  });

  describe('the proctoring-settings query', () => {
    const proctoringSettings = Factory.build('proctoringSettings', { provider_name: 'Mock Provider' });

    it('fetches from edx-proctoring when there is no EXAMS_BASE_URL', async () => {
      services = { ...testServices, config: { ...testConfig, examsBaseUrl: null } };
      axiosMock.onGet(fetchProctoringSettingsLegacyUrl).reply(200, proctoringSettings);

      const { result } = renderOwner(() => useProctoringSettingsQuery(courseId, exam.id, { enabled: true }));

      await waitFor(() => expect(result.current.data?.provider_name).toBe('Mock Provider'));
      expect(axiosMock.history.get[0].url).toBe(fetchProctoringSettingsLegacyUrl);
    });

    it('fetches from edx-exams', async () => {
      axiosMock.onGet(fetchProctoringSettingsUrl).reply(200, proctoringSettings);

      const { result } = renderOwner(() => useProctoringSettingsQuery(courseId, exam.id, { enabled: true }));

      await waitFor(() => expect(result.current.data?.provider_name).toBe('Mock Provider'));
    });

    it('renders the empty defaults until the fetch lands', () => {
      axiosMock.onGet(fetchProctoringSettingsUrl).reply(200, proctoringSettings);

      const { result } = renderOwner(() => useProctoringSettingsQuery(courseId, exam.id, { enabled: true }));

      expect(result.current.data).toMatchObject({ provider_name: '', exam_proctoring_backend: { instructions: [] } });
    });

    it('surfaces a failed fetch as the page error', async () => {
      axiosMock.onGet(fetchProctoringSettingsUrl).networkError();

      const { result } = renderOwner(() => useProctoringSettingsQuery(courseId, exam.id, { enabled: true }));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(clientState().apiErrorMsg).toBe('Network Error');
    });
  });

  describe('the review-policy query', () => {
    const reviewPolicyUrl = `${testConfig.lmsBaseUrl}/api/edx_proctoring/v1/proctored_exam/review_policy/exam_id/${exam.id}/`;

    it('fetches the policy', async () => {
      axiosMock.onGet(reviewPolicyUrl).reply(200, { review_policy: 'Example review policy.' });

      const { result } = renderOwner(() => useReviewPolicyQuery(exam.id));

      await waitFor(() => expect(result.current.data?.review_policy).toBe('Example review policy.'));
    });

    it('surfaces a failed fetch as the page error', async () => {
      axiosMock.onGet(reviewPolicyUrl).networkError();

      const { result } = renderOwner(() => useReviewPolicyQuery(exam.id));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(clientState().apiErrorMsg).toBe('Network Error');
    });

    it('does not fetch without an exam id', () => {
      const { result } = renderOwner(() => useReviewPolicyQuery(null));

      expect(result.current.fetchStatus).toBe('idle');
      expect(axiosMock.history.get).toHaveLength(0);
    });
  });

  describe('the access-token query', () => {
    const accessTokenUrl = `${testConfig.examsBaseUrl}/api/v1/access_tokens/exam_id/${exam.id}/`;

    it('does not fetch when there is no EXAMS_BASE_URL', () => {
      services = { ...testServices, config: { ...testConfig, examsBaseUrl: null } };

      const { result } = renderIn(() => useAccessTokenQuery(exam.id));

      expect(result.current.fetchStatus).toBe('idle');
      expect(axiosMock.history.get).toHaveLength(0);
    });

    it('does not fetch without an exam id', () => {
      const { result } = renderIn(() => useAccessTokenQuery(null));

      expect(result.current.fetchStatus).toBe('idle');
      expect(axiosMock.history.get).toHaveLength(0);
    });

    it('fetches the token', async () => {
      axiosMock.onGet(accessTokenUrl).reply(200, Factory.build('examAccessToken', { exam_access_token: 'TOKEN' }));

      const { result } = renderIn(() => useAccessTokenQuery(exam.id));

      await waitFor(() => expect(result.current.data?.exam_access_token).toBe('TOKEN'));
    });

    it('reports a refused token as an error', async () => {
      axiosMock.onGet(accessTokenUrl).reply(400, { detail: 'Exam access token not granted' });

      const { result } = renderIn(() => useAccessTokenQuery(exam.id));

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('does not refetch the token when the network reconnects', async () => {
      axiosMock.onGet(accessTokenUrl).reply(200, Factory.build('examAccessToken'));
      const { result } = renderIn(() => useAccessTokenQuery(exam.id));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      act(() => { onlineManager.setOnline(false); });
      // The client refetches on reconnect after resuming paused mutations, asynchronously.
      await act(async () => {
        onlineManager.setOnline(true);
        await new Promise((resolve) => { setTimeout(resolve, 0); });
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(axiosMock.history.get).toHaveLength(1);
    });
  });

  describe('the poll', () => {
    const pollReply = {
      time_remaining_seconds: 1739.9,
      accessibility_time_string: 'you have 29 minutes remaining',
      attempt_status: ExamStatus.STARTED,
    };

    it('polls the attempt URL on edx-proctoring and writes the reply over the attempt', async () => {
      services = { ...testServices, config: { ...testConfig, examsBaseUrl: null } };
      const pollUrl = `${testConfig.lmsBaseUrl}${attempt.exam_started_poll_url}`;
      axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam, active_attempt: attempt });
      axiosMock.onGet(pollUrl).reply(200, { ...pollReply, status: ExamStatus.STARTED });
      await queryClient.fetchQuery(examQueryOptions(services, courseId, contentId));

      renderIn(() => usePollQuery(true));

      await waitFor(() => expect(examState()?.activeAttempt?.time_remaining_seconds).toBe(1739.9));
      expect(axiosMock.history.get[1].url).toBe(pollUrl);
      expect(examState()?.activeAttempt?.attempt_status).toBe(ExamStatus.STARTED);
    });

    // edx-exams attempts carry no poll URL; the poll asks for the sequence's latest attempt instead.
    const ltiAttempt = Factory.build('attempt', { exam_started_poll_url: null });

    it('polls the latest attempt for the sequence on edx-exams', async () => {
      await initWithExamAttempt(exam, ltiAttempt);
      axiosMock.resetHistory();
      const attemptToPollURL = `${latestAttemptURL}?content_id=${encodeURIComponent(contentId)}`;
      axiosMock.onGet(attemptToPollURL).reply(200, pollReply);

      renderIn(() => usePollQuery(true));

      await waitFor(() => expect(examState()?.activeAttempt?.time_remaining_seconds).toBe(1739.9));
      expect(axiosMock.history.get[0].url).toBe(attemptToPollURL);
    });

    it('ends the exam and refreshes it when the polled attempt has ended in error', async () => {
      const errorAttempt = Factory.build('attempt', { attempt_status: ExamStatus.ERROR });
      const errorExam = Factory.build('exam', { attempt: errorAttempt });
      await initWithExamAttempt(exam, ltiAttempt);
      const attemptToPollURL = `${latestAttemptURL}?content_id=${encodeURIComponent(contentId)}`;
      axiosMock.onGet(attemptToPollURL)
        .reply(200, { ...pollReply, time_remaining_seconds: 0, attempt_status: ExamStatus.ERROR });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: errorExam, active_attempt: {} });
      axiosMock.resetHistory();

      renderIn(() => {
        useExamQuery(courseId, contentId); // the owner the refresh re-fetches through
        usePollQuery(true);
      });

      await waitFor(() => expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.ERROR));
      expect(clientState().timeIsOver).toBe(true);
      expect(axiosMock.history.get[0].url).toBe(attemptToPollURL);
      expect(axiosMock.history.get[1].url).toBe(fetchExamAttemptsDataUrl);
    });

    it('polls again every minute while the exam runs', async () => {
      await initWithExamAttempt(exam, ltiAttempt);
      axiosMock.resetHistory();
      const attemptToPollURL = `${latestAttemptURL}?content_id=${encodeURIComponent(contentId)}`;
      axiosMock.onGet(attemptToPollURL).reply(200, pollReply);
      jest.useFakeTimers();

      const { unmount } = renderIn(() => usePollQuery(true));

      await waitFor(() => expect(axiosMock.history.get).toHaveLength(1));
      await act(async () => { await jest.advanceTimersByTimeAsync(60_000); });
      expect(axiosMock.history.get).toHaveLength(2);
      await act(async () => { await jest.advanceTimersByTimeAsync(60_000); });
      expect(axiosMock.history.get).toHaveLength(3);
      unmount();
      // Nothing may stay queued on the fake clock when it goes away (React schedules through it here).
      await act(async () => { await jest.runOnlyPendingTimersAsync(); });
      jest.useRealTimers();
    });

    it('does not poll an attempt that is ready to submit', async () => {
      const readyAttempt = Factory.build('attempt', { attempt_status: ExamStatus.READY_TO_SUBMIT });
      await initWithExamAttempt(Factory.build('exam', { attempt: readyAttempt }), readyAttempt);
      axiosMock.resetHistory();

      const { result } = renderIn(() => usePollQuery(true));

      expect(result.current).toBeUndefined();
      expect(axiosMock.history.get).toHaveLength(0);
    });
  });

  describe('withPolledAttempt', () => {
    const reply = { status: ExamStatus.READY_TO_SUBMIT, time_remaining_seconds: 42 };

    it('writes the polled remaining time and status over the attempt', () => {
      const state: ExamState = { exam, activeAttempt: attempt };

      expect(withPolledAttempt(reply)(state)).toEqual({
        exam,
        activeAttempt: { ...attempt, time_remaining_seconds: 42, attempt_status: ExamStatus.READY_TO_SUBMIT },
      });
    });

    it('leaves an empty cache entry empty', () => {
      expect(withPolledAttempt(reply)(undefined)).toBeUndefined();
    });
  });

  describe('the ping', () => {
    it('ends the attempt with an error when the proctoring app does not answer', async () => {
      const startedWorkerAttempt = Factory.build('attempt', {
        attempt_status: ExamStatus.STARTED, desktop_application_js_url: 'http://proctortest.com',
      });
      const startedWorkerExam = Factory.build('exam', { attempt: startedWorkerAttempt });
      await initWithExamAttempt(startedWorkerExam, startedWorkerAttempt);
      axiosMock.onPut(`${createUpdateAttemptURL}/${startedWorkerAttempt.attempt_id}`)
        .reply(200, { exam_attempt_id: startedWorkerAttempt.attempt_id });

      const { result } = renderIn(() => usePingAttempt(useEndExamWithFailure()));
      await act(async () => { await result.current(5, 'http://proctortest.com'); });

      await waitFor(() => expect(axiosMock.history.put).toHaveLength(1));
      expect(loggingService.logError).toHaveBeenCalledWith('test error', {
        attemptId: startedWorkerAttempt.attempt_id,
        attemptStatus: startedWorkerAttempt.attempt_status,
        courseId: startedWorkerAttempt.course_id,
        examId: startedWorkerExam.id,
      });
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'error', detail: 'test error' }));
    });
  });

  describe('the entry check', () => {
    const proctoredAttempt = Factory.build('attempt', { attempt_status: ExamStatus.READY_TO_START, exam_type: ExamType.PROCTORED });
    const proctoredExam = Factory.build('exam', { type: ExamType.PROCTORED, attempt: proctoredAttempt });
    let postMessage: jest.SpyInstance;

    const renderCheck = (data: ExamState | undefined, isFetchedAfterMount = true) => renderIn(
      () => useCheckExamEntry({ data, isFetchedAfterMount }, useEndExamWithFailure()),
    );
    const answer = (active: boolean) => act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { active }, origin: testConfig.examsBaseUrl }));
    });

    beforeEach(() => {
      configure({ reactStrictMode: true });
      postMessage = jest.spyOn(window, 'postMessage').mockImplementation(() => {});
    });

    afterEach(async () => {
      // A probe nobody answered keeps its listener; answer it so it cannot act in a later test.
      await answer(true);
      postMessage.mockRestore();
      configure({ reactStrictMode: false });
    });

    it('probes the proctoring app for an LTI proctored exam in a proctored state', () => {
      renderCheck({ exam: proctoredExam, activeAttempt: proctoredAttempt });
      expect(postMessage).toHaveBeenCalledWith(['proctorio_status'], '*');
    });

    it('waits for the fetch to finish before probing', () => {
      renderCheck({ exam: proctoredExam, activeAttempt: proctoredAttempt }, false);
      expect(postMessage).not.toHaveBeenCalled();
    });

    it('does not probe for a legacy proctored exam', () => {
      const legacyAttempt = { ...proctoredAttempt, use_legacy_attempt_api: true };
      renderCheck({ exam: { ...proctoredExam, attempt: legacyAttempt }, activeAttempt: legacyAttempt });
      expect(postMessage).not.toHaveBeenCalled();
    });

    it('does not probe an attempt that is not in a proctored state', () => {
      const createdAttempt = Factory.build('attempt', { attempt_status: ExamStatus.CREATED, exam_type: ExamType.PROCTORED });
      renderCheck({ exam: Factory.build('exam', { attempt: createdAttempt }), activeAttempt: createdAttempt });
      expect(postMessage).not.toHaveBeenCalled();
    });

    it('does not probe a timed exam', () => {
      renderCheck({ exam, activeAttempt: attempt });
      expect(postMessage).not.toHaveBeenCalled();
    });

    it('ends the attempt with an error when the app says it is not active', async () => {
      axiosMock.onPut(`${createUpdateAttemptURL}/${proctoredAttempt.attempt_id}`)
        .reply(200, { exam_attempt_id: proctoredAttempt.attempt_id });
      renderCheck({ exam: proctoredExam, activeAttempt: proctoredAttempt });

      await answer(false);

      await waitFor(() => expect(axiosMock.history.put).toHaveLength(1));
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'error', detail: 'exam reentry disallowed' }));
      expect(clientState().apiErrorMsg).toBe('Something has gone wrong with your exam. Proctoring application not detected.');
    });

    it('ends the attempt with an error when the app does not answer within 5 s', async () => {
      jest.useFakeTimers();
      axiosMock.onPut(`${createUpdateAttemptURL}/${proctoredAttempt.attempt_id}`)
        .reply(200, { exam_attempt_id: proctoredAttempt.attempt_id });
      renderCheck({ exam: proctoredExam, activeAttempt: proctoredAttempt });

      await act(async () => { await jest.advanceTimersByTimeAsync(5000); });
      jest.useRealTimers();

      await waitFor(() => expect(axiosMock.history.put).toHaveLength(1));
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'error', detail: 'exam reentry disallowed' }));
    });

    it('leaves the attempt alone when the sequence unmounts before the app answers', async () => {
      const { unmount } = renderCheck({ exam: proctoredExam, activeAttempt: proctoredAttempt });

      unmount();
      await answer(false);
      await new Promise(process.nextTick);

      expect(axiosMock.history.put).toHaveLength(0);
    });

    it('leaves the attempt alone when the sequence unmounts before the probe times out', async () => {
      jest.useFakeTimers();
      const { unmount } = renderCheck({ exam: proctoredExam, activeAttempt: proctoredAttempt });

      unmount();
      await act(async () => { await jest.advanceTimersByTimeAsync(5000); });
      jest.useRealTimers();

      expect(axiosMock.history.put).toHaveLength(0);
    });

    it('leaves the attempt alone when the app says it is active', async () => {
      renderCheck({ exam: proctoredExam, activeAttempt: proctoredAttempt });

      await answer(true);
      await new Promise(process.nextTick);

      expect(axiosMock.history.put).toHaveLength(0);
      expect(clientState().apiErrorMsg).toBe('');
    });
  });
});
