import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import SequenceExamWrapper from './ExamWrapper';
import { fetchExamAttemptsData, fetchLatestAttempt } from '../data/api';
import {
  render, screen, waitFor,
} from '../setupTest';
import { ExamStatus, ExamType } from '../constants';

jest.mock('../data/api', () => ({
  ...jest.requireActual('../data/api'),
  fetchExamAttemptsData: jest.fn(),
  fetchLatestAttempt: jest.fn(),
}));

describe('SequenceExamWrapper', () => {
  // The wrapper fetches on mount; the fetchers answer with the fixture the test set.
  const sequence = {
    id: 'block-v1:test+special+exam+type@sequential+block@abc123',
    isTimeLimited: true,
  };
  const courseId = 'course-v1:test+special+exam';
  let specialExams;

  const setState = (fixture) => {
    specialExams = fixture;
    const response = { exam: fixture.exam, active_attempt: fixture.activeAttempt || {} };
    fetchExamAttemptsData.mockResolvedValue(response);
    fetchLatestAttempt.mockResolvedValue(response);
  };
  const loaded = () => waitFor(() => expect(screen.queryByTestId('spinner')).not.toBeInTheDocument());

  beforeEach(() => {
    jest.clearAllMocks();
    setState(Factory.build('specialExams'));
  });

  it('is successfully rendered and shows instructions if the user is not staff', async () => {
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await loaded();
    expect(queryByTestId('exam-instructions-title')).toHaveTextContent('Subsection is a Timed Exam (30 minutes)');
    expect(queryByTestId('exam-api-error-component')).not.toBeInTheDocument();
  });

  it('is successfully rendered and shows instructions for proctored exam', async () => {
    setState(Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
      }),
    }));
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await loaded();
    expect(queryByTestId('proctored-exam-instructions-title')).toHaveTextContent('This exam is proctored');
  });

  it('shows loader while the exam is being fetched', async () => {
    fetchExamAttemptsData.mockReturnValue(new Promise(() => {}));
    render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    expect(await screen.findByTestId('spinner')).toBeInTheDocument();
  });

  it('shows exam api error component together with other content if there is an error', async () => {
    setState(Factory.build('specialExams'));
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { specialExams, clientState: { apiErrorMsg: 'Something bad has happened.' } },
    );
    await loaded();
    expect(queryByTestId('exam-instructions-title')).toHaveTextContent('Subsection is a Timed Exam (30 minutes)');
    expect(queryByTestId('exam-api-error-component')).toBeInTheDocument();
  });

  it('does not show exam api error component on a non-exam sequence', async () => {
    setState(Factory.build('specialExams'));
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { specialExams, clientState: { apiErrorMsg: 'Something bad has happened.' } },
    );
    await loaded();
    expect(queryByTestId('exam-instructions-title')).not.toBeInTheDocument();
    expect(queryByTestId('exam-api-error-component')).not.toBeInTheDocument();
  });

  it('fetches the exam for an exam sequence', async () => {
    render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await waitFor(() => expect(fetchExamAttemptsData).toHaveBeenCalledWith(expect.anything(), courseId, sequence.id));
    expect(fetchLatestAttempt).not.toHaveBeenCalled();
  });

  it('fetches only the running attempt for a sequence that is not an exam', async () => {
    render(
      <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
        <div>children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await waitFor(() => expect(fetchLatestAttempt).toHaveBeenCalledWith(expect.anything(), courseId));
    expect(fetchExamAttemptsData).not.toHaveBeenCalled();
  });

  it('does not take any actions if sequence item is not exam', async () => {
    const { getByTestId } = render(
      <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await loaded();
    expect(getByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('does not take any actions if the sequence item is not an exam and the user is anonymous', async () => {
    const { getByTestId } = render(
      <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId}>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { specialExams, services: { isAuthenticated: false } },
    );
    await loaded();
    expect(getByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('renders exam content without an active attempt if the user is staff', async () => {
    setState(Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
      }),
    }));
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId} isStaff>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await loaded();
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('renders exam content for staff masquerading as a learner', async () => {
    setState(Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
        passed_due_date: false,
        hide_after_due: false,
      }),
    }));
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId} originalUserIsStaff>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await loaded();
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  it('allows default content rendering for gated sections even for exams', async () => {
    sequence.gatedContent = {
      gated: true,
    };
    setState(Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
      }),
    }));
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await loaded();
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('does not display masquerade alert if specified learner is in the middle of the exam', async () => {
    setState(Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
        attempt: {
          attempt_status: ExamStatus.STARTED,
        },
        passed_due_date: false,
        hide_after_due: false,
      }),
    }));
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId} originalUserIsStaff>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await loaded();
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  it('does not display masquerade alert if learner can view the exam after the due date', async () => {
    setState(Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.TIMED,
        attempt: {
          attempt_status: ExamStatus.SUBMITTED,
        },
        passed_due_date: true,
        hide_after_due: false,
      }),
    }));
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId} originalUserIsStaff>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await loaded();
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  it('does not display masquerade alert if sequence is not time gated', async () => {
    const { queryByTestId } = render(
      <SequenceExamWrapper sequence={{ ...sequence, isTimeLimited: false }} courseId={courseId} originalUserIsStaff>
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await loaded();
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  it('shows access denied if learner is not accessible to proctoring exams', async () => {
    setState(Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
        attempt: null,
        passed_due_date: false,
        hide_after_due: false,
      }),
    }));
    const { queryByTestId } = render(
      <SequenceExamWrapper
        sequence={{ ...sequence, isTimeLimited: false }}
        courseId={courseId}
        canAccessProctoredExams={false}
      >
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await loaded();
    expect(queryByTestId('no-access')).toHaveTextContent('You do not have access to proctored exams with your current enrollment.');
    expect(queryByTestId('sequence-content')).toBeNull();
  });

  it('learner has access to timed exams', async () => {
    setState(Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.TIMED,
        attempt: null,
        passed_due_date: false,
        hide_after_due: false,
      }),
    }));
    const { queryByTestId } = render(
      <SequenceExamWrapper
        sequence={{ ...sequence, isTimeLimited: false }}
        courseId={courseId}
        canAccessProctoredExams={false}
      >
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await loaded();
    expect(queryByTestId('no-access')).toBeNull();
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
  });

  it('learner has access to content that are not exams', async () => {
    setState(Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: '',
        attempt: null,
        passed_due_date: false,
        hide_after_due: false,
      }),
    }));
    const { queryByTestId } = render(
      <SequenceExamWrapper
        sequence={{ ...sequence, isTimeLimited: false }}
        courseId={courseId}
        canAccessProctoredExams={false}
      >
        <div data-testid="sequence-content">children</div>
      </SequenceExamWrapper>,
      { specialExams },
    );
    await loaded();
    expect(queryByTestId('no-access')).toBeNull();
    expect(queryByTestId('sequence-content')).toHaveTextContent('children');
  });
});
