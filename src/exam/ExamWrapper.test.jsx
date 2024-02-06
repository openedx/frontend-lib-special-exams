import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import SequenceExamWrapper from './ExamWrapper';
import { store, startTimedExam } from '../data';
import { getExamAttemptsData } from '../data/thunks';
import { render, waitFor } from '../setupTest';
import ExamStateProvider from '../core/ExamStateProvider';
import { ExamStatus, ExamType } from '../constants';

jest.mock('../data', () => ({
  store: {},
  startTimedExam: jest.fn(),
}));

// because of the way ExamStateProvider and other locations inconsistantly import from
// thunks directly instead of using the data module we need to mock the underlying
// thunk file. It would be nice to clean this up in the future.
jest.mock('../data/thunks', () => {
  const originalModule = jest.requireActual('../data/thunks');
  return {
    ...originalModule,
    getExamAttemptsData: jest.fn(),
  };
});

// TODO: Make changes to what's mocked. should only be API functions and react/redux initialState stuff.

// When we mock out the thunks below, we stamp out a lot of the non-async stuff
// Like loading states and other redux goodness. We can't ever change the loading state if
// The function it's in has been mocked away.
// The ONLY thing we should need to mock out in this app are API REST calls.
getExamAttemptsData.mockReturnValue(jest.fn());
startTimedExam.mockReturnValue(jest.fn());
// No idea what "subscribe" does but it probably shouldn't be mocked
store.subscribe = jest.fn();
// We should not mock this. This makes the dispatch function useless. It just needs the right setup to work.
// Things were mocked, then broke, then they mocked other things that didn't need to be mocked.
// This all can work out of the box with the right set up
store.dispatch = jest.fn();

describe('SequenceExamWrapper', () => {
  const sequence = {
    id: 'block-v1:test+test+test+type@sequential+block@5b1bb1aaf6d34e79b213aa37422b4743',
    isTimeLimited: true,
  };
  const courseId = 'course-v1:test+test+test';

  beforeEach(() => {
    jest.clearAllMocks();
    store.getState = () => ({
      examState: Factory.build('examState'),
      isLoading: false,
    });
  });

  it('is successfully rendered and shows instructions if the user is not staff', () => {
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

  it('does not show exam api error component on a non-exam sequence', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        apiErrorMsg: 'Something bad has happened.',
      }),
    });

    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
          <div>children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('exam-instructions-title')).not.toBeInTheDocument();
    expect(queryByTestId('exam-api-error-component')).not.toBeInTheDocument();
  });

  it('does not fetch exam data if already loaded and the sequence is not an exam', async () => {
    render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
          <div>children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    // assert the exam data is not fetched
    await expect(waitFor(() => expect(getExamAttemptsData).toHaveBeenCalled())).rejects.toThrow();
  });

  it('does fetch exam data for non exam sequences if not already loaded', async () => {
    // this would only occur if the user deeplinks directly to a non-exam sequence
    store.getState = () => ({
      examState: Factory.build('examState', {
        isLoading: true,
      }),
    });

    render(
      <ExamStateProvider>
        <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
          <div>children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    await waitFor(() => expect(getExamAttemptsData).toHaveBeenCalled());
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

  it('shows access denied if learner is not accessible to proctoring exams', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          attempt: null,
          passed_due_date: false,
          hide_after_due: false,
        }),
      }),
    });
    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper
          sequence={{ ...sequence, isTimeLimited: false }}
          courseId={courseId}
          canAccessProctoredExams={false}
        >
          <div data-testid="sequence-content">children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('no-access')).toHaveTextContent('You do not have access to proctored exams with your current enrollment.');
    expect(queryByTestId('sequence-content')).toBeNull();
  });

  it('learner has access to timed exams', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: ExamType.TIMED,
          attempt: null,
          passed_due_date: false,
          hide_after_due: false,
        }),
      }),
    });
    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper
          sequence={{ ...sequence, isTimeLimited: false }}
          courseId={courseId}
          canAccessProctoredExams={false}
        >
          <div data-testid="sequence-content">children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('no-access')).toBeNull();
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('learner has access to content that are not exams', () => {
    store.getState = () => ({
      examState: Factory.build('examState', {
        exam: Factory.build('exam', {
          type: '',
          attempt: null,
          passed_due_date: false,
          hide_after_due: false,
        }),
      }),
    });
    const { queryByTestId } = render(
      <ExamStateProvider>
        <SequenceExamWrapper
          sequence={{ ...sequence, isTimeLimited: false }}
          courseId={courseId}
          canAccessProctoredExams={false}
        >
          <div data-testid="sequence-content">children</div>
        </SequenceExamWrapper>
      </ExamStateProvider>,
      { store },
    );
    expect(queryByTestId('no-access')).toBeNull();
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
  });
});
