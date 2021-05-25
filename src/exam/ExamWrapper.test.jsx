import '@testing-library/jest-dom';
import React from 'react';
import SequenceExamWrapper from './ExamWrapper';
import { store, getExamAttemptsData, startExam } from '../data';
import { render } from '../setupTest';
import { ExamStateProvider } from '../index';

jest.mock('../data', () => ({
  store: {},
  getExamAttemptsData: jest.fn(),
  startExam: jest.fn(),
}));
getExamAttemptsData.mockReturnValue(jest.fn());
startExam.mockReturnValue(jest.fn());
store.subscribe = jest.fn();
store.dispatch = jest.fn();
store.getState = () => ({
  examState: {
    isLoading: false,
    activeAttempt: null,
    exam: {
      time_limit_mins: 30,
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

  it('is successfully rendered', () => {
    const { getByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={sequence} courseId={courseId}>
          <div>children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(getByTestId('exam-instructions-title')).toHaveTextContent('Subsection is a Timed Exam (30 minutes)');
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
