import React from 'react';
import { Factory } from 'rosie';
import MockAdapter from 'axios-mock-adapter';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useIsMutating } from '@tanstack/react-query';
import { Provider } from 'react-redux';

import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig, mergeConfig } from '@edx/frontend-platform';

import {
  activeAttemptQueryOptions, examQueryOptions, specialExamsQueryKeys, useActiveAttemptQuery, useExamQuery,
} from './queries';
import {
  useContinueExam,
  useCreateProctoredExamAttempt,
  useExpireExam,
  useResetExam,
  useSkipProctoringExam,
  useStartProctoredExam,
  useStartTimedExam,
  useStopExam,
  useSubmitExam,
  specialExamsMutationKey,
} from './mutations';
import {
  createTestQueryClient, initializeMockApp, initializeTestConfig, initializeTestStore,
} from '../setupTest';
import { ExamStatus } from '../constants';
import SequenceExamContext, { type SequenceExam } from '../core/SequenceExamContext';
import type { ExamState } from './types';

const BASE_API_URL = '/api/edx_proctoring/v1/proctored_exam/attempt';

const { loggingService } = initializeMockApp();
const axiosMock = new MockAdapter(getAuthenticatedHttpClient());

// Mock for worker failure
const mockPromise = jest.fn(() => Promise.reject(Error('test error')));
jest.mock('./messages/handlers', () => ({
  ...jest.requireActual('./messages/handlers'),
  workerPromiseForEventNames: jest.fn(() => mockPromise),
}));

describe('Attempt action mutations', () => {
  const exam = Factory.build('exam', { attempt: Factory.build('attempt') });
  const { course_id: courseId, content_id: contentId, attempt } = exam;
  const fetchExamAttemptsDataLegacyUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/course_id/${courseId}`
    + `?content_id=${encodeURIComponent(contentId)}&is_learning_mfe=true`;
  const updateAttemptStatusLegacyUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/${attempt.attempt_id}`;
  const createExamAttemptLegacyUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}`;

  const createUpdateAttemptURL = `${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt`;
  const fetchExamAttemptsDataUrl = `${getConfig().EXAMS_BASE_URL}/api/v1/student/exam/attempt/course_id/${courseId}/content_id/${contentId}`;
  const latestAttemptURL = `${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt/latest`;
  let store: ReturnType<typeof initializeTestStore>;
  let queryClient: QueryClient;
  const sequenceExam = { courseId, sequenceId: contentId, isTimeLimited: true };

  const initWithExamAttempt = async (testExam = exam, testAttempt = attempt) => {
    axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: testExam });
    axiosMock.onGet(latestAttemptURL).reply(200, testAttempt);
    await queryClient.fetchQuery(examQueryOptions(courseId, contentId));
  };
  const initLegacy = async () => {
    await queryClient.fetchQuery(examQueryOptions(courseId, contentId));
  };

  // Renders the hook under the exam's context, beside the owner observer the wrapper mounts in the
  // app, so an invalidation after the action re-fetches as it does there.
  function renderAction<T>(useAction: () => T, context: SequenceExam = sequenceExam) {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <SequenceExamContext.Provider value={context}>{children}</SequenceExamContext.Provider>
        </QueryClientProvider>
      </Provider>
    );
    return renderHook(() => {
      // The owner `ExamWrapper` mounts: the sequence's exam, or the course's attempt outside an exam.
      useExamQuery(courseId, contentId, { enabled: !!context.isTimeLimited });
      useActiveAttemptQuery(courseId, { enabled: !context.isTimeLimited });
      return useAction();
    }, { wrapper });
  }
  // Runs the action and resolves once its request and the refetch after it have settled.
  const runAction = async (useAction: () => { mutateAsync: () => Promise<unknown> }) => {
    const { result } = renderAction(useAction);
    await act(async () => {
      await result.current.mutateAsync();
    });
  };
  const examState = () => queryClient.getQueryData<ExamState>(specialExamsQueryKeys.exam(courseId, contentId));
  // The slice is JavaScript, so its state type is inferred from the initial values.
  const clientState = () => store.getState().specialExams as { apiErrorMsg: string; timeIsOver: boolean };
  const startedAttempt = (attemptId: number) => ({ attempt_id: attemptId, attempt_status: ExamStatus.STARTED });
  // Global stubs register their undo here so a failed assertion cannot leak them into the next test.
  const cleanups: Array<() => void> = [];
  const stubLocation = () => {
    const original = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { href: '' } });
    cleanups.push(() => Object.defineProperty(window, 'location', { configurable: true, value: original }));
  };
  // jsdom has no Worker; the worker itself is mocked above, the hooks only check that one exists.
  const withWorker = () => {
    Object.defineProperty(window, 'Worker', { configurable: true, value: jest.fn() });
    cleanups.push(() => { delete (window as { Worker?: unknown }).Worker; });
  };
  // jsdom's `window.top` is the window itself.
  const spyPostMessage = () => {
    const spy = jest.spyOn(window, 'postMessage').mockImplementation(() => {});
    cleanups.push(() => spy.mockRestore());
    return spy;
  };

  beforeEach(() => {
    initializeTestConfig();
    axiosMock.reset();
    loggingService.logError.mockReset();
    loggingService.logInfo.mockReset();
    store = initializeTestStore();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    cleanups.splice(0).reverse().forEach((undo) => undo());
  });

  describe('specialExamsMutationKey', () => {
    it('counts an action as mutating from the call until the refetch after it has landed', async () => {
      await initWithExamAttempt(exam, {});
      let release: () => void = () => {};
      axiosMock.onPost(createUpdateAttemptURL).reply(() => new Promise((resolve) => {
        release = () => resolve([200, { exam_attempt_id: attempt.attempt_id }]);
      }));
      axiosMock.onGet(latestAttemptURL).reply(200, attempt);

      const { result } = renderAction(() => ({
        start: useStartTimedExam(),
        pending: useIsMutating({ mutationKey: specialExamsMutationKey }) > 0,
      }));
      expect(result.current.pending).toBe(false);
      act(() => result.current.start.mutate());
      await waitFor(() => expect(result.current.pending).toBe(true));
      await waitFor(() => expect(axiosMock.history.post).toHaveLength(1));
      expect(result.current.pending).toBe(true);
      release();
      await waitFor(() => expect(result.current.pending).toBe(false));
      expect(examState()?.activeAttempt).toMatchObject(startedAttempt(attempt.attempt_id));
    });
  });

  describe('useStartTimedExam', () => {
    describe('with edx-proctoring as a backend (no EXAMS_BASE_URL)', () => {
      beforeEach(() => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should create and start exam', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam, active_attempt: {} });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam, active_attempt: attempt });
        axiosMock.onPost(createExamAttemptLegacyUrl).reply(200, { exam_attempt_id: attempt.attempt_id });

        await initLegacy();
        expect(examState()?.activeAttempt).toBeNull();

        await runAction(useStartTimedExam);
        expect(examState()?.activeAttempt).toMatchObject(startedAttempt(attempt.attempt_id));
        expect(axiosMock.history.post[0].data).toEqual(JSON.stringify({
          exam_id: exam.id,
          start_clock: 'true',
          attempt_proctored: 'false',
        }));
      });
    });

    it('Should create and start exam', async () => {
      await initWithExamAttempt(exam, {});

      axiosMock.onGet(latestAttemptURL).reply(200, attempt);
      axiosMock.onPost(createUpdateAttemptURL).reply(200, { exam_attempt_id: attempt.attempt_id });

      await runAction(useStartTimedExam);
      expect(examState()?.activeAttempt).toMatchObject(startedAttempt(attempt.attempt_id));
      expect(axiosMock.history.post[0].data).toEqual(JSON.stringify({
        exam_id: exam.id,
        start_clock: 'true',
        attempt_proctored: 'false',
      }));
    });

    it('Should use legacy endpoint if use_legacy_attempt_api set on exam', async () => {
      const legacyExam = Factory.build('exam', { use_legacy_attempt_api: true });
      await initWithExamAttempt(legacyExam, {});
      axiosMock.onPost(createExamAttemptLegacyUrl).reply(200, { exam_attempt_id: attempt.attempt_id });
      await runAction(useStartTimedExam);
      expect(axiosMock.history.post[0].url).toEqual(createExamAttemptLegacyUrl);
    });

    it('Should fail to fetch if no exam id', async () => {
      axiosMock.onPost(createUpdateAttemptURL).reply(200, { exam_attempt_id: attempt.attempt_id });

      await runAction(useStartTimedExam);

      expect(axiosMock.history.post).toHaveLength(0);
      expect(loggingService.logError).toHaveBeenCalled();
      expect(clientState().apiErrorMsg).toBe('Failed to start exam. No exam id was found.');
    });
  });

  describe('useStopExam', () => {
    const readyToSubmitAttempt = Factory.build('attempt', { attempt_status: ExamStatus.READY_TO_SUBMIT });
    const readyToSubmitExam = Factory.build('exam', { attempt: readyToSubmitAttempt });

    describe('with edx-proctoring as a backend (no EXAMS_BASE_URL)', () => {
      beforeEach(() => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should stop exam, and update attempt', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam, active_attempt: attempt });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam: readyToSubmitExam, active_attempt: {} });
        axiosMock.onPut(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: readyToSubmitAttempt.attempt_id });

        await initLegacy();
        expect(examState()?.activeAttempt?.attempt_status).toBe(ExamStatus.STARTED);

        await runAction(useStopExam);
        expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.READY_TO_SUBMIT);
        expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusLegacyUrl);
        expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'stop' }));
      });

      it('Should stop exam, and redirect to sequence if not in exam section', async () => {
        stubLocation();

        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam: {}, active_attempt: attempt });
        axiosMock.onPut(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: readyToSubmitAttempt.attempt_id });

        await initLegacy();
        expect(examState()?.activeAttempt?.attempt_status).toBe(ExamStatus.STARTED);

        await runAction(useStopExam);
        expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusLegacyUrl);
        expect(window.location.href).toEqual(attempt.exam_url_path);
        expect(axiosMock.history.get).toHaveLength(1); // no refetch
      });
    });

    it('Should stop exam, and update attempt', async () => {
      await initWithExamAttempt();
      expect(examState()?.activeAttempt?.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onPut(`${createUpdateAttemptURL}/${readyToSubmitAttempt.attempt_id}`)
        .reply(200, { exam_attempt_id: readyToSubmitAttempt.attempt_id });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: readyToSubmitExam });
      axiosMock.onGet(latestAttemptURL).reply(200, readyToSubmitAttempt);

      await runAction(useStopExam);
      expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.READY_TO_SUBMIT);
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${readyToSubmitAttempt.attempt_id}`);
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'stop' }));
    });

    it('Should stop exam, and redirect to sequence if not in exam section', async () => {
      stubLocation();

      await initWithExamAttempt({}, attempt);
      expect(examState()?.activeAttempt?.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onPut(`${createUpdateAttemptURL}/${readyToSubmitAttempt.attempt_id}`)
        .reply(200, { exam_attempt_id: readyToSubmitAttempt.attempt_id });

      await runAction(useStopExam);
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${readyToSubmitAttempt.attempt_id}`);
      expect(window.location.href).toEqual(attempt.exam_url_path);
    });

    it('Should use legacy endpoint if use_legacy_attempt_api set on attempt', async () => {
      const legacyExam = Factory.build('exam', {
        attempt: Factory.build('attempt', { use_legacy_attempt_api: true }),
        use_legacy_attempt_api: true,
      });
      await initWithExamAttempt(legacyExam, legacyExam.attempt);
      axiosMock.onPut(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: attempt.attempt_id });
      await runAction(useStopExam);
      expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusLegacyUrl);
    });

    it('Should fail to fetch if error occurs', async () => {
      await initWithExamAttempt();
      expect(examState()?.activeAttempt?.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).networkError();

      const { result } = renderAction(useStopExam);
      await act(async () => {
        await expect(result.current.mutateAsync()).rejects.toThrow('Network Error');
      });
      expect(clientState().apiErrorMsg).toBe('Network Error');
    });

    it('Should show the error and stay if stopping fails outside the exam section', async () => {
      stubLocation();
      await initWithExamAttempt({}, attempt);
      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).networkError();

      await runAction(useStopExam);

      expect(clientState().apiErrorMsg).toBe('Network Error');
      expect(window.location.href).toEqual('');
    });

    it('Should fail to fetch if no active attempt', async () => {
      await initWithExamAttempt(exam, {});

      await runAction(useStopExam);

      expect(loggingService.logError).toHaveBeenCalled();
      expect(clientState().apiErrorMsg).toBe('Failed to stop exam. No active attempt was found.');
    });
  });

  describe('useContinueExam', () => {
    const readyToSubmitAttempt = Factory.build('attempt', { attempt_status: ExamStatus.READY_TO_SUBMIT });
    const readyToSubmitExam = Factory.build('exam', { attempt: readyToSubmitAttempt });

    describe('with edx-proctoring as backend (no EXAMS_BASE_URL)', () => {
      beforeEach(() => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should return to exam, and update attempt', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam: readyToSubmitExam, active_attempt: {} });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam, active_attempt: attempt });
        axiosMock.onPut(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: attempt.attempt_id });

        await initLegacy();
        expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.READY_TO_SUBMIT);

        await runAction(useContinueExam);
        expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);
        expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusLegacyUrl);
        expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'start' }));
      });
    });

    it('Should return to exam, and update attempt', async () => {
      await initWithExamAttempt(readyToSubmitExam, {});
      expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.READY_TO_SUBMIT);

      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam });
      axiosMock.onGet(latestAttemptURL).reply(200, { attempt });
      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).reply(200, { exam_attempt_id: attempt.attempt_id });

      await runAction(useContinueExam);
      expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${attempt.attempt_id}`);
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'start' }));
    });

    it('Should fail to fetch if no attempt id', async () => {
      await initWithExamAttempt(Factory.build('exam'), {});

      await runAction(useContinueExam);

      expect(axiosMock.history.put).toHaveLength(0);
      expect(loggingService.logError).toHaveBeenCalled();
      expect(clientState().apiErrorMsg).toBe('Failed to continue exam. No attempt id was found.');
    });
  });

  describe('useResetExam', () => {
    const createdAttempt = Factory.build('attempt', { attempt_status: ExamStatus.CREATED, attempt_id: 2 });
    const examWithCreatedAttempt = Factory.build('exam', { attempt: createdAttempt });

    describe('with edx-proctoring as backend (no EXAMS_BASE_URL)', () => {
      beforeEach(() => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should reset exam attempt', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam, active_attempt: attempt });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl)
          .reply(200, { exam: examWithCreatedAttempt, active_attempt: {} });
        axiosMock.onPut(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

        await initLegacy();
        expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

        await runAction(useResetExam);
        expect(examState()?.exam.attempt).toMatchObject({ attempt_id: 2, attempt_status: ExamStatus.CREATED });
        expect(examState()?.activeAttempt).toBeNull();
        expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusLegacyUrl);
        expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'reset_attempt' }));
      });
    });

    it('Should reset exam attempt', async () => {
      await initWithExamAttempt();
      expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: examWithCreatedAttempt });
      axiosMock.onGet(latestAttemptURL).reply(200, {});
      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`)
        .reply(200, { exam_attempt_id: createdAttempt.attempt_id });

      await runAction(useResetExam);
      expect(examState()?.exam.attempt).toMatchObject({ attempt_id: 2, attempt_status: ExamStatus.CREATED });
      expect(examState()?.activeAttempt).toBeNull();
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${attempt.attempt_id}`);
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'reset_attempt' }));
    });

    it('Should fail to fetch if no attempt id', async () => {
      await initWithExamAttempt(Factory.build('exam'), {});

      await runAction(useResetExam);

      expect(axiosMock.history.put).toHaveLength(0);
      expect(loggingService.logError).toHaveBeenCalled();
      expect(clientState().apiErrorMsg).toBe('Failed to reset exam attempt. No attempt id was found.');
    });
  });

  describe('useSubmitExam', () => {
    const submittedAttempt = Factory.build('attempt', { attempt_status: ExamStatus.SUBMITTED });
    const submittedExam = Factory.build('exam', { attempt: submittedAttempt });

    describe('with edx-proctoring as backend (no EXAMS_BASE_URL)', () => {
      beforeEach(() => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should submit exam, and update attempt and exam', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam, active_attempt: attempt });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam: submittedExam, active_attempt: {} });
        axiosMock.onPut(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

        await initLegacy();
        expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

        await runAction(useSubmitExam);
        expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.SUBMITTED);
        expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusLegacyUrl);
        expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'submit' }));
      });
    });

    it('Should submit exam, and update attempt and exam', async () => {
      await initWithExamAttempt();
      expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: submittedExam });
      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

      await runAction(useSubmitExam);
      expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.SUBMITTED);
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${attempt.attempt_id}`);
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'submit' }));
    });

    it('Should fail to fetch if no attempt id', async () => {
      await initWithExamAttempt(Factory.build('exam'), {});

      await runAction(useSubmitExam);

      expect(axiosMock.history.put).toHaveLength(0);
      expect(loggingService.logError).toHaveBeenCalled();
      expect(clientState().apiErrorMsg).toBe('Failed to submit exam. No active attempt was found.');
    });

    it('Should submit exam and redirect to sequence if no exam attempt', async () => {
      // this is a test for a case when user tries to click end my exam button
      // from another section when timer reached 00:00, in which case exam
      // should get submitted and user should get redirected to exam submitted page
      stubLocation();

      await initWithExamAttempt({}, attempt);
      expect(examState()?.activeAttempt?.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

      await runAction(useSubmitExam);
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${attempt.attempt_id}`);
      expect(window.location.href).toEqual(attempt.exam_url_path);
    });

    it('Should show the error and stay if submitting fails outside the exam section', async () => {
      stubLocation();
      await initWithExamAttempt({}, attempt);
      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).networkError();

      await runAction(useSubmitExam);

      expect(clientState().apiErrorMsg).toBe('Network Error');
      expect(window.location.href).toEqual('');
    });

    it('Should show an error when the proctoring app does not confirm the submission', async () => {
      withWorker();
      const workerAttempt = Factory.build('attempt', { desktop_application_js_url: 'http://proctortest.com' });
      await initWithExamAttempt(Factory.build('exam', { attempt: workerAttempt }), workerAttempt);
      axiosMock.onPut(`${createUpdateAttemptURL}/${workerAttempt.attempt_id}`)
        .reply(200, { exam_attempt_id: workerAttempt.attempt_id });

      await runAction(useSubmitExam);

      await waitFor(() => expect(clientState().apiErrorMsg).toBe(
        'Something has gone wrong submitting your exam. Please double-check that the application is running.',
      ));
    });

    it('Should use legacy endpoint if use_legacy_attempt_api set on exam', async () => {
      const legacyExam = Factory.build('exam', {
        attempt: Factory.build('attempt', { use_legacy_attempt_api: true }),
        use_legacy_attempt_api: true,
      });
      await initWithExamAttempt(legacyExam, legacyExam.attempt);
      axiosMock.onPut(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: attempt.attempt_id });
      await runAction(useSubmitExam);
      expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusLegacyUrl);
    });
  });

  describe('useExpireExam', () => {
    const submittedAttempt = Factory.build('attempt', { attempt_status: ExamStatus.SUBMITTED });
    const submittedExam = Factory.build('exam', { attempt: submittedAttempt });

    describe('with edx-proctoring as backend (no EXAMS_BASE_URL)', () => {
      beforeEach(() => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should expire exam, and update attempt', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam, active_attempt: attempt });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam: submittedExam, active_attempt: {} });
        axiosMock.onPut(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

        await initLegacy();
        expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

        await runAction(useExpireExam);
        expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.SUBMITTED);
        expect(clientState().timeIsOver).toBe(true);
      });
    });

    it('Should submit expired exam, and update attempt', async () => {
      await initWithExamAttempt();
      expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: submittedExam });
      axiosMock.onGet(latestAttemptURL).reply(200, submittedAttempt);
      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

      await runAction(useExpireExam);
      expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.SUBMITTED);
      expect(clientState().timeIsOver).toBe(true);
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${attempt.attempt_id}`);
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'submit' }));
    });

    it('Should refresh the course\'s latest attempt when expired outside an exam sequence', async () => {
      axiosMock.onGet(latestAttemptURL).replyOnce(200, attempt);
      await queryClient.fetchQuery(activeAttemptQueryOptions(courseId));
      axiosMock.onGet(latestAttemptURL).reply(200, submittedAttempt);
      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

      const { result } = renderAction(useExpireExam, { courseId, isTimeLimited: false });
      await act(async () => {
        await result.current.mutateAsync();
      });

      const latest = queryClient.getQueryData<ExamState>(specialExamsQueryKeys.activeAttempt(courseId));
      expect(latest?.activeAttempt?.attempt_status).toBe(ExamStatus.SUBMITTED);
      expect(clientState().timeIsOver).toBe(true);
    });

    it('Should fail to fetch if no attempt id', async () => {
      await initWithExamAttempt(Factory.build('exam'), {});
      await runAction(useExpireExam);

      expect(axiosMock.history.put).toHaveLength(0);
      expect(loggingService.logError).toHaveBeenCalled();
      expect(clientState().apiErrorMsg).toBe('Failed to expire exam. No attempt id was found.');
      expect(clientState().timeIsOver).toBe(false);
    });
  });

  describe('useCreateProctoredExamAttempt', () => {
    const createdAttempt = Factory.build('attempt', { attempt_status: ExamStatus.CREATED });
    const createdExam = Factory.build('exam', { attempt: createdAttempt });

    describe('with edx-proctoring as a backend (no EXAMS_BASE_URL)', () => {
      beforeEach(() => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should create exam attempt, and update attempt and exam', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam: Factory.build('exam'), active_attempt: {} });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam: createdExam, active_attempt: {} });
        axiosMock.onPost(createExamAttemptLegacyUrl).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

        await initLegacy();
        expect(examState()?.exam.attempt).toEqual({});

        await runAction(useCreateProctoredExamAttempt);
        expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.CREATED);
        expect(JSON.parse(axiosMock.history.post[0].data)).toEqual({
          exam_id: exam.id, start_clock: 'false', attempt_proctored: 'true',
        });
      });
    });

    it('Should create exam attempt, and update attempt and exam', async () => {
      await initWithExamAttempt(Factory.build('exam'), {});

      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: createdExam });
      axiosMock.onPost(createUpdateAttemptURL).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

      await runAction(useCreateProctoredExamAttempt);
      expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.CREATED);
      expect(axiosMock.history.post).toHaveLength(1);
      expect(axiosMock.history.post[0].url).toBe(createUpdateAttemptURL);
    });

    it('Should use legacy endpoint if use_legacy_attempt_api set on exam', async () => {
      const legacyExam = Factory.build('exam', { use_legacy_attempt_api: true });
      await initWithExamAttempt(legacyExam, {});
      axiosMock.onPost(createExamAttemptLegacyUrl).reply(200, { exam_attempt_id: attempt.attempt_id });
      await runAction(useCreateProctoredExamAttempt);
      expect(axiosMock.history.post[0].url).toEqual(createExamAttemptLegacyUrl);
    });

    it('Should fail to start if no attempt id', async () => {
      await runAction(useCreateProctoredExamAttempt);

      expect(axiosMock.history.post).toHaveLength(0);
      expect(loggingService.logError).toHaveBeenCalled();
    });
  });

  describe('useStartProctoredExam', () => {
    const createdAttempt = Factory.build('attempt', { attempt_status: ExamStatus.CREATED });
    const startedFixture = Factory.build('attempt', { attempt_status: ExamStatus.STARTED });
    const createdExam = Factory.build('exam', { attempt: createdAttempt });
    const startedExam = Factory.build('exam', { attempt: startedFixture });
    const continueAttemptLegacyUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/${createdAttempt.attempt_id}`;

    describe('with edx-proctoring as a backend (no EXAMS_BASE_URL)', () => {
      beforeEach(() => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should start exam, and update attempt and exam', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl)
          .replyOnce(200, { exam: createdExam, active_attempt: createdAttempt });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl)
          .reply(200, { exam: startedExam, active_attempt: startedFixture });
        axiosMock.onPut(continueAttemptLegacyUrl).reply(200, { exam_attempt_id: startedFixture.attempt_id });

        await initLegacy();
        expect(examState()?.activeAttempt?.attempt_status).toBe(ExamStatus.CREATED);

        await runAction(useStartProctoredExam);
        expect(examState()?.activeAttempt).toMatchObject(startedAttempt(startedFixture.attempt_id));
        expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'start' }));
      });
    });

    it('Should start exam, and update attempt and exam', async () => {
      await initWithExamAttempt(createdExam, createdAttempt);
      expect(examState()?.activeAttempt?.attempt_status).toBe(ExamStatus.CREATED);

      axiosMock.onPut(`${createUpdateAttemptURL}/${createdAttempt.attempt_id}`).reply(200, { exam_attempt_id: startedFixture.attempt_id });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: startedExam });
      axiosMock.onGet(latestAttemptURL).reply(200, startedFixture);

      await runAction(useStartProctoredExam);
      expect(examState()?.activeAttempt).toMatchObject(startedAttempt(startedFixture.attempt_id));
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'start' }));
    });

    it('Should fail to fetch if no exam id', async () => {
      await runAction(useStartProctoredExam);

      expect(axiosMock.history.put).toHaveLength(0);
      expect(loggingService.logError).toHaveBeenCalled();
    });

    it('Should log an error on worker failure', async () => {
      withWorker();

      const createdWorkerAttempt = Factory.build('attempt', {
        attempt_status: ExamStatus.CREATED, desktop_application_js_url: 'http://proctortest.com',
      });
      const createdWorkerExam = Factory.build('exam', { attempt: createdWorkerAttempt });

      await initWithExamAttempt(createdWorkerExam, createdWorkerAttempt);
      axiosMock.onPut(`${createUpdateAttemptURL}/${createdWorkerAttempt.attempt_id}`)
        .reply(200, { exam_attempt_id: startedFixture.attempt_id });

      await runAction(useStartProctoredExam);
      expect(loggingService.logError).toHaveBeenCalledWith('test error', {
        attemptId: createdWorkerAttempt.attempt_id,
        attemptStatus: createdWorkerAttempt.attempt_status,
        courseId: createdWorkerAttempt.course_id,
        examId: createdWorkerExam.id,
      });
      expect(clientState().apiErrorMsg)
        .toBe('Something has gone wrong starting your exam. Please double-check that the application is running.');
      expect(axiosMock.history.put).toHaveLength(0);
    });

    it('Should notify top window on LTI exam start', async () => {
      const mockPostMessage = spyPostMessage();

      await initWithExamAttempt(createdExam, createdAttempt);
      axiosMock.onPut(`${createUpdateAttemptURL}/${createdAttempt.attempt_id}`).reply(200, { exam_attempt_id: startedFixture.attempt_id });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: startedExam });
      axiosMock.onGet(latestAttemptURL).reply(200, startedFixture);

      await runAction(useStartProctoredExam);
      expect(mockPostMessage).toHaveBeenCalledWith(['exam_state_change', 'exam_take'], '*');
    });

    it('Should not notify top window on legacy exam start', async () => {
      const mockPostMessage = spyPostMessage();
      const createdLegacyAttempt = Factory.build('attempt', {
        attempt_status: ExamStatus.CREATED, use_legacy_attempt_api: true,
      });
      const createdLegacyExam = Factory.build('exam', { attempt: createdLegacyAttempt });

      await initWithExamAttempt(createdLegacyExam, createdLegacyAttempt);
      axiosMock.onPut(continueAttemptLegacyUrl).reply(200, { exam_attempt_id: startedFixture.attempt_id });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: startedExam });
      axiosMock.onGet(latestAttemptURL).reply(200, startedFixture);

      await runAction(useStartProctoredExam);
      expect(axiosMock.history.put.map(({ url }) => url)).toEqual([continueAttemptLegacyUrl]);
      expect(mockPostMessage).not.toHaveBeenCalled();
    });
  });

  describe('useSkipProctoringExam', () => {
    const createdAttempt = Factory.build('attempt', { attempt_status: ExamStatus.CREATED });
    const createdExam = Factory.build('exam', { attempt: createdAttempt });
    const declinedAttempt = Factory.build('attempt', { attempt_status: ExamStatus.DECLINED });
    const declinedExam = Factory.build('exam', { attempt: declinedAttempt });

    describe('with edx-proctoring as a backend (no EXAMS_BASE_URL)', () => {
      beforeEach(() => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should create exam attempt with declined status, and update attempt and exam', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam: Factory.build('exam'), active_attempt: {} });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam: declinedExam, active_attempt: {} });
        axiosMock.onPost(createExamAttemptLegacyUrl).reply(200, { exam_attempt_id: declinedAttempt.attempt_id });

        await initLegacy();
        expect(examState()?.exam.attempt).toEqual({});

        await runAction(useSkipProctoringExam);
        expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.DECLINED);
        // edx-proctoring declines a proctored exam's new attempt only when attempt_proctored is false.
        expect(axiosMock.history.post).toHaveLength(1);
        expect(axiosMock.history.post[0].url).toBe(createExamAttemptLegacyUrl);
        expect(JSON.parse(axiosMock.history.post[0].data)).toEqual({
          exam_id: exam.id, start_clock: 'true', attempt_proctored: 'false',
        });
      });

      it('Should change existing attempt status to declined, and update attempt and exam', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam: createdExam, active_attempt: {} });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam: declinedExam, active_attempt: {} });
        axiosMock.onPut(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: declinedAttempt.attempt_id });

        await initLegacy();
        expect(examState()?.exam.attempt.attempt_status).toEqual(ExamStatus.CREATED);

        await runAction(useSkipProctoringExam);
        expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.DECLINED);
        expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'decline' }));
      });
    });

    it('Should create exam attempt with declined status, and update attempt and exam', async () => {
      await initWithExamAttempt(Factory.build('exam'), {});
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: declinedExam, active_attempt: {} });
      axiosMock.onPost(createUpdateAttemptURL).reply(200, { exam_attempt_id: declinedAttempt.attempt_id });

      await runAction(useSkipProctoringExam);
      expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.DECLINED);
      expect(axiosMock.history.post).toHaveLength(1);
      expect(axiosMock.history.post[0].url).toBe(createUpdateAttemptURL);
      expect(JSON.parse(axiosMock.history.post[0].data)).toEqual({
        exam_id: exam.id, start_clock: 'true', attempt_proctored: 'false',
      });
    });

    it('Should create the declined attempt on edx-proctoring for a legacy exam', async () => {
      await initWithExamAttempt(Factory.build('exam', { use_legacy_attempt_api: true }), {});
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: declinedExam, active_attempt: {} });
      axiosMock.onPost(createExamAttemptLegacyUrl).reply(200, { exam_attempt_id: declinedAttempt.attempt_id });

      await runAction(useSkipProctoringExam);
      expect(axiosMock.history.post).toHaveLength(1);
      expect(axiosMock.history.post[0].url).toBe(createExamAttemptLegacyUrl);
      expect(JSON.parse(axiosMock.history.post[0].data)).toEqual({
        exam_id: exam.id, start_clock: 'true', attempt_proctored: 'false',
      });
    });

    it('Should change existing attempt status to declined, and update attempt and exam', async () => {
      await initWithExamAttempt(createdExam, {});
      expect(examState()?.exam.attempt.attempt_status).toEqual(ExamStatus.CREATED);

      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: declinedExam, active_attempt: {} });
      axiosMock.onPut(`${createUpdateAttemptURL}/${declinedAttempt.attempt_id}`).reply(200, { exam_attempt_id: declinedAttempt.attempt_id });

      await runAction(useSkipProctoringExam);
      expect(examState()?.exam.attempt.attempt_status).toBe(ExamStatus.DECLINED);
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'decline' }));
    });

    it('Should fail to start if no attempt id', async () => {
      await runAction(useSkipProctoringExam);

      expect(axiosMock.history.post).toHaveLength(0);
      expect(loggingService.logError).toHaveBeenCalled();
    });
  });
});
