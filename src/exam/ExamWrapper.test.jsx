import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import SequenceExamWrapper from './ExamWrapper';
import { store, getExamAttemptsData, startTimedExam } from '../data';
import { render } from '../setupTest';
import ExamStateProvider from '../core/ExamStateProvider';
import { ExamStatus, ExamType } from '../constants';

jest.mock('../data', () => ({
  store: {},
  getExamAttemptsData: jest.fn(),
  startTimedExam: jest.fn(),
}));
getExamAttemptsData.mockReturnValue(jest.fn());
startTimedExam.mockReturnValue(jest.fn());
store.subscribe = jest.fn();
store.dispatch = jest.fn();

describe('SequenceExamWrapper', () => {
  const sequence = {
    id: 'block-v1:test+test+test+type@sequential+block@5b1bb1aaf6d34e79b213aa37422b4743',
    isTimeLimited: true,
  };
  const courseId = 'course-v1:test+test+test';

  it('is successfully rendered and shows instructions if the user is not staff', () => {
    store.getState = () => ({
      examState: Factory.build('examState'),
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
    expect(queryByTestId('exam-api-error-component')).not.toBeInTheDocument();
  });

  it('is successfully rendered and shows instructions for proctored exam', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
        }),
      }),
    });
    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={sequence} courseId={courseId}>
          <div>children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('proctored-exam-instructions-title')).toHaveTextContent('This exam is proctored');
  });

  it('shows loader if isLoading true', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        isLoading: true,
      }),
    });
    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={sequence} courseId={courseId}>
          <div>children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('spinner')).toBeInTheDocument();
  });

  it('shows exam api error component together with other content if there is an error', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        apiErrorMsg: 'Something bad has happened.',
      }),
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

  it('does not take any actions if the sequence item is not an exam and the user is anonymous', () => {
    const appContext = {
      authenticatedUser: null,
    };
    const { getByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
          <div data-testid="sequence-content">children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store, appContext },
    );
    expect(getByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('renders exam content without an active attempt if the user is staff', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
        }),
      }),
    });
    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={sequence} courseId={courseId} isStaff>
          <div data-testid="sequence-content">children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('renders exam content for staff masquerading as a learner', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          passed_due_date: false,
          hide_after_due: false,
        }),
      }),
    });
    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={sequence} courseId={courseId} originalUserIsStaff>
          <div data-testid="sequence-content">children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  it('allows default content rendering for gated sections even for exams', () => {
    sequence.gatedContent = {
      gated: true,
    };
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
        }),
      }),
    });
    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={sequence} courseId={courseId}>
          <div data-testid="sequence-content">children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('does not display masquerade alert if specified learner is in the middle of the exam', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          attempt: {
            attempt_status: ExamStatus.STARTED,
          },
          passed_due_date: false,
          hide_after_due: false,
        }),
      }),
    });
    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={sequence} courseId={courseId} originalUserIsStaff>
          <div data-testid="sequence-content">children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  it('does not display masquerade alert if learner can view the exam after the due date', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.TIMED,
          attempt: {
            attempt_status: ExamStatus.SUBMITTED,
          },
          passed_due_date: true,
          hide_after_due: false,
        }),
      }),
    });
    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={sequence} courseId={courseId} originalUserIsStaff>
          <div data-testid="sequence-content">children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  it('does not display masquerade alert if sequence is not time gated', () => {
    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId} originalUserIsStaff>
          <div data-testid="sequence-content">children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });
});
