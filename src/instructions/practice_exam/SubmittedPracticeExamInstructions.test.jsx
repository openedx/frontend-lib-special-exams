import React from 'react';
import { Factory } from 'rosie';
import { SubmittedPracticeExamInstructions } from './index';
import {
  render, screen, fireEvent,
} from '../../setupTest';
import { ExamStatus, ExamType } from '../../constants';

const mockResetExam = jest.fn();
jest.mock('../../data', () => ({
  ...jest.requireActual('../../data'),
  useResetExam: () => ({ mutate: mockResetExam }),
}));

describe('ExamTimerBlock', () => {
  const onboardingExam = {
    exam: Factory.build('exam', {
      is_proctored: false,
      type: ExamType.ONBOARDING,
      attempt: Factory.build('attempt'),
    }),
  };
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('when the exam is not proctored', () => {
    beforeEach(() => {
      render(
        <SubmittedPracticeExamInstructions />,
        { specialExams: onboardingExam },
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

    it('resets the attempt when clicking the retry button', () => {
      expect(mockResetExam).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('retry-exam-button'));

      expect(mockResetExam).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the exam is not proctored', () => {
    beforeEach(() => {
      render(
        <SubmittedPracticeExamInstructions />,
        { specialExams: onboardingExam },
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

    it('resets the attempt when clicking the retry button', () => {
      expect(mockResetExam).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('retry-exam-button'));

      expect(mockResetExam).toHaveBeenCalledTimes(1);
    });
  });

  describe('when a legacy proctoring attempt API is used', () => {
    beforeEach(() => {
      const specialExams = {
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.PROCTORED,
          attempt: Factory.build('attempt', {
            use_legacy_attempt_api: true,
          }),
        }),
      };

      render(
        <SubmittedPracticeExamInstructions />,
        { specialExams },
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

    it('resets the attempt when clicking the retry button', () => {
      expect(mockResetExam).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('retry-exam-button'));

      expect(mockResetExam).toHaveBeenCalledTimes(1);
    });
  });

  describe('when an LTI provider is used but it has an error', () => {
    beforeEach(() => {
      const specialExams = {
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.PROCTORED,
          attempt: Factory.build('attempt', {
            use_legacy_attempt_api: false,
            attempt_status: ExamStatus.ERROR,
          }),
        }),
      };

      render(
        <SubmittedPracticeExamInstructions />,
        { specialExams },
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

    it('resets the attempt when clicking the retry button', () => {
      expect(mockResetExam).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('retry-exam-button'));

      expect(mockResetExam).toHaveBeenCalledTimes(1);
    });
  });

  describe('when an LTI provider is used and the exam is submitted', () => {
    beforeEach(() => {
      const specialExams = {
        exam: Factory.build('exam', {
          is_proctored: true,
          type: ExamType.PROCTORED,
          attempt: Factory.build('attempt', {
            use_legacy_attempt_api: false,
            attempt_status: ExamStatus.SUBMITTED,
          }),
        }),
      };

      render(
        <SubmittedPracticeExamInstructions />,
        { specialExams },
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
