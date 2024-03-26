import { Factory } from 'rosie';

import { useExamAccessToken, useFetchExamAccessToken, useIsExam } from './api';
import { initializeMockApp, initializeTestStore, render } from './setupTest';

/**
 * Hooks must be run in the scope of a component. To run the hook, wrap it in a test component whose sole
 * responsibility it is to run the hook and assign it to a return value that is returned by the function.
 * @param {*} hook: the hook function to run
 * @param {*} store: an initial store, passed to the call to render
 * @returns: the return value of the hook
 */
const getHookReturnValue = (hook, store) => {
  let returnVal;
  const TestComponent = () => {
    returnVal = hook();
    return null;
  };
  render(<TestComponent />, { store });
  return returnVal;
};

describe('External API integration tests', () => {
  describe('Test useIsExam with exam', () => {
    let store;

    beforeAll(() => {
      initializeMockApp();
      const mockExam = Factory.build('exam', { attempt: Factory.build('attempt') });
      const mockToken = Factory.build('examAccessToken');
      const mockState = { specialExams: { exam: mockExam, examAccessToken: mockToken } };
      store = initializeTestStore(mockState);
    });

    afterAll(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it('useIsExam should return true if exam is set', () => {
      expect(getHookReturnValue(useIsExam, store)).toBe(true);
    });

    it('useExamAccessToken should return exam access token if access token', () => {
      expect(getHookReturnValue(useExamAccessToken, store)).toBeTruthy();
    });

    it('useFetchExamAccessToken should dispatch get exam access token', () => {
      // The useFetchExamAccessToken hook returns a function that calls dispatch, so we must call the returned
      // value to invoke dispatch.
      expect(getHookReturnValue(useFetchExamAccessToken, store)()).toBeInstanceOf(Promise);
    });
  });

  describe('Test useIsExam without exam', () => {
    let store;

    beforeAll(() => {
      jest.mock('./data');
      const mockState = { specialExams: { exam: null, examAccessToken: null } };
      store = initializeTestStore(mockState);
    });

    afterAll(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it('useIsExam should return false if exam is not set', () => {
      expect(getHookReturnValue(useIsExam, store)).toBe(false);
    });

    it('useExamAccessToken should return empty string if exam access token not set', () => {
      expect(getHookReturnValue(useExamAccessToken, store)).toBeFalsy();
    });

    it('useFetchExamAccessToken should not dispatch get exam access token', () => {
      expect(getHookReturnValue(useFetchExamAccessToken, store)).toBeInstanceOf(Promise);
    });
  });
});
