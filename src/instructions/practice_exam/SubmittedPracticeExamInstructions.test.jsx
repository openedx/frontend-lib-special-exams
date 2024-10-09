import React from 'react';
import { Factory } from 'rosie';
import { SubmittedPracticeExamInstructions } from './index';
import {
  render, screen, initializeTestStore, fireEvent,
} from '../../setupTest';
import { ExamStatus, ExamType } from '../../constants';

const mockresetReturn = {};
const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('../../data', () => ({
  ...jest.requireActual('../../data'),
  resetExam: () => mockresetReturn,
}));

describe('ExamTimerBlock', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('when the exam is not proctored', () => {
    beforeEach(() => {
      const preloadedState = {
        specialExams: {
          exam: Factory.build('exam', {
            is_proctored: false,
            type: ExamType.ONBOARDING,
            attempt: Factory.build('attempt'),
          }),
        },
      };
      initializeTestStore(preloadedState);

      render(
        <SubmittedPracticeExamInstructions />,
      );
    });

    it('renders the component correctly', async () => {
      expect(screen.getByText('You have submitted this practice proctored exam')).toBeInTheDocument();
      expect(screen.getByText(
        'Practice exams do not affect your grade. You have '
        + 'completed this practice exam and can continue with your course work.',
      )).toBeInTheDocument();
      expect(screen.queryByTestId('retry-exam-button')).toBeInTheDocument();
    });

    it('calls resetExam() when clicking the retry button', () => {
      expect(mockDispatch).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('retry-exam-button'));

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(mockresetReturn);
    });
  });

  describe('when the exam is not proctored', () => {
    beforeEach(() => {
      const preloadedState = {
        specialExams: {
          exam: Factory.build('exam', {
            is_proctored: false,
            type: ExamType.ONBOARDING,
            attempt: Factory.build('attempt'),
          }),
        },
      };
      initializeTestStore(preloadedState);

      render(
        <SubmittedPracticeExamInstructions />,
      );
    });

    it('renders the component correctly', async () => {
      expect(screen.getByText('You have submitted this practice proctored exam')).toBeInTheDocument();
      expect(screen.getByText(
        'Practice exams do not affect your grade. You have '
        + 'completed this practice exam and can continue with your course work.',
      )).toBeInTheDocument();
      expect(screen.queryByTestId('retry-exam-button')).toBeInTheDocument();
    });

    it('calls resetExam() when clicking the retry button', () => {
      expect(mockDispatch).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('retry-exam-button'));

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(mockresetReturn);
    });
  });

  describe('when a legacy proctoring attempt API is used', () => {
    beforeEach(() => {
      const preloadedState = {
        specialExams: {
          exam: Factory.build('exam', {
            is_proctored: true,
            type: ExamType.PROCTORED,
            attempt: Factory.build('attempt', {
              use_legacy_attempt_api: true,
            }),
          }),
        },
      };
      initializeTestStore(preloadedState);

      render(
        <SubmittedPracticeExamInstructions />,
      );
    });

    it('renders the component correctly', async () => {
      expect(screen.getByText('You have submitted this practice proctored exam')).toBeInTheDocument();
      expect(screen.getByText(
        'Practice exams do not affect your grade. You have '
        + 'completed this practice exam and can continue with your course work.',
      )).toBeInTheDocument();
      expect(screen.queryByTestId('retry-exam-button')).toBeInTheDocument();
    });

    it('calls resetExam() when clicking the retry button', () => {
      expect(mockDispatch).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('retry-exam-button'));

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(mockresetReturn);
    });
  });

  describe('when an LTI provider is used but it has an error', () => {
    beforeEach(() => {
      const preloadedState = {
        specialExams: {
          exam: Factory.build('exam', {
            is_proctored: true,
            type: ExamType.PROCTORED,
            attempt: Factory.build('attempt', {
              use_legacy_attempt_api: false,
              attempt_status: ExamStatus.ERROR,
            }),
          }),
        },
      };
      initializeTestStore(preloadedState);

      render(
        <SubmittedPracticeExamInstructions />,
      );
    });

    it('renders the component correctly', async () => {
      expect(screen.getByText('You have submitted this practice proctored exam')).toBeInTheDocument();
      expect(screen.getByText(
        'Practice exams do not affect your grade. You have '
        + 'completed this practice exam and can continue with your course work.',
      )).toBeInTheDocument();
      expect(screen.queryByTestId('retry-exam-button')).toBeInTheDocument();
    });

    it('calls resetExam() when clicking the retry button', () => {
      expect(mockDispatch).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('retry-exam-button'));

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(mockresetReturn);
    });
  });

  describe('when an LTI provider is used and the exam is submitted', () => {
    beforeEach(() => {
      const preloadedState = {
        specialExams: {
          exam: Factory.build('exam', {
            is_proctored: true,
            type: ExamType.PROCTORED,
            attempt: Factory.build('attempt', {
              use_legacy_attempt_api: false,
              attempt_status: ExamStatus.SUBMITTED,
            }),
          }),
        },
      };
      initializeTestStore(preloadedState);

      render(
        <SubmittedPracticeExamInstructions />,
      );
    });

    it('doesn\'t show the button if it has an LTI provider', async () => {
      expect(screen.getByText('You have submitted this practice proctored exam')).toBeInTheDocument();
      expect(screen.getByText(
        'Practice exams do not affect your grade. You have '
        + 'completed this practice exam and can continue with your course work.',
      )).toBeInTheDocument();
      expect(screen.queryByTestId('retry-exam-button')).not.toBeInTheDocument();
    });
  });
});
