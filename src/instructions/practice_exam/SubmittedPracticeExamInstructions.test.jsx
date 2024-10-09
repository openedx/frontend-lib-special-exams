import React from 'react';
import { SubmittedPracticeExamInstructions } from './index';
import {
  render, screen, initializeTestStore, fireEvent,
} from '../../setupTest';

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

  describe('when no LTI provider is used', () => {
    beforeEach(() => {
      const preloadedState = {
        specialExams: {
          exam: {
            attempt: {
              use_legacy_attempt_api: true,
            },
          },
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

  describe('when an LTI provider is used', () => {
    beforeEach(() => {
      const preloadedState = {
        specialExams: {
          exam: {},
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
