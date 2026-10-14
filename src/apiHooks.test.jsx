import { Factory } from 'rosie';
import MockAdapter from 'axios-mock-adapter';

import { useExamAccessToken, useIsExam } from './apiHooks';
import { specialExamsQueryKeys } from './data/queryKeys';
import {
  createTestQueryClient, httpClient, initializeMockApp, render, testConfig, waitFor,
} from './setupTest';

const { loggingService } = initializeMockApp();
const axiosMock = new MockAdapter(httpClient);

/**
 * Hooks must be run in the scope of a component. To run the hook, wrap it in a test component whose sole
 * responsibility it is to run the hook and expose its latest return value as `result.current`.
 * @param {*} hook: the hook function to run
 * @param {*} specialExams: the exam fixture to seed, passed to the call to render
 * @param {*} queryClient: the query client to render with, when the test seeds it itself
 * @returns: `{ current }`, the hook's return value from its latest render
 */
const renderHook = (hook, specialExams, queryClient = createTestQueryClient()) => {
  const result = {};
  const TestComponent = () => {
    result.current = hook();
    return null;
  };
  render(<TestComponent />, { specialExams, queryClient });
  return result;
};

describe('External API integration tests', () => {
  afterEach(() => {
    axiosMock.reset();
  });

  describe('under an exam sequence', () => {
    const mockExam = Factory.build('exam', { attempt: Factory.build('attempt') });
    const mockToken = Factory.build('examAccessToken');
    const accessTokenUrl = `${testConfig.examsBaseUrl}/api/v1/access_tokens/exam_id/${mockExam.id}/`;

    it('useIsExam should return true if exam is set', () => {
      expect(renderHook(useIsExam, { exam: mockExam }).current).toBe(true);
    });

    it('useExamAccessToken should return the exam access token', () => {
      expect(renderHook(useExamAccessToken, { exam: mockExam, examAccessToken: mockToken }).current).toEqual({
        accessToken: 'Z173480948902JK34432', isPending: false,
      });
    });

    it('useExamAccessToken should request the exam access token when it is not cached', async () => {
      axiosMock.onGet(accessTokenUrl).reply(200, mockToken);

      const result = renderHook(useExamAccessToken, { exam: mockExam });

      expect(result.current).toEqual({ accessToken: '', isPending: true });
      await waitFor(() => expect(result.current).toEqual({ accessToken: 'Z173480948902JK34432', isPending: false }));
      expect(axiosMock.history.get).toHaveLength(1);
    });

    it('useExamAccessToken should stay pending while a cached token is refreshed', async () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(specialExamsQueryKeys.accessToken(mockExam.id), mockToken);
      axiosMock.onGet(accessTokenUrl).reply(200, { ...mockToken, exam_access_token: 'FRESH' });

      const result = renderHook(useExamAccessToken, { exam: mockExam }, queryClient);

      expect(result.current).toEqual({ accessToken: 'Z173480948902JK34432', isPending: true });
      await waitFor(() => expect(result.current).toEqual({ accessToken: 'FRESH', isPending: false }));
    });

    it('useExamAccessToken should log when the exam access token is refused', async () => {
      axiosMock.onGet(accessTokenUrl).reply(400, { detail: 'Exam access token not granted' });

      renderHook(useExamAccessToken, { exam: mockExam });

      await waitFor(() => expect(loggingService.logError).toHaveBeenCalledWith('Exam access token was not granted.'));
    });
  });

  describe('without an exam', () => {
    it('useIsExam should return false if exam is not set', () => {
      expect(renderHook(useIsExam, { exam: null }).current).toBe(false);
    });

    it('useExamAccessToken should return an empty token and not be pending', () => {
      expect(renderHook(useExamAccessToken, { exam: null }).current).toEqual({ accessToken: '', isPending: false });
    });

    it('useExamAccessToken should not request an exam access token', () => {
      renderHook(useExamAccessToken, { exam: null });

      expect(axiosMock.history.get).toHaveLength(0);
    });
  });
});
