import { Factory } from 'rosie';
import MockAdapter from 'axios-mock-adapter';

import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig, mergeConfig } from '@edx/frontend-platform';

import * as thunks from './thunks';

import executeThunk from '../utils';

import { initializeTestStore, initializeMockApp } from '../setupTest';
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
  const fetchExamAttemptsDataUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/course_id/${courseId}`
    + `?content_id=${encodeURIComponent(contentId)}&is_learning_mfe=true`;
  const updateAttemptStatusUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/${attempt.attempt_id}`;
  let store;

  beforeEach(async () => {
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
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam, active_attempt: attempt });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);

      const state = store.getState();
      expect(state).toMatchSnapshot();
    });

    it('Should fail to fetch if error occurs', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).networkError();

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);

      const state = store.getState();
      expect(state.examState.apiErrorMsg).toBe('Network Error');
    });
  });

  describe('Test getProctoringSettings', () => {
    const fetchProctoringSettingsUrl = `${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/settings/exam_id/${exam.id}/`;
    const proctoringSettings = Factory.build('proctoringSettings');

    it('Should get, and save proctoringSettings', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam, active_attempt: attempt });
      axiosMock.onGet(fetchProctoringSettingsUrl).reply(200, proctoringSettings);

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
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
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam, active_attempt: attempt });
      axiosMock.onGet(fetchProctoringSettingsUrl).networkError();

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.getProctoringSettings(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.examState.apiErrorMsg).toBe('Network Error');
    });
  });

  describe('Test getExamReviewPolicy', () => {
    const getExamReviewPolicyUrl = `${getConfig().LMS_BASE_URL}/api/edx_proctoring/v1/proctored_exam/review_policy/exam_id/${exam.id}/`;
    const reviewPolicy = 'Example review policy.';

    it('Should get, and save getExamReviewPolicy', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam, active_attempt: attempt });
      axiosMock.onGet(getExamReviewPolicyUrl).reply(200, { review_policy: reviewPolicy });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.getExamReviewPolicy(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.examState.exam.reviewPolicy).toEqual(reviewPolicy);
    });

    it('Should fail to fetch if error occurs', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam, active_attempt: attempt });
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
    const createExamAttemptUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}`;

    it('Should start exam, and update attempt and exam', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam, active_attempt: {} });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam, active_attempt: attempt });
      axiosMock.onPost(createExamAttemptUrl).reply(200, { exam_attempt_id: attempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      let state = store.getState();
      expect(state.examState.activeAttempt).toBeNull();

      await executeThunk(thunks.startTimedExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.activeAttempt).toMatchSnapshot();
    });

    it('Should fail to fetch if no exam id', async () => {
      axiosMock.onPost(createExamAttemptUrl).reply(200, { exam_attempt_id: attempt.attempt_id });

      await executeThunk(thunks.startTimedExam(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.examState.apiErrorMsg).toBe('Failed to start exam. No exam id was found.');
    });
  });

  describe('Test stopExam', () => {
    const readyToSubmitAttempt = Factory.build('attempt', { attempt_status: ExamStatus.READY_TO_SUBMIT });
    const readyToSubmitExam = Factory.build('exam', { attempt: readyToSubmitAttempt });

    it('Should stop exam, and update attempt and exam', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam, active_attempt: attempt });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: readyToSubmitExam, active_attempt: {} });
      axiosMock.onPut(updateAttemptStatusUrl).reply(200, { exam_attempt_id: readyToSubmitAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      let state = store.getState();
      expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.STARTED);

      await executeThunk(thunks.stopExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.READY_TO_SUBMIT);
    });

    it('Should stop exam, and redirect to sequence if no exam attempt', async () => {
      const { location } = window;
      delete window.location;
      window.location = {
        href: '',
      };

      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam: {}, active_attempt: attempt });
      axiosMock.onPut(updateAttemptStatusUrl).reply(200, { exam_attempt_id: readyToSubmitAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      const state = store.getState();
      expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.STARTED);

      await executeThunk(thunks.stopExam(), store.dispatch, store.getState);
      expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusUrl);
      expect(window.location.href).toEqual(attempt.exam_url_path);

      window.location = location;
    });

    it('Should fail to fetch if error occurs', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam: {}, active_attempt: attempt });
      axiosMock.onPut(updateAttemptStatusUrl).networkError();

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      let state = store.getState();
      expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.STARTED);

      await executeThunk(thunks.stopExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.apiErrorMsg).toBe('Network Error');
    });

    it('Should fail to fetch if no active attempt', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: Factory.build('exam'), active_attempt: {} });
      axiosMock.onGet(updateAttemptStatusUrl).reply(200, { exam_attempt_id: readyToSubmitAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.stopExam(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.examState.apiErrorMsg).toBe('Failed to stop exam. No active attempt was found.');
    });
  });

  describe('Test continueExam', () => {
    const readyToSubmitAttempt = Factory.build('attempt', { attempt_status: ExamStatus.READY_TO_SUBMIT });
    const readyToSubmitExam = Factory.build('exam', { attempt: readyToSubmitAttempt });

    it('Should stop exam, and update attempt and exam', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam: readyToSubmitExam, active_attempt: {} });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam, active_attempt: attempt });
      axiosMock.onPost(updateAttemptStatusUrl).reply(200, { exam_attempt_id: attempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      let state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.READY_TO_SUBMIT);

      await executeThunk(thunks.continueExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);
    });

    it('Should fail to fetch if no attempt id', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: Factory.build('exam'), active_attempt: {} });
      axiosMock.onGet(updateAttemptStatusUrl).reply(200, { exam_attempt_id: attempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.continueExam(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.examState.apiErrorMsg).toBe('Failed to continue exam. No attempt id was found.');
    });
  });

  describe('Test resetExam', () => {
    const createdAttempt = Factory.build('attempt',
      {
        attempt_status: ExamStatus.CREATED,
        attempt_id: 2,
      });
    const examWithCreatedAttempt = Factory.build('exam', { attempt: createdAttempt });

    it('Should reset exam, and update attempt and exam', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam, active_attempt: attempt });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: examWithCreatedAttempt, active_attempt: {} });
      axiosMock.onPost(updateAttemptStatusUrl).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      let state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

      await executeThunk(thunks.continueExam(), store.dispatch, store.getState);

      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.CREATED);
      expect(state).toMatchSnapshot();
    });

    it('Should fail to fetch if no attempt id', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: Factory.build('exam'), active_attempt: {} });
      axiosMock.onGet(updateAttemptStatusUrl).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.resetExam(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.examState.apiErrorMsg).toBe('Failed to reset exam attempt. No attempt id was found.');
    });
  });

  describe('Test submitExam', () => {
    const submittedAttempt = Factory.build('attempt', { attempt_status: ExamStatus.SUBMITTED });
    const submittedExam = Factory.build('exam', { attempt: submittedAttempt });

    it('Should submit exam, and update attempt and exam', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam, active_attempt: attempt });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: submittedExam, active_attempt: {} });
      axiosMock.onPost(updateAttemptStatusUrl).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      let state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

      await executeThunk(thunks.submitExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.SUBMITTED);
    });

    it('Should fail to fetch if no attempt id', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: Factory.build('exam'), active_attempt: {} });
      axiosMock.onGet(updateAttemptStatusUrl).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
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

      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam: {}, active_attempt: attempt });
      axiosMock.onPut(updateAttemptStatusUrl).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      const state = store.getState();
      expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.STARTED);

      await executeThunk(thunks.submitExam(), store.dispatch, store.getState);
      expect(axiosMock.history.put[0].url).toEqual(updateAttemptStatusUrl);
      expect(window.location.href).toEqual(attempt.exam_url_path);

      window.location = location;
    });

    it('Should fail to fetch if error occurs', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam: {}, active_attempt: attempt });
      axiosMock.onPut(updateAttemptStatusUrl).networkError();

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      let state = store.getState();
      expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.STARTED);

      await executeThunk(thunks.submitExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.apiErrorMsg).toBe('Network Error');
      expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.STARTED);
    });
  });

  describe('Test expireExam', () => {
    const submittedAttempt = Factory.build('attempt', { attempt_status: ExamStatus.SUBMITTED });
    const submittedExam = Factory.build('exam', { attempt: submittedAttempt });

    it('Should expire exam, and update attempt and exam', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam, active_attempt: attempt });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: submittedExam, active_attempt: {} });
      axiosMock.onPost(updateAttemptStatusUrl).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      let state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

      await executeThunk(thunks.expireExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.SUBMITTED);
      expect(state.examState.timeIsOver).toBe(true);
    });

    it('Should fail to fetch if no attempt id', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: Factory.build('exam'), active_attempt: {} });
      axiosMock.onGet(updateAttemptStatusUrl).reply(200, { exam_attempt_id: submittedAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.expireExam(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.examState.apiErrorMsg).toBe('Failed to expire exam. No attempt id was found.');
    });
  });

  describe('Test startProctoringSoftwareDownload', () => {
    const softwareDownloadedAttempt = Factory.build('attempt', { attempt_status: ExamStatus.DOWNLOAD_SOFTWARE_CLICKED });
    const softwareDownloadedExam = Factory.build('exam', { attempt: softwareDownloadedAttempt });

    it('Should start downloading proctoring software, and update attempt and exam', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam, active_attempt: attempt });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: softwareDownloadedExam, active_attempt: {} });
      axiosMock.onPost(updateAttemptStatusUrl).reply(200, { exam_attempt_id: softwareDownloadedAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      let state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.STARTED);

      await executeThunk(thunks.startProctoringSoftwareDownload(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.DOWNLOAD_SOFTWARE_CLICKED);
    });

    it('Should fail to start if no attempt id', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: Factory.build('exam'), active_attempt: {} });
      axiosMock.onGet(updateAttemptStatusUrl).reply(200, { exam_attempt_id: softwareDownloadedAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.startProctoringSoftwareDownload(), store.dispatch, store.getState);

      expect(loggingService.logError).toHaveBeenCalled();
    });
  });

  describe('Test createProctoredExamAttempt', () => {
    const createdAttempt = Factory.build('attempt', { attempt_status: ExamStatus.CREATED });
    const createdExam = Factory.build('exam', { attempt: createdAttempt });

    it('Should create exam attempt, and update attempt and exam', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam: Factory.build('exam'), active_attempt: {} });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: createdExam, active_attempt: {} });
      axiosMock.onPost(updateAttemptStatusUrl).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      let state = store.getState();
      expect(state.examState.exam.attempt).toEqual({});

      await executeThunk(thunks.createProctoredExamAttempt(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.CREATED);
    });

    it('Should fail to start if no attempt id', async () => {
      axiosMock.onGet(updateAttemptStatusUrl).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

      await executeThunk(thunks.createProctoredExamAttempt(), store.dispatch, store.getState);

      expect(loggingService.logError).toHaveBeenCalled();
    });
  });

  describe('Test startProctoredExam', () => {
    const createdAttempt = Factory.build('attempt', { attempt_status: ExamStatus.CREATED });
    const startedAttempt = Factory.build('attempt', { attempt_status: ExamStatus.STARTED });
    const createdExam = Factory.build('exam', { attempt: createdAttempt });
    const startedExam = Factory.build('exam', { attempt: startedAttempt });
    const continueAttemptUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/${createdAttempt.attempt_id}`;

    it('Should start exam, and update attempt and exam', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam: createdExam, active_attempt: createdAttempt });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: startedExam, active_attempt: startedAttempt });
      axiosMock.onPost(continueAttemptUrl).reply(200, { exam_attempt_id: startedAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      let state = store.getState();
      expect(state.examState.activeAttempt.attempt_status).toBe(ExamStatus.CREATED);

      await executeThunk(thunks.startProctoredExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.activeAttempt).toMatchSnapshot();
    });

    it('Should fail to fetch if no exam id', async () => {
      axiosMock.onPost(continueAttemptUrl).reply(200, { exam_attempt_id: createdAttempt.attempt_id });

      await executeThunk(thunks.startProctoredExam(), store.dispatch, store.getState);

      expect(loggingService.logError).toHaveBeenCalled();
    });

    it('Should log an error on worker failure', async () => {
      windowSpy.mockImplementation(() => ({
        Worker: jest.fn(),
        URL: { createObjectURL: jest.fn() },
      }));

      const createdWorkerAttempt = Factory.build(
        'attempt', { attempt_status: ExamStatus.CREATED, desktop_application_js_url: 'http://proctortest.com' },
      );
      const startedWorkerAttempt = Factory.build(
        'attempt', { attempt_status: ExamStatus.STARTED, desktop_application_js_url: 'http://proctortest.com' },
      );
      const createdWorkerExam = Factory.build('exam', { attempt: createdWorkerAttempt });
      const startedWorkerExam = Factory.build('exam', { attempt: startedWorkerAttempt });
      const continueWorkerAttemptUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/${createdWorkerAttempt.attempt_id}`;

      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(
        200, { exam: createdWorkerExam, active_attempt: createdWorkerAttempt },
      );
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(
        200, { exam: startedWorkerExam, active_attempt: startedWorkerAttempt },
      );
      axiosMock.onPost(continueWorkerAttemptUrl).reply(200, { exam_attempt_id: startedWorkerAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.startProctoredExam(), store.dispatch, store.getState);
      expect(loggingService.logError).toHaveBeenCalledWith(
        'test error', {
          attemptId: createdWorkerAttempt.attempt_id,
          attemptStatus: createdWorkerAttempt.attempt_status,
          courseId: createdWorkerAttempt.course_id,
          examId: createdWorkerExam.id,
        },
      );
    });
  });

  describe('Test skipProctoringExam', () => {
    const createdAttempt = Factory.build('attempt',
      {
        attempt_status: ExamStatus.CREATED,
      });
    const createdExam = Factory.build('exam', { attempt: createdAttempt });
    const declinedAttempt = Factory.build('attempt', { attempt_status: ExamStatus.DECLINED });
    const declinedExam = Factory.build('exam', { attempt: declinedAttempt });

    it('Should create exam attempt with declined status, and update attempt and exam', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam: Factory.build('exam'), active_attempt: {} });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: declinedExam, active_attempt: {} });
      axiosMock.onPost(updateAttemptStatusUrl).reply(200, { exam_attempt_id: declinedAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      let state = store.getState();
      expect(state.examState.exam.attempt).toEqual({});

      await executeThunk(thunks.skipProctoringExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.DECLINED);
    });

    it('Should change attempt status to declined, and update attempt and exam', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam: createdExam, active_attempt: {} });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: declinedExam, active_attempt: {} });
      axiosMock.onPost(updateAttemptStatusUrl).reply(200, { exam_attempt_id: declinedAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      let state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toEqual(ExamStatus.CREATED);

      await executeThunk(thunks.skipProctoringExam(), store.dispatch, store.getState);
      state = store.getState();
      expect(state.examState.exam.attempt.attempt_status).toBe(ExamStatus.DECLINED);
    });

    it('Should fail to start if no attempt id', async () => {
      axiosMock.onGet(updateAttemptStatusUrl).reply(200, { exam_attempt_id: declinedAttempt.attempt_id });

      await executeThunk(thunks.skipProctoringExam(), store.dispatch, store.getState);

      expect(loggingService.logError).toHaveBeenCalled();
    });
  });

  describe('Test pollAttempt', () => {
    const pollExamAttemptUrl = `${getConfig().LMS_BASE_URL}${attempt.exam_started_poll_url}`;

    it('Should poll exam attempt, and update attempt and exam', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam, active_attempt: attempt });
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
      expect(state.examState.exam.attempt).toMatchSnapshot();
    });

    it('Should fail to start if no attempt id', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam, active_attempt: attempt });
      axiosMock.onGet(pollExamAttemptUrl).networkError();

      await executeThunk(thunks.pollAttempt(attempt.exam_started_poll_url), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.examState.apiErrorMsg).toBe('Network Error');
    });
  });

  describe('Test pingAttempt', () => {
    it('Should send attempt to error state on ping failure', async () => {
      const startedWorkerAttempt = Factory.build(
        'attempt', { attempt_status: ExamStatus.STARTED, desktop_application_js_url: 'http://proctortest.com' },
      );
      const startedWorkerExam = Factory.build('exam', { attempt: startedWorkerAttempt });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(
        200, { exam: startedWorkerExam, active_attempt: startedWorkerAttempt },
      );
      axiosMock.onPut(updateAttemptStatusUrl).reply(200, { exam_attempt_id: startedWorkerAttempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.pingAttempt(), store.dispatch, store.getState);

      expect(loggingService.logError).toHaveBeenCalledWith(
        'test error', {
          attemptId: startedWorkerAttempt.attempt_id,
          attemptStatus: startedWorkerAttempt.attempt_status,
          courseId: startedWorkerAttempt.course_id,
          examId: startedWorkerExam.id,
        },
      );
      const request = axiosMock.history.put[0];
      expect(request.url).toEqual(updateAttemptStatusUrl);
      expect(request.data).toEqual(JSON.stringify({
        action: 'error',
        detail: 'test error',
      }));
    });
  });

  describe('Test getLatestAttemptData', () => {
    it('Should get, and save latest attempt', async () => {
      const attemptDataUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/course_id/${courseId}?is_learning_mfe=true`;
      axiosMock.onGet(attemptDataUrl).reply(200, { exam: {}, active_attempt: attempt });

      await executeThunk(thunks.getLatestAttemptData(courseId), store.dispatch);

      const state = store.getState();
      expect(state).toMatchSnapshot();
    });
  });

  describe('Test exams IDA url', () => {
    beforeAll(async () => {
      mergeConfig({
        EXAMS_BASE_URL: process.env.EXAMS_BASE_URL || null,
      });
    });

    it('Should call the exams service for create attempt', async () => {
      const createExamAttemptURL = `${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt`;
      const examURL = `${getConfig().EXAMS_BASE_URL}/api/v1/student/exam/attempt/course_id/${courseId}/content_id/${contentId}`;
      const activeAttemptURL = `${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt/latest`;

      axiosMock.onGet(examURL).reply(200, { exam });
      axiosMock.onGet(activeAttemptURL).reply(200, {});
      axiosMock.onPost(createExamAttemptURL).reply(200, { exam_attempt_id: 1111111 });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.startTimedExam(), store.dispatch, store.getState);

      expect(axiosMock.history.post[0].url).toEqual(createExamAttemptURL);
    });

    it('Should call the exams service for update attempt', async () => {
      const updateExamAttemptURL = `${getConfig().EXAMS_BASE_URL}/api/v1/attempt/${attempt.attempt_id}`;
      const examURL = `${getConfig().EXAMS_BASE_URL}/api/v1/student/exam/attempt/course_id/${courseId}/content_id/${contentId}`;
      const activeAttemptURL = `${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt/latest`;

      axiosMock.onGet(examURL).reply(200, { exam });
      axiosMock.onGet(activeAttemptURL).reply(200, { attempt });
      axiosMock.onPut(updateExamAttemptURL).reply(200, { exam_attempt_id: attempt.attempt_id });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.stopExam(), store.dispatch, store.getState);
      expect(axiosMock.history.put[0].url).toEqual(updateExamAttemptURL);
    });

    it('Should call the exams service to fetch attempt data', async () => {
      const examURL = `${getConfig().EXAMS_BASE_URL}/api/v1/student/exam/attempt/course_id/${courseId}/content_id/${contentId}`;
      const activeAttemptURL = `${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt/latest`;

      axiosMock.onGet(examURL).reply(200, { exam });
      axiosMock.onGet(activeAttemptURL).reply(200, { attempt });

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);

      expect(axiosMock.history.get[0].url).toEqual(examURL);
      expect(axiosMock.history.get[1].url).toEqual(activeAttemptURL);

      const state = store.getState();
      expect(state).toMatchSnapshot();
    });

    it('Should call the exams service to get latest attempt data', async () => {
      const activeAttemptURL = `${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt/latest`;

      // Updated attempt with changed status
      const updatedAttempt = Factory.build('attempt', { attempt_status: ExamStatus.SUBMITTED });

      // Get initial data first, then updated data when calling pollAttempt
      axiosMock.onGet(activeAttemptURL).replyOnce(200, { attempt });
      axiosMock.onGet(activeAttemptURL).reply(200, { attempt: updatedAttempt });

      // Get data, initialize state
      // console.log("ATTEMPT:",attempt)
      await executeThunk(thunks.getLatestAttemptData(courseId), store.dispatch);
      const beforeState = store.getState();
      // console.log("BEFORE:",beforeState);
      expect(beforeState.examState.activeAttempt).toEqual(attempt);

      // Poll with initialized state
      // console.log("UPDATED ATTEMPT:",updatedAttempt)
      const dummyURL = `${getConfig().EXAMS_BASE_URL}/edx-proctoring/dummy-url`;
      await executeThunk(thunks.pollAttempt(dummyURL), store.dispatch, store.getState);
      const afterState = store.getState();
      // console.log("AFTER:",afterState);
      expect(afterState.examState.activeAttempt).toEqual(updatedAttempt);

      expect(axiosMock.history.get[0].url).toEqual(activeAttemptURL);
      expect(axiosMock.history.get[1].url).toEqual(activeAttemptURL);

      expect(afterState).toMatchSnapshot();
      expect(beforeState).not.toEqual(afterState); // Test that the state was updated when polled
    });
  });
});
