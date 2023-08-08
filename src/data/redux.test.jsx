import { Factory } from 'rosie';
import MockAdapter from 'axios-mock-adapter';

import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig, mergeConfig } from '@edx/frontend-platform';

import * as api from './api';
import * as thunks from './thunks';

import executeThunk from '../utils';

import { initializeTestStore, initializeMockApp, initializeTestConfig } from '../setupTest';
import { ExamStatus } from '../constants';

const BASE_API_URL = '/api/edx_proctoring/v1/proctored_exam/attempt';

const { loggingService } = initializeMockApp();
const axiosMock = new MockAdapter(getAuthenticatedHttpClient());

let windowSpy;

// Mock for worker failure
const mockPromise = jest.fn(() => (
  new Promise((resolve, reject) => {
    reject(Error('test error'));
  })
));
jest.mock('./messages/handlers', () => ({
  ...jest.requireActual('./messages/handlers'),
  createWorker: jest.fn(),
  workerPromiseForEventNames: jest.fn(() => mockPromise),
  pingApplication: jest.fn(() => mockPromise()),
}));

describe('Data layer integration tests', () => {
  const exam = Factory.build('exam', { attempt: Factory.build('attempt') });
  const { course_id: courseId, content_id: contentId, attempt } = exam;
  const fetchExamAttemptsDataLegacyUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/course_id/${courseId}`
    + `?content_id=${encodeURIComponent(contentId)}&is_learning_mfe=true`;
  const updateAttemptStatusLegacyUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/${attempt.attempt_id}`;
  const createExamAttemptLegacyUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}`;
  const fetchProctoringSettingsLegacyUrl = `${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/settings/exam_id/${exam.id}/`;

  const createUpdateAttemptURL = `${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt`;
  const fetchExamAttemptsDataUrl = `${getConfig().EXAMS_BASE_URL}/api/v1/student/exam/attempt/course_id/${courseId}/content_id/${contentId}`;
  const latestAttemptURL = `${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt/latest`;
  const fetchProctoringSettingsUrl = `${getConfig().EXAMS_BASE_URL}/api/v1/exam/provider_settings/course_id/${courseId}/exam_id/${exam.id}`;
  let store;

  const initWithExamAttempt = async (testExam = exam, testAttempt = attempt) => {
    axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: testExam });
    axiosMock.onGet(latestAttemptURL).reply(200, testAttempt);
    await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
  };

  beforeEach(async () => {
    initializeTestConfig();
    windowSpy = jest.spyOn(window, 'window', 'get');
    axiosMock.reset();
    loggingService.logError.mockReset();
    loggingService.logInfo.mockReset();
    store = await initializeTestStore();
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  it('Test getAllowProctoringOptOut', async () => {
    await executeThunk(thunks.getAllowProctoringOptOut(true), store.dispatch);

    const state = store.getState();
    expect(state.examState.allowProctoringOptOut).toEqual(true);
  });

  describe('Test getExamAttemptsData', () => {
    it('Should get, and save exam and attempt', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam });
      axiosMock.onGet(latestAttemptURL).replyOnce(200, attempt);

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);

      const state = store.getState();
      expect(state).toMatchSnapshot();
    });

    it('Should translate total time correctly', async () => {
      // configure exam whose total_time field is an int. This matches what is returned by edx-exams
      exam.total_time = 30;

      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam });
      axiosMock.onGet(latestAttemptURL).replyOnce(200, attempt);

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);

      const state = store.getState();
      expect(state.examState.exam.total_time).toBe('30 minutes');
    });

    it('Should fail to fetch if error occurs', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).networkError();

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);

      const state = store.getState();
      expect(state.examState.apiErrorMsg).toBe('Network Error');
    });
  });

  describe('Test getProctoringSettings', () => {
    const proctoringSettings = Factory.build('proctoringSettings');

    describe('Test legacy URL for getProctoringSettings', () => {
      beforeEach(async () => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should get, and save proctoringSettings', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam, active_attempt: attempt });
        axiosMock.onGet(fetchProctoringSettingsLegacyUrl).reply(200, proctoringSettings);

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        await executeThunk(thunks.getProctoringSettings(), store.dispatch, store.getState);

        const state = store.getState();
        expect(state.examState.proctoringSettings).toMatchSnapshot();
      });
    });

    it('Should get, and save proctoringSettings', async () => {
      await initWithExamAttempt();
      axiosMock.onGet(fetchProctoringSettingsUrl).reply(200, proctoringSettings);

      await executeThunk(thunks.getProctoringSettings(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.examState.proctoringSettings).toMatchSnapshot();
    });

    it('Should fail to fetch if error occurs', async () => {
      axiosMock.onGet(fetchProctoringSettingsUrl).reply(200, proctoringSettings);

      await executeThunk(thunks.getProctoringSettings(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.examState.proctoringSettings).toMatchSnapshot();
    });

    it('Should fail to fetch if error occurs', async () => {
      await initWithExamAttempt();
      axiosMock.onGet(fetchProctoringSettingsUrl).networkError();

      await executeThunk(thunks.getProctoringSettings(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.examState.apiErrorMsg).toBe('Network Error');
    });
  });

  describe('Test getExamReviewPolicy', () => {
    const getExamReviewPolicyUrl = `${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/review_policy/exam_id/${exam.id}/`;
    const reviewPolicy = 'Example review policy.';

    beforeEach(async () => {
      mergeConfig({ EXAMS_BASE_URL: null });
    });

    it('Should get, and save getExamReviewPolicy', async () => {
      axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam, active_attempt: attempt });
      axiosMock.onGet(getExamReviewPolicyUrl).reply(200, { review_policy: reviewPolicy });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.getExamReviewPolicy(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.examState.exam.reviewPolicy).toEqual(reviewPolicy);
    });

    it('Should fail to fetch if error occurs', async () => {
      axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam, active_attempt: attempt });
      axiosMock.onGet(getExamReviewPolicyUrl).networkError();

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.getExamReviewPolicy(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.examState.apiErrorMsg).toBe('Network Error');
    });

    it('Should fail to fetch if no exam id', async () => {
      axiosMock.onGet(getExamReviewPolicyUrl).reply(200, { review_policy: 'Example review policy.' });

      await executeThunk(thunks.getExamReviewPolicy(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.examState.exam.reviewPolicy).toBeUndefined();
    });
  });

  describe('Test startTimedExam', () => {
    describe('with edx-proctoring as a backend (no EXAMS_BASE_URL)', () => {
      beforeEach(() => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should create and start exam', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam, active_attempt: {} });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam, active_attempt: attempt });
        axiosMock.onPost(createExamAttemptLegacyUrl).reply(200, { exam_attempt_id: attempt.attempt_id });

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        let state = store.getState();
        expect(state.examState.activeAttempt).toBeNull();

        await executeThunk(thunks.startTimedExam(), store.dispatch, store.getState);
        state = store.getState();
        expect(state.examState.activeAttempt).toMatchSnapshot();
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

      await executeThunk(thunks.startTimedExam(), store.dispatch, store.getState);
      const state = store.getState();
      expect(state.examState.activeAttempt).toMatchSnapshot();
      expect(axiosMock.history.post[0].data).toEqual(JSON.stringify({
        exam_id: exam.id,
        start_clock: 'true',
        attempt_proctored: 'false',
      }));
    });

    it('Should use legacy endpoint if use_legacy_attempt_api set on exam', async () => {
      const legacyExam = Factory.build('exam', { use_legacy_attempt_api: true });
      await initWithExamAttempt(legacyExam, {});
      await executeThunk(thunks.startTimedExam(), store.dispatch, store.getState);
      expect(axiosMock.history.post[0].url).toEqual(createExamAttemptLegacyUrl);
    });

    it('Should fail to fetch if no exam id', async () => {
      // TODO: For working in these tests in the future
      // This error logic is common to every thunk, so we can refactor this out and test it separately
      // instead of repeating it for every feature.
      axiosMock.onPost(createUpdateAttemptURL).reply(200, { exam_attempt_id: attempt.attempt_id });

      await executeThunk(thunks.startTimedExam(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.examState.apiErrorMsg).toBe('Failed to start exam. No exam id was found.');
    });
  });

  describe('Test stopExam', () => {
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

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        let state = store.getState();
        expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.STARTED);

        await executeThunk(thunks.stopExam(), store.dispatch, store.getState);
        state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.READY_TO_SUBMIT);
        expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusLegacyUrl);
        expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'stop' }));
      });

      it('Should stop exam, and redirect to sequence if not in exam section', async () => {
        const { location } = window;
        delete window.location;
        window.location = {
          href: '',
        };

        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam: {}, active_attempt: attempt });
        axiosMock.onPut(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: readyToSubmitAttempt.attempt_id });

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        const state = store.getState();
        expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.STARTED);

        await executeThunk(thunks.stopExam(), store.dispatch, store.getState);
        expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusLegacyUrl);
        expect(window.location.href).toEqual(attempt.exam_url_path);

        window.location = location;
      });
    });

    it('Should stop exam, and update attempt', async () => {
      await initWithExamAttempt();
      let state = store.getState();
      expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onPut(`${createUpdateAttemptURL}/${readyToSubmitAttempt.attempt_id}`).reply(200, { exam_attempt_id: readyToSubmitAttempt.attempt_id });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: readyToSubmitExam });
      axiosMock.onGet(latestAttemptURL).reply(200, readyToSubmitAttempt);

      await executeThunk(thunks.stopExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.READY_TO_SUBMIT);
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${readyToSubmitAttempt.attempt_id}`);
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'stop' }));
    });

    it('Should stop exam, and redirect to sequence if not in exam section', async () => {
      const { location } = window;
      delete window.location;
      window.location = {
        href: '',
      };

      await initWithExamAttempt({}, attempt);
      const state = store.getState();
      expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onPut(`${createUpdateAttemptURL}/${readyToSubmitAttempt.attempt_id}`).reply(200, { exam_attempt_id: readyToSubmitAttempt.attempt_id });

      await executeThunk(thunks.stopExam(), store.dispatch, store.getState);
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${readyToSubmitAttempt.attempt_id}`);
      expect(window.location.href).toEqual(attempt.exam_url_path);

      window.location = location;
    });

    it('Should use legacy endpoint if use_legacy_attempt_api set on attempt', async () => {
      const legacyExam = Factory.build('exam', {
        attempt: Factory.build('attempt', { use_legacy_attempt_api: true }),
        use_legacy_attempt_api: true,
      });
      await initWithExamAttempt(legacyExam, legacyExam.attempt);
      await executeThunk(thunks.stopExam(), store.dispatch, store.getState);
      expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusLegacyUrl);
    });

    it('Should fail to fetch if error occurs', async () => {
      await initWithExamAttempt();
      let state = store.getState();
      expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).networkError();

      await executeThunk(thunks.stopExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.apiErrorMsg).toBe('Network Error');
    });

    it('Should fail to fetch if no active attempt', async () => {
      await initWithExamAttempt(exam, {});

      await executeThunk(thunks.stopExam(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.examState.apiErrorMsg).toBe('Failed to stop exam. No active attempt was found.');
    });
  });

  describe('Test continueExam', () => {
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

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        let state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.READY_TO_SUBMIT);

        await executeThunk(thunks.continueExam(), store.dispatch, store.getState);
        state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);
        expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusLegacyUrl);
        expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'start' }));
      });
    });

    it('Should return to exam, and update attempt', async () => {
      await initWithExamAttempt(readyToSubmitExam, {});
      let state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.READY_TO_SUBMIT);

      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam });
      axiosMock.onGet(latestAttemptURL).reply(200, { attempt });
      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).reply(200, { exam_attempt_id: attempt.attempt_id });

      await executeThunk(thunks.continueExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${attempt.attempt_id}`);
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'start' }));
    });

    it('Should fail to fetch if no attempt id', async () => {
      await initWithExamAttempt(Factory.build('exam'), {});

      axiosMock.onGet(`${createUpdateAttemptURL}/${attempt.attempt_id}`).reply(200, { exam_attempt_id: attempt.attempt_id });
      await executeThunk(thunks.continueExam(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.examState.apiErrorMsg).toBe('Failed to continue exam. No attempt id was found.');
    });
  });

  describe('Test resetExam', () => {
    const createdAttempt = Factory.build(
      'attempt',
      {
        attempt_status: ExamStatus.CREATED,
        attempt_id: 2,
      },
    );
    const examWithCreatedAttempt = Factory.build('exam', { attempt: createdAttempt });

    describe('with edx-proctoring as backend (no EXAMS_BASE_URL)', () => {
      beforeEach(() => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should reset exam attempt', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam, active_attempt: attempt });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, {
          exam: examWithCreatedAttempt, active_attempt: {},
        });
        axiosMock.onPut(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        let state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

        await executeThunk(thunks.resetExam(), store.dispatch, store.getState);

        state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.CREATED);
        expect(state).toMatchSnapshot();
        expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusLegacyUrl);
        expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'reset_attempt' }));
      });
    });

    it('Should reset exam attempt', async () => {
      await initWithExamAttempt();
      let state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: examWithCreatedAttempt });
      axiosMock.onGet(latestAttemptURL).reply(200, {});
      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

      await executeThunk(thunks.resetExam(), store.dispatch, store.getState);

      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.CREATED);
      expect(state).toMatchSnapshot();
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${attempt.attempt_id}`);
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'reset_attempt' }));
    });

    it('Should fail to fetch if no attempt id', async () => {
      await initWithExamAttempt(Factory.build('exam'), {});
      axiosMock.onPut(`${createUpdateAttemptURL}/${createdAttempt.attempt_id}`).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

      await executeThunk(thunks.resetExam(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.examState.apiErrorMsg).toBe('Failed to reset exam attempt. No attempt id was found.');
    });
  });

  describe('Test submitExam', () => {
    const submittedAttempt = Factory.build('attempt', { attempt_status: ExamStatus.SUBMITTED });
    const submittedExam = Factory.build('exam', { attempt: submittedAttempt });

    describe('with edx-proctoring as backend (no EXAMS_BASE_URL)', () => {
      beforeEach(() => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should submit exam, and update attempt and exam', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam, active_attempt: attempt });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam: submittedExam, active_attempt: {} });
        axiosMock.onPost(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        let state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

        await executeThunk(thunks.submitExam(), store.dispatch, store.getState);
        state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.SUBMITTED);
      });
    });

    it('Should submit exam, and update attempt and exam', async () => {
      await initWithExamAttempt();
      let state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: submittedExam });
      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

      await executeThunk(thunks.submitExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.SUBMITTED);
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${attempt.attempt_id}`);
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'submit' }));
    });

    it('Should fail to fetch if no attempt id', async () => {
      // TODO: For working in these tests in the future
      // This error logic is common to every thunk, so we can refactor this out and test it separately
      // instead of repeating it for every feature.
      await initWithExamAttempt(Factory.build('exam'), {});

      await executeThunk(thunks.submitExam(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.examState.apiErrorMsg).toBe('Failed to submit exam. No active attempt was found.');
    });

    it('Should submit exam and redirect to sequence if no exam attempt', async () => {
      // this is a test for a case when user tries to click end my exam button
      // from another section when timer reached 00:00, in which case exam
      // should get submitted and user should get redirected to exam submitted page
      const { location } = window;
      delete window.location;
      window.location = {
        href: '',
      };

      await initWithExamAttempt({}, attempt);
      const state = store.getState();
      expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

      await executeThunk(thunks.submitExam(), store.dispatch, store.getState);
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${attempt.attempt_id}`);
      expect(window.location.href).toEqual(attempt.exam_url_path);

      window.location = location;
    });

    it('Should use legacy endpoint if use_legacy_attempt_api set on exam', async () => {
      const legacyExam = Factory.build('exam', {
        attempt: Factory.build('attempt', { use_legacy_attempt_api: true }),
        use_legacy_attempt_api: true,
      });
      await initWithExamAttempt(legacyExam, legacyExam.attempt);
      await executeThunk(thunks.submitExam(), store.dispatch, store.getState);
      expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusLegacyUrl);
    });

    it('Should notify top window on LTI exam end', async () => {
      const mockPostMessage = jest.fn();
      windowSpy.mockImplementation(() => ({
        top: {
          postMessage: mockPostMessage,
        },
      }));

      await initWithExamAttempt();
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: submittedExam });
      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });
      await executeThunk(thunks.submitExam(), store.dispatch, store.getState);
      expect(mockPostMessage).toHaveBeenCalledWith(['exam_state_change', 'exam_end'], '*');
    });
  });

  describe('Test expireExam', () => {
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

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        let state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

        await executeThunk(thunks.expireExam(), store.dispatch, store.getState);
        state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.SUBMITTED);
        expect(state.examState.timeIsOver).toBe(true);
      });
    });

    it('Should submit expired exam, and update attempt', async () => {
      await initWithExamAttempt();
      let state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: submittedExam });
      axiosMock.onGet(latestAttemptURL).reply(200, submittedAttempt);
      axiosMock.onPut(`${createUpdateAttemptURL}/${attempt.attempt_id}`).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

      await executeThunk(thunks.expireExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.SUBMITTED);
      expect(state.examState.timeIsOver).toBe(true);
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${attempt.attempt_id}`);
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'submit' }));
    });

    it('Should fail to fetch if no attempt id', async () => {
      await initWithExamAttempt(Factory.build('exam'), {});
      await executeThunk(thunks.expireExam(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.examState.apiErrorMsg).toBe('Failed to expire exam. No attempt id was found.');
    });
  });

  describe('Test startProctoringSoftwareDownload', () => {
    const softwareDownloadedAttempt = Factory.build('attempt', { attempt_status: ExamStatus.DOWNLOAD_SOFTWARE_CLICKED });
    const softwareDownloadedExam = Factory.build('exam', { attempt: softwareDownloadedAttempt });

    describe('with edx-proctoring as backend (no EXAMS_BASE_URL)', () => {
      beforeEach(() => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should start downloading proctoring software, and update attempt and exam', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam, active_attempt: attempt });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, {
          exam: softwareDownloadedExam, active_attempt: {},
        });
        axiosMock.onPut(updateAttemptStatusLegacyUrl).reply(200, {
          exam_attempt_id: softwareDownloadedAttempt.attempt_id,
        });

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        let state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

        await executeThunk(thunks.startProctoringSoftwareDownload(), store.dispatch, store.getState);
        state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.DOWNLOAD_SOFTWARE_CLICKED);
      });
    });

    it('Should start downloading proctoring software, and update attempt and exam', async () => {
      await initWithExamAttempt();

      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: softwareDownloadedExam, active_attempt: {} });
      axiosMock.onPut(`${createUpdateAttemptURL}/${softwareDownloadedAttempt.attempt_id}`).reply(200, { exam_attempt_id: softwareDownloadedAttempt.attempt_id });

      await executeThunk(thunks.startProctoringSoftwareDownload(), store.dispatch, store.getState);
      const state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.DOWNLOAD_SOFTWARE_CLICKED);
      expect(axiosMock.history.put[0].url).toEqual(`${createUpdateAttemptURL}/${softwareDownloadedAttempt.attempt_id}`);
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'click_download_software' }));
    });
  });

  describe('Test createProctoredExamAttempt', () => {
    const createdAttempt = Factory.build('attempt', { attempt_status: ExamStatus.CREATED });
    const createdExam = Factory.build('exam', { attempt: createdAttempt });

    describe('with edx-proctoring as a backend (no EXAMS_BASE_URL)', () => {
      beforeEach(async () => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should create exam attempt, and update attempt and exam', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam: Factory.build('exam'), active_attempt: {} });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam: createdExam, active_attempt: {} });
        axiosMock.onPost(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        let state = store.getState();
        expect(state.examState.exam.attempt).toEqual({});

        await executeThunk(thunks.createProctoredExamAttempt(), store.dispatch, store.getState);
        state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.CREATED);
      });
    });

    it('Should create exam attempt, and update attempt and exam', async () => {
      await initWithExamAttempt(Factory.build('exam'), {});

      // create thunk should POST attempt and update exam state from backend
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: createdExam });
      axiosMock.onPost(createUpdateAttemptURL).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

      await executeThunk(thunks.createProctoredExamAttempt(), store.dispatch, store.getState);
      const state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.CREATED);
      expect(axiosMock.history.post.length).toBe(1);
    });

    it('Should use legacy endpoint if use_legacy_attempt_api set on exam', async () => {
      const legacyExam = Factory.build('exam', { use_legacy_attempt_api: true });
      await initWithExamAttempt(legacyExam, {});
      await executeThunk(thunks.createProctoredExamAttempt(), store.dispatch, store.getState);
      expect(axiosMock.history.post[0].url).toEqual(createExamAttemptLegacyUrl);
    });

    it('Should fail to start if no attempt id', async () => {
      axiosMock.onGet(createUpdateAttemptURL).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

      await executeThunk(thunks.createProctoredExamAttempt(), store.dispatch, store.getState);

      expect(loggingService.logError).toHaveBeenCalled();
    });
  });

  describe('Test startProctoredExam', () => {
    const createdAttempt = Factory.build('attempt', { attempt_status: ExamStatus.CREATED });
    const startedAttempt = Factory.build('attempt', { attempt_status: ExamStatus.STARTED });
    const createdExam = Factory.build('exam', { attempt: createdAttempt });
    const startedExam = Factory.build('exam', { attempt: startedAttempt });
    const continueAttemptLegacyUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/${createdAttempt.attempt_id}`;

    describe('with edx-proctoring as a backend (no EXAMS_BASE_URL)', () => {
      beforeEach(async () => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should start exam, and update attempt and exam', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, {
          exam: createdExam, active_attempt: createdAttempt,
        });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, {
          exam: startedExam, active_attempt: startedAttempt,
        });
        axiosMock.onPost(continueAttemptLegacyUrl).reply(200, { exam_attempt_id: startedAttempt.attempt_id });

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        let state = store.getState();
        expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.CREATED);

        await executeThunk(thunks.startProctoredExam(), store.dispatch, store.getState);
        state = store.getState();
        expect(state.examState.activeAttempt).toMatchSnapshot();
      });
    });

    it('Should start exam, and update attempt and exam', async () => {
      await initWithExamAttempt(createdExam, createdAttempt);
      let state = store.getState();
      expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.CREATED);

      axiosMock.onPost(createUpdateAttemptURL).reply(200, { exam_attempt_id: startedAttempt.attempt_id });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: startedExam });
      axiosMock.onGet(latestAttemptURL).reply(200, startedAttempt);

      await executeThunk(thunks.startProctoredExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.activeAttempt).toMatchSnapshot();
    });

    it('Should fail to fetch if no exam id', async () => {
      axiosMock.onPost(createUpdateAttemptURL).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

      await executeThunk(thunks.startProctoredExam(), store.dispatch, store.getState);

      expect(loggingService.logError).toHaveBeenCalled();
    });

    it('Should log an error on worker failure', async () => {
      windowSpy.mockImplementation(() => ({
        Worker: jest.fn(),
        URL: { createObjectURL: jest.fn() },
      }));

      const createdWorkerAttempt = Factory.build('attempt', { attempt_status: ExamStatus.CREATED, desktop_application_js_url: 'http://proctortest.com' });
      const startedWorkerAttempt = Factory.build('attempt', { attempt_status: ExamStatus.STARTED, desktop_application_js_url: 'http://proctortest.com' });
      const createdWorkerExam = Factory.build('exam', { attempt: createdWorkerAttempt });
      const startedWorkerExam = Factory.build('exam', { attempt: startedWorkerAttempt });

      await initWithExamAttempt(createdWorkerExam, createdWorkerAttempt);
      axiosMock.onPost(createUpdateAttemptURL).reply(200, { exam_attempt_id: startedWorkerAttempt.attempt_id });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: startedWorkerExam });
      axiosMock.onGet(latestAttemptURL).reply(200, startedWorkerAttempt);

      await executeThunk(thunks.startProctoredExam(), store.dispatch, store.getState);
      expect(loggingService.logError).toHaveBeenCalledWith('test error', {
        attemptId: createdWorkerAttempt.attempt_id,
        attemptStatus: createdWorkerAttempt.attempt_status,
        courseId: createdWorkerAttempt.course_id,
        examId: createdWorkerExam.id,
      });
    });

    it('Should notify top window on LTI exam start', async () => {
      const mockPostMessage = jest.fn();
      windowSpy.mockImplementation(() => ({
        top: {
          postMessage: mockPostMessage,
        },
      }));

      await initWithExamAttempt(createdExam, createdAttempt);
      axiosMock.onPost(createUpdateAttemptURL).reply(200, { exam_attempt_id: startedAttempt.attempt_id });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: startedExam });
      axiosMock.onGet(latestAttemptURL).reply(200, startedAttempt);

      await executeThunk(thunks.startProctoredExam(), store.dispatch, store.getState);
      expect(mockPostMessage).toHaveBeenCalledWith(['exam_state_change', 'exam_take'], '*');
    });
  });

  describe('Test skipProctoringExam', () => {
    const createdAttempt = Factory.build(
      'attempt',
      {
        attempt_status: ExamStatus.CREATED,
      },
    );
    const createdExam = Factory.build('exam', { attempt: createdAttempt });
    const declinedAttempt = Factory.build('attempt', { attempt_status: ExamStatus.DECLINED });
    const declinedExam = Factory.build('exam', { attempt: declinedAttempt });

    describe('with edx-proctoring as a backend (no EXAMS_BASE_URL)', () => {
      beforeEach(async () => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should create exam attempt with declined status, and update attempt and exam', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam: Factory.build('exam'), active_attempt: {} });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam: declinedExam, active_attempt: {} });
        axiosMock.onPost(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: declinedAttempt.attempt_id });

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        let state = store.getState();
        expect(state.examState.exam.attempt).toEqual({});

        await executeThunk(thunks.skipProctoringExam(), store.dispatch, store.getState);
        state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.DECLINED);
      });

      it('Should change existing attempt status to declined, and update attempt and exam', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam: createdExam, active_attempt: {} });
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam: declinedExam, active_attempt: {} });
        axiosMock.onPost(updateAttemptStatusLegacyUrl).reply(200, { exam_attempt_id: declinedAttempt.attempt_id });

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        let state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toEqual(ExamStatus.CREATED);

        await executeThunk(thunks.skipProctoringExam(), store.dispatch, store.getState);
        state = store.getState();
        expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.DECLINED);
      });
    });

    it('Should create exam attempt with declined status, and update attempt and exam', async () => {
      await initWithExamAttempt(Factory.build('exam'), {});
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: declinedExam, active_attempt: {} });
      axiosMock.onPost(createUpdateAttemptURL).reply(200, { exam_attempt_id: declinedAttempt.attempt_id });

      await executeThunk(thunks.skipProctoringExam(), store.dispatch, store.getState);
      const state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.DECLINED);
      expect(axiosMock.history.post.length).toBe(1);
    });

    it('Should change existing attempt status to declined, and update attempt and exam', async () => {
      await initWithExamAttempt(createdExam, {});
      let state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toEqual(ExamStatus.CREATED);

      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: declinedExam, active_attempt: {} });
      axiosMock.onPut(`${createUpdateAttemptURL}/${declinedAttempt.attempt_id}`).reply(200, { exam_attempt_id: declinedAttempt.attempt_id });

      await executeThunk(thunks.skipProctoringExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.DECLINED);
      expect(axiosMock.history.put[0].data).toEqual(JSON.stringify({ action: 'decline' }));
    });

    it('Should fail to start if no attempt id', async () => {
      await executeThunk(thunks.skipProctoringExam(), store.dispatch, store.getState);

      expect(loggingService.logError).toHaveBeenCalled();
    });
  });

  describe('Test pollAttempt', () => {
    describe('with edx-proctoring as a backend (no EXAMS_BASE_URL)', () => {
      const pollExamAttemptUrl = `${getConfig().LMS_BASE_URL}${attempt.exam_started_poll_url}`;
      beforeEach(async () => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should poll and update active attempt', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam, active_attempt: attempt });
        axiosMock.onGet(pollExamAttemptUrl).reply(200, {
          time_remaining_seconds: 1739.9,
          accessibility_time_string: 'you have 29 minutes remaining',
          attempt_status: ExamStatus.STARTED,
        });

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        let state = store.getState();
        expect(state.examState.exam.attempt).toMatchSnapshot();

        await executeThunk(thunks.pollAttempt(attempt.exam_started_poll_url), store.dispatch, store.getState);
        state = store.getState();
        const expectedPollUrl = `${getConfig().LMS_BASE_URL}${attempt.exam_started_poll_url}`;
        expect(state.examState.exam.attempt).toMatchSnapshot();
        expect(axiosMock.history.get[1].url).toEqual(expectedPollUrl);
      });
    });

    it('Should poll and update active attempt', async () => {
      await initWithExamAttempt(exam, attempt);

      axiosMock.onGet(latestAttemptURL).reply(200, {
        time_remaining_seconds: 1739.9,
        accessibility_time_string: 'you have 29 minutes remaining',
        attempt_status: ExamStatus.STARTED,
      });

      await executeThunk(thunks.pollAttempt(attempt.exam_started_poll_url), store.dispatch, store.getState);
      const state = store.getState();
      expect(state.examState.activeAttempt).toMatchSnapshot();
    });

    describe('pollAttempt api called directly', () => {
      // in the download view we call this function directly withough invoking the wrapping thunk
      it('should call pollUrl if one is provided', async () => {
        const pollExamAttemptUrl = `${getConfig().LMS_BASE_URL}${attempt.exam_started_poll_url}`;
        axiosMock.onGet(pollExamAttemptUrl).reply(200, {
          time_remaining_seconds: 1739.9,
          accessibility_time_string: 'you have 29 minutes remaining',
          attempt_status: ExamStatus.STARTED,
        });
        await api.pollExamAttempt(attempt.exam_started_poll_url);
        expect(axiosMock.history.get[0].url).toEqual(pollExamAttemptUrl);
      });
      it('should call the latest attempt for a sequence if a sequence id is provided instead of a pollUrl', async () => {
        const sequenceId = 'block-v1:edX+Test+123';
        const expectedUrl = `${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt/latest?content_id=${encodeURIComponent(sequenceId)}`;
        axiosMock.onGet(expectedUrl).reply(200, {
          time_remaining_seconds: 1739.9,
          status: ExamStatus.STARTED,
        });
        await api.pollExamAttempt(null, sequenceId);
        expect(axiosMock.history.get[0].url).toEqual(expectedUrl);
      });
      test('pollUrl is required if edx-exams in not enabled, an error should be logged', async () => {
        mergeConfig({ EXAMS_BASE_URL: null });
        api.pollExamAttempt(null, null);
        expect(loggingService.logError).toHaveBeenCalled();
      });
    });
  });

  describe('Test pingAttempt', () => {
    it('Should send attempt to error state on ping failure', async () => {
      const startedWorkerAttempt = Factory.build('attempt', { attempt_status: ExamStatus.STARTED, desktop_application_js_url: 'http://proctortest.com' });
      const startedWorkerExam = Factory.build('exam', { attempt: startedWorkerAttempt });
      await initWithExamAttempt(startedWorkerExam, startedWorkerAttempt);

      axiosMock.onPut(`${createUpdateAttemptURL}/${startedWorkerAttempt.attempt_id}`).reply(200, { exam_attempt_id: startedWorkerAttempt.attempt_id });
      await executeThunk(thunks.pingAttempt(), store.dispatch, store.getState);

      expect(loggingService.logError).toHaveBeenCalledWith('test error', {
        attemptId: startedWorkerAttempt.attempt_id,
        attemptStatus: startedWorkerAttempt.attempt_status,
        courseId: startedWorkerAttempt.course_id,
        examId: startedWorkerExam.id,
      });
      const request = axiosMock.history.put[0];
      expect(request.data).toEqual(JSON.stringify({
        action: 'error',
        detail: 'test error',
      }));
    });
  });

  describe('Test getLatestAttemptData', () => {
    describe('with edx-proctoring as a backend (no EXAMS_BASE_URL)', () => {
      beforeEach(async () => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should get, and save latest attempt', async () => {
        const attemptDataUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/course_id/${courseId}?is_learning_mfe=true`;
        axiosMock.onGet(attemptDataUrl)
          .reply(200, {
            exam: {},
            active_attempt: attempt,
          });

        await executeThunk(thunks.getLatestAttemptData(courseId), store.dispatch);

        const state = store.getState();
        expect(state)
          .toMatchSnapshot();
      });
    });

    it('Should get, and save latest attempt', async () => {
      await initWithExamAttempt();

      axiosMock.onGet(latestAttemptURL).reply(200, Factory.build('attempt', { attempt_id: 1234 }));

      await executeThunk(thunks.getLatestAttemptData(courseId), store.dispatch);

      const state = store.getState();
      expect(state.examState.activeAttempt.attempt_id).toEqual(1234);
    });
  });

  describe('Test examRequiresAccessToken', () => {
    const fetchExamAccessUrl = `${getConfig().EXAMS_BASE_URL}/api/v1/access_tokens/exam_id/${exam.id}/`;

    describe('with edx-proctoring as a backend (no EXAMS_BASE_URL)', () => {
      beforeEach(async () => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should not fetch exam access token', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam, active_attempt: attempt });
        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        await executeThunk(thunks.examRequiresAccessToken(), store.dispatch, store.getState);

        const state = store.getState();
        expect(state.examState.exam.id).toBe(exam.id);
        expect(state.examState.examAccessToken.exam_access_token).toBe('');
      });
    });

    it('Should get exam access token', async () => {
      const examAccessToken = Factory.build('examAccessToken');

      await initWithExamAttempt();
      axiosMock.onGet(fetchExamAccessUrl).reply(200, examAccessToken);
      await executeThunk(thunks.examRequiresAccessToken(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.examState.examAccessToken).toMatchSnapshot();
    });

    it('Should fail to fetch if no exam id', async () => {
      axiosMock.onGet(fetchExamAccessUrl).reply(200, {});
      await executeThunk(thunks.examRequiresAccessToken(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.examState.examAccessToken.exam_access_token).toBe('');
    });

    it('Should fail to fetch if API error occurs', async () => {
      await initWithExamAttempt();
      axiosMock.onGet(fetchExamAccessUrl).reply(400, { detail: 'Exam access token not granted' });

      await executeThunk(thunks.examRequiresAccessToken(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.examState.examAccessToken.exam_access_token).toBe('');
    });
  });
});
