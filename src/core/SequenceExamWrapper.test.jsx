import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import SequenceExamWrapper from './SequenceExamWrapper';
import { fetchExamAttemptsData } from '../data/api';
import { render, screen } from '../setupTest';
import { ExamStatus, ExamType } from '../constants';

// The wrapper fetches on mount; the fetcher answers with the submitted exam.
jest.mock('../data/api', () => ({
  ...jest.requireActual('../data/api'),
  fetchExamAttemptsData: jest.fn(),
}));

describe('SequenceExamWrapper', () => {
  const sequence = {
    id: 'block-v1:test+special+exam+type@sequential+block@abc123',
    isTimeLimited: true,
  };
  const courseId = 'course-v1:test+special+exam';

  describe('once a timed exam is submitted', () => {
    const submittedTimedExam = () => {
      const specialExams = Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.TIMED,
          attempt: Factory.build('attempt', { attempt_status: ExamStatus.SUBMITTED, exam_type: ExamType.TIMED }),
        }),
      });
      fetchExamAttemptsData.mockResolvedValue({ exam: specialExams.exam, active_attempt: {} });
      return { specialExams };
    };

    it('shows the default heading when no component is given', () => {
      render(
        <SequenceExamWrapper sequence={sequence} courseId={courseId}>
          <div>Test Content</div>
        </SequenceExamWrapper>,
        submittedTimedExam(),
      );

      expect(screen.getByText('You have submitted your timed exam.')).toBeInTheDocument();
    });

    it('renders the submittedTimedExamInstructions component with timeIsOver instead', () => {
      const Custom = jest.fn(() => <div data-testid="custom-timed-instructions" />);

      render(
        <SequenceExamWrapper sequence={sequence} courseId={courseId} submittedTimedExamInstructions={Custom}>
          <div>Test Content</div>
        </SequenceExamWrapper>,
        submittedTimedExam(),
      );

      expect(screen.getByTestId('custom-timed-instructions')).toBeInTheDocument();
      expect(Custom).toHaveBeenCalledWith(expect.objectContaining({ timeIsOver: false }), expect.anything());
      expect(screen.queryByText('You have submitted your timed exam.')).not.toBeInTheDocument();
    });
  });

  it('renders without crashing', () => {
    // This is a minimal smoke test just for coverage purposes
    const { container } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div>Test Content</div>
      </SequenceExamWrapper>,
      { specialExams: Factory.build('specialExams') },
    );

    // Just verify that the component renders without throwing an error
    expect(container).toBeInTheDocument();
  });
});
