import { Factory } from 'rosie';

import { isExam, getExamAccess, fetchExamAccess } from './api';
import { store } from './data';

describe('External API integration tests', () => {
  describe('Test isExam with exam', () => {
    beforeAll(() => {
      jest.mock('./data');
      const mockExam = Factory.build('exam', { attempt: Factory.build('attempt') });
      const mockToken = Factory.build('examAccessToken');
      const mockState = { specialExams: { exam: mockExam, examAccessToken: mockToken } };
      store.getState = jest.fn().mockReturnValue(mockState);
    });

    afterAll(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it('isExam should return true if exam is set', () => {
      expect(isExam()).toBe(true);
    });

    it('getExamAccess should return exam access token if access token', () => {
      expect(getExamAccess()).toBeTruthy();
    });

    it('fetchExamAccess should dispatch get exam access token', () => {
      const dispatchReturn = fetchExamAccess();
      expect(dispatchReturn).toBeInstanceOf(Promise);
    });
  });

  describe('Test isExam without exam', () => {
    beforeAll(() => {
      jest.mock('./data');
      const mockState = { specialExams: { exam: null, examAccessToken: null } };
      store.getState = jest.fn().mockReturnValue(mockState);
    });

    afterAll(() => {
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it('isExam should return false if exam is not set', () => {
      expect(isExam()).toBe(false);
    });

    it('getExamAccess should return empty string if exam access token not set', () => {
      expect(getExamAccess()).toBeFalsy();
    });

    it('fetchExamAccess should not dispatch get exam access token', () => {
      const dispatchReturn = fetchExamAccess();
      expect(dispatchReturn).toBeInstanceOf(Promise);
    });
  });
});
