import '@testing-library/jest-dom';
import React from 'react';
import SequenceExamWrapper from './ExamWrapper';
import { store, getExamAttemptsData, startTimedExam } from '../data';
import { render } from '../setupTest';
import { ExamStateProvider } from '../index';

jest.mock('../data', () => ({
  store: {},
  getExamAttemptsData: jest.fn(),
  startTimedExam: jest.fn(),
}));
getExamAttemptsData.mockReturnValue(jest.fn());
startTimedExam.mockReturnValue(jest.fn());
store.subscribe = jest.fn();
store.dispatch = jest.fn();
store.getState = () => ({
  examState: {
    isLoading: false,
    activeAttempt: null,
    proctoringSettings: {},
    verification: {
      status: 'none',
      can_verify: true,
    },
    exam: {
      time_limit_mins: 30,
      type: 'timed',
      attempt: {},
    },
  },
});

describe('SequenceExamWrapper', () => {
  const sequence = {
    id: 'block-v1:test+test+test+type@sequential+block@5b1bb1aaf6d34e79b213aa37422b4743',
    isTimeLimited: true,
  };
  const courseId = 'course-v1:test+test+test';

  it('is successfully rendered and shows instructions', () => {
    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={sequence} courseId={courseId}>
          <div>children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('exam-instructions-title')).toHaveTextContent('Subsection is a Timed Exam (30 minutes)');
    expect(queryByTestId('exam-api-error-component')).not.toBeInTheDocument();
  });

  it('shows exam api error component together with other content if there is an error', () => {
    store.getState = () => ({
      examState: {
        isLoading: false,
        activeAttempt: null,
        apiErrorMsg: 'Something bad has happened.',
        proctoringSettings: {},
        verification: {
          status: 'none',
          can_verify: true,
        },
        exam: {
          time_limit_mins: 30,
          type: 'timed',
          attempt: {},
        },
      },
    });

    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={sequence} courseId={courseId}>
          <div>children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('exam-instructions-title')).toHaveTextContent('Subsection is a Timed Exam (30 minutes)');
    expect(queryByTestId('exam-api-error-component')).toBeInTheDocument();
  });

  it('does not take any actions if sequence item is not exam', () => {
    const { getByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
          <div data-testid="sequence-content">children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(getByTestId('sequence-content')).toHaveTextContent('children');
  });
});
