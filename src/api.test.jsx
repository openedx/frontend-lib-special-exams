import { isExam, getExamAccess, fetchExamAccess } from './api';

describe('External API integration tests', () => {
  let store;

  describe('Test isExam', () => {
    it('Should return false if exam is not set', async () => {
      expect(isExam()).toBe(false);
    });
  });

  describe('Test getExamAccess', () => {
    it('Should return empty string if no access token', async () => {
      expect(getExamAccess()).toBe('');
    });
  });

  describe('Test fetchExamAccess', () => {
    it('Should dispatch get exam access token', async () => {
      const mockDispatch = jest.fn(() => store.dispatch);
      const mockState = jest.fn(() => store.getState);
      const dispatchReturn = fetchExamAccess(mockDispatch, mockState);
      expect(dispatchReturn).toBeInstanceOf(Promise);
    });
  });
});
