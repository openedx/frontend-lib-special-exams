import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import SequenceExamWrapper from './SequenceExamWrapper';
import { initializeTestStore, render, screen } from '../setupTest';
import { ExamStatus, ExamType } from '../constants';

// The wrapper fetches on mount; the data layer is not under test here.
jest.mock('../data/thunks', () => ({
  ...jest.requireActual('../data/thunks'),
  getExamAttemptsData: () => () => {},
  getAllowProctoringOptOut: () => () => {},
  checkExamEntry: () => () => {},
}));

describe('SequenceExamWrapper', () => {
  const sequence = {
    id: 'block-v1:test+test+test+type@sequential+block@5b1bb1aaf6d34e79b213aa37422b4743',
    isTimeLimited: true,
  };
  const courseId = 'course-v1:test+test+test';
  let store;

  beforeEach(() => {
    store = initializeTestStore({
      specialExams: Factory.build('specialExams', {
        isLoading: false,
      }),
    });
  });

  describe('once a timed exam is submitted', () => {
    const submittedTimedExam = (timeIsOver) => initializeTestStore({
      specialExams: Factory.build('specialExams', {
        isLoading: false,
        timeIsOver,
        exam: Factory.build('exam', {
          type: ExamType.TIMED,
          attempt: Factory.build('attempt', { attempt_status: ExamStatus.SUBMITTED, exam_type: ExamType.TIMED }),
        }),
      }),
    });

    it('shows the default heading when no component is given', () => {
      render(
        <SequenceExamWrapper sequence={sequence} courseId={courseId}>
          <div>Test Content</div>
        </SequenceExamWrapper>,
        { store: submittedTimedExam(false) },
      );

      expect(screen.getByText('You have submitted your timed exam.')).toBeInTheDocument();
    });

    it('renders the submittedTimedExamInstructions component with timeIsOver instead', () => {
      const Custom = jest.fn(() => <div data-testid="custom-timed-instructions" />);

      render(
        <SequenceExamWrapper sequence={sequence} courseId={courseId} submittedTimedExamInstructions={Custom}>
          <div>Test Content</div>
        </SequenceExamWrapper>,
        { store: submittedTimedExam(true) },
      );

      expect(screen.getByTestId('custom-timed-instructions')).toBeInTheDocument();
      expect(Custom).toHaveBeenCalledWith(expect.objectContaining({ timeIsOver: true }), expect.anything());
      expect(screen.queryByText('You have submitted your timed exam.')).not.toBeInTheDocument();
    });
  });

  it('renders without crashing', () => {
    // This is a minimal smoke test just for coverage purposes
    const { container } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div>Test Content</div>
      </SequenceExamWrapper>,
      { store },
    );

    // Just verify that the component renders without throwing an error
    expect(container).toBeInTheDocument();
  });
});
