import { Factory } from 'rosie';
import MockAdapter from 'axios-mock-adapter';

import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

import * as thunks from './thunks';

import executeThunk from '../utils';

import { initializeTestStore, initializeMockApp } from '../setupTest';
import { ExamStatus } from '../constants';

const BASE_API_URL = '/api/edx_proctoring/v1/proctored_exam/attempt';

const { loggingService } = initializeMockApp();
const axiosMock = new MockAdapter(getAuthenticatedHttpClient());

describe('Data layer integration tests', () => {
  const exam = Factory.build('exam', { attempt: Factory.build('attempt') });
  const { course_id: courseId, content_id: contentId, attempt } = exam;
  const fetchExamAttemptsDataUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/course_id/${courseId}`
    + `?content_id=${encodeURIComponent(contentId)}&is_learning_mfe=true`;
  const updateAttemptStatusUrl = `${getConfig().LMS_BASE_URL}${BASE_API_URL}/${attempt.attempt_id}`;
  let store;

  beforeEach(async () => {
    axiosMock.reset();
    loggingService.logError.mockReset();
    store = await initializeTestStore();
  });
  describe('Test getVerificationData', () => {
    const getVerificationDataUrl = `${getConfig().LMS_BASE_URL}/verify_student/status/`;

    it('Should get, and save verification', async () => {
      axiosMock.onGet(getVerificationDataUrl).reply(200, { status: 'none', can_verify: true });

      await executeThunk(thunks.getVerificationData(), store.dispatch);

      const state = store.getState();
      expect(state.examState.verification).toMatchSnapshot();
    });

    it('Should fail to fetch if error occurs', async () => {
      axiosMock.onGet(getVerificationDataUrl).networkError();

      await executeThunk(thunks.getVerificationData(), store.dispatch);

      const state = store.getState();
      expect(state.examState.apiErrorMsg).toBe('Network Error');
    });
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
});
