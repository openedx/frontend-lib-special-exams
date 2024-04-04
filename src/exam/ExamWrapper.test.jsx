import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import SequenceExamWrapper from './ExamWrapper';
import { getExamAttemptsData, startTimedExam } from '../data';
import { render, waitFor, initializeTestStore } from '../setupTest';
import { ExamStatus, ExamType } from '../constants';

jest.mock('../data', () => {
  const originalModule = jest.requireActual('../data/thunks');
  return {
    ...originalModule,
    getExamAttemptsData: jest.fn(),
    startTimedExam: jest.fn(),
  };
});

getExamAttemptsData.mockReturnValue(jest.fn());
startTimedExam.mockReturnValue(jest.fn());

describe('SequenceExamWrapper', () => {
  const sequence = {
    id: 'block-v1:test+test+test+type@sequential+block@5b1bb1aaf6d34e79b213aa37422b4743',
    isTimeLimited: true,
  };
  const courseId = 'course-v1:test+test+test';
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = initializeTestStore({
      specialExams: Factory.build('specialExams', {
        isLoading: false,
      }),
    });
  });

  it('is successfully rendered and shows instructions if the user is not staff', () => {
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(queryByTestId('exam-instructions-title')).toHaveTextContent('Subsection is a Timed Exam (30 minutes)');
    expect(queryByTestId('exam-api-error-component')).not.toBeInTheDocument();
  });

  it('is successfully rendered and shows instructions for proctored exam', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
        }),
      }),
    });
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(queryByTestId('proctored-exam-instructions-title')).toHaveTextContent('This exam is proctored');
  });

  it('shows loader if isLoading true', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        isLoading: true,
      }),
    });
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(queryByTestId('spinner')).toBeInTheDocument();
  });

  it('shows exam api error component together with other content if there is an error', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        apiErrorMsg: 'Something bad has happened.',
      }),
    });

    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(queryByTestId('exam-instructions-title')).toHaveTextContent('Subsection is a Timed Exam (30 minutes)');
    expect(queryByTestId('exam-api-error-component')).toBeInTheDocument();
  });

  it('does not show exam api error component on a non-exam sequence', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        apiErrorMsg: 'Something bad has happened.',
      }),
    });

    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(queryByTestId('exam-instructions-title')).not.toBeInTheDocument();
    expect(queryByTestId('exam-api-error-component')).not.toBeInTheDocument();
  });

  it('does not fetch exam data if already loaded and the sequence is not an exam', async () => {
    render(
      <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { store },
    );
    // assert the exam data is not fetched
    await expect(waitFor(() => expect(getExamAttemptsData).toHaveBeenCalled())).rejects.toThrow();
  });

  it('does fetch exam data for non exam sequences if not already loaded', async () => {
    // this would only occur if the user deeplinks directly to a non-exam sequence
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        isLoading: true,
      }),
    });

    render(
      <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { store },
    );
    await waitFor(() => expect(getExamAttemptsData).toHaveBeenCalled());
  });

  it('does not take any actions if sequence item is not exam', () => {
    const { getByTestId } = render(
      <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(getByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('does not take any actions if the sequence item is not an exam and the user is anonymous', () => {
    const appContext = {
      authenticatedUser: null,
    };
    const { getByTestId } = render(
      <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { store, appContext },
    );
    expect(getByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('renders exam content without an active attempt if the user is staff', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
        }),
      }),
    });
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId} isStaff>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('renders exam content for staff masquerading as a learner', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          passed_due_date: false,
          hide_after_due: false,
        }),
      }),
    });
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId} originalUserIsStaff>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
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
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
        }),
      }),
    });
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('does not display masquerade alert if specified learner is in the middle of the exam', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
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
      <SequenceExamWrapper sequence={sequence} courseId={courseId} originalUserIsStaff>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  it('does not display masquerade alert if learner can view the exam after the due date', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
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
      <SequenceExamWrapper sequence={sequence} courseId={courseId} originalUserIsStaff>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  it('does not display masquerade alert if sequence is not time gated', () => {
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId} originalUserIsStaff>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  it('shows access denied if learner is not accessible to proctoring exams', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          attempt: null,
          passed_due_date: false,
          hide_after_due: false,
        }),
      }),
    });
    const { queryByTestId } = render(
      <SequenceExamWrapper
        sequence={{ ...sequence, isTimeLimited: false }}
        courseId={courseId}
        canAccessProctoredExams={false}
      >
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(queryByTestId('no-access')).toHaveTextContent('You do not have access to proctored exams with your current enrollment.');
    expect(queryByTestId('sequence-content')).toBeNull();
  });

  it('learner has access to timed exams', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.TIMED,
          attempt: null,
          passed_due_date: false,
          hide_after_due: false,
        }),
      }),
    });
    const { queryByTestId } = render(
      <SequenceExamWrapper
        sequence={{ ...sequence, isTimeLimited: false }}
        courseId={courseId}
        canAccessProctoredExams={false}
      >
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(queryByTestId('no-access')).toBeNull();
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('learner has access to content that are not exams', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: '',
          attempt: null,
          passed_due_date: false,
          hide_after_due: false,
        }),
      }),
    });
    const { queryByTestId } = render(
      <SequenceExamWrapper
        sequence={{ ...sequence, isTimeLimited: false }}
        courseId={courseId}
        canAccessProctoredExams={false}
      >
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { store },
    );
    expect(queryByTestId('no-access')).toBeNull();
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
  });
});
