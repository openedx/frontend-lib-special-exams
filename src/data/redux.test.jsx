import { Factory } from 'rosie';
import MockAdapter from 'axios-mock-adapter';

import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig, mergeConfig } from '@edx/frontend-platform';

import * as api from './api';
import * as thunks from './thunks';

import executeThunk from '../utils';

import { initializeTestStore, initializeMockApp, initializeTestConfig } from '../setupTest';
import { ExamStatus, ExamType } from '../constants';

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

  // This is a shorthand to check snapshots with an asymmetric matcher every time.
  const expectStoreToMatchSnapshot = (data) => expect(data).toMatchSnapshot({
    specialExams: {
      activeAttempt: {
        timer_ends: expect.any(String),
      },
    },
  });

  beforeEach(() => {
    initializeTestConfig();
    windowSpy = jest.spyOn(window, 'window', 'get');
    axiosMock.reset();
    loggingService.logError.mockReset();
    loggingService.logInfo.mockReset();
    store = initializeTestStore();
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  it('Test getAllowProctoringOptOut', async () => {
    await executeThunk(thunks.getAllowProctoringOptOut(true), store.dispatch);

    const state = store.getState();
    expect(state.specialExams.allowProctoringOptOut).toEqual(true);
  });

  describe('Test getExamAttemptsData', () => {
    it('Should get, and save exam and attempt', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam });
      axiosMock.onGet(latestAttemptURL).replyOnce(200, attempt);

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);

      const state = store.getState();
      expectStoreToMatchSnapshot(state);
    });

    it('Should translate total time correctly', async () => {
      // configure exam whose total_time field is an int. This matches what is returned by edx-exams
      exam.total_time = 30;

      axiosMock.onGet(fetchExamAttemptsDataUrl).replyOnce(200, { exam });
      axiosMock.onGet(latestAttemptURL).replyOnce(200, attempt);

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);

      const state = store.getState();
      expect(state.specialExams.exam.total_time).toBe('30 minutes');
    });

    it('Should fail to fetch if error occurs', async () => {
      axiosMock.onGet(fetchExamAttemptsDataUrl).networkError();

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);

      const state = store.getState();
      expect(state.specialExams.apiErrorMsg).toBe('Network Error');
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
        expect(state.specialExams.proctoringSettings).toMatchSnapshot();
      });
    });

    it('Should get, and save proctoringSettings', async () => {
      await initWithExamAttempt();
      axiosMock.onGet(fetchProctoringSettingsUrl).reply(200, proctoringSettings);

      await executeThunk(thunks.getProctoringSettings(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.specialExams.proctoringSettings).toMatchSnapshot();
    });

    it('Should fail to fetch if error occurs', async () => {
      axiosMock.onGet(fetchProctoringSettingsUrl).reply(200, proctoringSettings);

      await executeThunk(thunks.getProctoringSettings(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.specialExams.proctoringSettings).toMatchSnapshot();
    });

    it('Should fail to fetch if error occurs', async () => {
      await initWithExamAttempt();
      axiosMock.onGet(fetchProctoringSettingsUrl).networkError();

      await executeThunk(thunks.getProctoringSettings(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.specialExams.apiErrorMsg).toBe('Network Error');
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
      expect(state.specialExams.exam.reviewPolicy).toEqual(reviewPolicy);
    });

    it('Should fail to fetch if error occurs', async () => {
      axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).reply(200, { exam, active_attempt: attempt });
      axiosMock.onGet(getExamReviewPolicyUrl).networkError();

      await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
      await executeThunk(thunks.getExamReviewPolicy(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.specialExams.apiErrorMsg).toBe('Network Error');
    });

    it('Should fail to fetch if no exam id', async () => {
      axiosMock.onGet(getExamReviewPolicyUrl).reply(200, { review_policy: 'Example review policy.' });

      await executeThunk(thunks.getExamReviewPolicy(), store.dispatch, store.getState);

      const state = store.getState();
      expect(loggingService.logError).toHaveBeenCalled();
      expect(state.specialExams.exam.reviewPolicy).toBeUndefined();
    });
  });

  describe('Test pollAttempt', () => {
    describe('with edx-proctoring as a backend (no EXAMS_BASE_URL)', () => {
      const pollExamAttemptUrl = `${getConfig().LMS_BASE_URL}${attempt.exam_started_poll_url}`;
      beforeEach(async () => {
        mergeConfig({ EXAMS_BASE_URL: null });
      });

      it('Should poll and update active attempt with legacy proctoring backend', async () => {
        axiosMock.onGet(fetchExamAttemptsDataLegacyUrl).replyOnce(200, { exam, active_attempt: attempt });
        axiosMock.onGet(pollExamAttemptUrl).reply(200, {
          time_remaining_seconds: 1739.9,
          accessibility_time_string: 'you have 29 minutes remaining',
          attempt_status: ExamStatus.STARTED,
        });

        await executeThunk(thunks.getExamAttemptsData(courseId, contentId), store.dispatch);
        let state = store.getState();
        expect(state.specialExams.exam.attempt).toMatchSnapshot();

        await executeThunk(thunks.pollAttempt(attempt.exam_started_poll_url), store.dispatch, store.getState);
        state = store.getState();
        const expectedPollUrl = `${getConfig().LMS_BASE_URL}${attempt.exam_started_poll_url}`;
        expect(state.specialExams.exam.attempt).toMatchSnapshot();
        expect(axiosMock.history.get[1].url).toEqual(expectedPollUrl);
      });
    });

    it('Should poll and update active attempt with new proctoring backend', async () => {
      await initWithExamAttempt(exam, attempt);
      // Reset history so we can get url at index 0 later
      axiosMock.resetHistory();

      const attemptToPollURL = `${latestAttemptURL}?content_id=block-v1%3Atest%2Bspecial%2Bexam%2Btype%40sequential%2Bblock%40abc123`;
      axiosMock.onGet(attemptToPollURL).reply(200, {
        time_remaining_seconds: 1739.9,
        accessibility_time_string: 'you have 29 minutes remaining',
        attempt_status: ExamStatus.STARTED,
      });

      // Make sure the thunk eventually calls the right URL
      await executeThunk(thunks.pollAttempt(null, exam.content_id), store.dispatch, store.getState);
      const state = store.getState();
      expect(axiosMock.history.get[0].url).toEqual(attemptToPollURL);
      expect(state.specialExams.activeAttempt).toMatchSnapshot({
        // Allow for the timer_ends value to be any string, as it varies by milliseconds depending
        // on how fast this test runs just about every time.
        timer_ends: expect.any(String),
      });
    });

    it('Should refresh exam state from backend if polled attempt has ended in error', async () => {
      const errorAttempt = Factory.build('attempt', { attempt_status: ExamStatus.ERROR });
      const errorExam = Factory.build('exam', { attempt: errorAttempt });

      await initWithExamAttempt(exam, attempt);
      const attemptToPollURL = `${latestAttemptURL}?content_id=block-v1%3Atest%2Bspecial%2Bexam%2Btype%40sequential%2Bblock%40abc123`;
      axiosMock.onGet(attemptToPollURL).reply(200, {
        time_remaining_seconds: 0,
        accessibility_time_string: 'you have 0 minutes remaining',
        attempt_status: ExamStatus.ERROR,
      });
      axiosMock.onGet(fetchExamAttemptsDataUrl).reply(200, { exam: errorExam, active_attempt: {} });

      axiosMock.resetHistory();
      await executeThunk(thunks.pollAttempt(null, exam.content_id), store.dispatch, store.getState);
      const state = store.getState();
      expect(axiosMock.history.get[0].url).toEqual(attemptToPollURL);
      expect(axiosMock.history.get[1].url).toEqual(fetchExamAttemptsDataUrl);
      expect(state.specialExams.exam.attempt.attempt_status).toBe(ExamStatus.ERROR);
    });

    describe('pollAttempt api called directly', () => {
      // in the download view we call this function directly without invoking the wrapping thunk
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
      test('should call the latest attempt w/o a sequence if if neither a pollUrl or sequence id is provided', async () => {
        const expectedUrl = `${getConfig().EXAMS_BASE_URL}/api/v1/exams/attempt/latest`;
        axiosMock.onGet(expectedUrl).reply(200, {
          time_remaining_seconds: 1739.9,
          status: ExamStatus.STARTED,
        });
        await api.pollExamAttempt(null);
        expect(axiosMock.history.get[0].url).toEqual(expectedUrl);
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
        expectStoreToMatchSnapshot(state);
      });
    });

    it('Should get, and save latest attempt', async () => {
      await initWithExamAttempt();

      axiosMock.onGet(latestAttemptURL).reply(200, Factory.build('attempt', { attempt_id: 1234 }));

      await executeThunk(thunks.getLatestAttemptData(courseId), store.dispatch);

      const state = store.getState();
      expect(state.specialExams.activeAttempt.attempt_id).toEqual(1234);
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
        expect(state.specialExams.exam.id).toBe(exam.id);
        expect(state.specialExams.examAccessToken.exam_access_token).toBe('');
      });
    });

    it('Should get exam access token', async () => {
      const examAccessToken = Factory.build('examAccessToken');

      await initWithExamAttempt();
      axiosMock.onGet(fetchExamAccessUrl).reply(200, examAccessToken);
      await executeThunk(thunks.examRequiresAccessToken(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.specialExams.examAccessToken).toMatchSnapshot();
    });

    it('Should fail to fetch if no exam id', async () => {
      axiosMock.onGet(fetchExamAccessUrl).reply(200, {});
      await executeThunk(thunks.examRequiresAccessToken(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.specialExams.examAccessToken.exam_access_token).toBe('');
    });

    it('Should fail to fetch if API error occurs', async () => {
      await initWithExamAttempt();
      axiosMock.onGet(fetchExamAccessUrl).reply(400, { detail: 'Exam access token not granted' });

      await executeThunk(thunks.examRequiresAccessToken(), store.dispatch, store.getState);

      const state = store.getState();
      expect(state.specialExams.examAccessToken.exam_access_token).toBe('');
    });
  });

  describe('Test checkExamEntry', () => {
    const mockPostMessage = jest.fn();
    const mockAddEventListener = jest.fn();

    beforeEach(() => {
      windowSpy.mockImplementation(() => ({
        top: {
          postMessage: mockPostMessage,
        },
        location: {
          origin: 'https://edx.example.com',
        },
        addEventListener: mockAddEventListener,
        removeEventListener: jest.fn(),
      }));
    });

    afterEach(() => {
      jest.clearAllMocks();
      axiosMock.reset();
    });

    it('should check application status for LTI proctored exams in a proctored state', async () => {
      const proctoredAttempt = Factory.build('attempt', { attempt_status: ExamStatus.READY_TO_START, exam_type: ExamType.PROCTORED });
      const proctoredExam = Factory.build('exam', { type: ExamType.PROCTORED, attempt: proctoredAttempt });
      await initWithExamAttempt(proctoredExam, proctoredAttempt);

      await executeThunk(thunks.checkExamEntry(), store.dispatch, store.getState);
      await new Promise(process.nextTick);
      expect(mockPostMessage).toHaveBeenCalled();
    });

    it('should not check application status for non-LTI proctored exams', async () => {
      const proctoredAttempt = Factory.build('attempt', { attempt_status: ExamStatus.READY_TO_START, exam_type: ExamType.PROCTORED, use_legacy_attempt_api: true });
      const proctoredExam = Factory.build('exam', { type: ExamType.PROCTORED, attempt: proctoredAttempt });
      await initWithExamAttempt(proctoredExam, proctoredAttempt);

      await executeThunk(thunks.checkExamEntry(), store.dispatch, store.getState);
      await new Promise(process.nextTick);
      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('should not check application status for exams in a non-proctored state', async () => {
      const nonProctoredAttempt = Factory.build('attempt', { attempt_status: ExamStatus.CREATED });
      const proctoredExam = Factory.build('exam', { attempt: nonProctoredAttempt });
      await initWithExamAttempt(proctoredExam, nonProctoredAttempt);

      await executeThunk(thunks.checkExamEntry(), store.dispatch, store.getState);
      await new Promise(process.nextTick);
      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('should not check timed exams', async () => {
      // default exam is timed
      await initWithExamAttempt();

      await executeThunk(thunks.checkExamEntry(), store.dispatch, store.getState);
      await new Promise(process.nextTick);
      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('should transition to error state if check fails', async () => {
      const proctoredAttempt = Factory.build('attempt', { attempt_status: ExamStatus.READY_TO_START, exam_type: ExamType.PROCTORED });
      const proctoredExam = Factory.build('exam', { type: ExamType.PROCTORED, attempt: proctoredAttempt });
      await initWithExamAttempt(proctoredExam, proctoredAttempt);

      await executeThunk(thunks.checkExamEntry(), store.dispatch, store.getState);

      await new Promise(process.nextTick);
      const handleResponseCb = mockAddEventListener.mock.calls[0][1];
      axiosMock.onPut(`${createUpdateAttemptURL}/${proctoredAttempt.attempt_id}`).reply(200, { exam_attempt_id: proctoredAttempt.attempt_id });
      handleResponseCb({ origin: 'http://localhost:18740', data: { active: false } });

      await new Promise(process.nextTick);
      const request = axiosMock.history.put[0];
      expect(request.data).toEqual(JSON.stringify({
        action: 'error',
        detail: 'exam reentry disallowed',
      }));
    });

    it('should not transition to error state if check succeeds', async () => {
      const proctoredAttempt = Factory.build('attempt', { attempt_status: ExamStatus.READY_TO_START, exam_type: ExamType.PROCTORED });
      const proctoredExam = Factory.build('exam', { type: ExamType.PROCTORED, attempt: proctoredAttempt });
      await initWithExamAttempt(proctoredExam, proctoredAttempt);

      await executeThunk(thunks.checkExamEntry(), store.dispatch, store.getState);

      await new Promise(process.nextTick);
      const handleResponseCb = mockAddEventListener.mock.calls[0][1];
      handleResponseCb({ origin: 'http://localhost:18740', data: { active: true } });

      await new Promise(process.nextTick);
      expect(axiosMock.history.put.length).toBe(0);
    });
  });
});
