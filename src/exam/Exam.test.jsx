import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import { useIsMutating } from '@tanstack/react-query';
import {
  createTestQueryClient, render, initializeTestStore, waitFor,
} from '../setupTest';
import Exam from './Exam';
import { ExamType, ExamStatus } from '../constants';
import { fetchExamAttemptsData, fetchProctoringSettings } from '../data/api';
import { examQueryOptions } from '../data/queries';

jest.mock('../data/api', () => ({
  ...jest.requireActual('../data/api'),
  fetchExamAttemptsData: jest.fn(),
  fetchProctoringSettings: jest.fn(() => Promise.resolve({})),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useIsMutating: jest.fn(() => 0),
}));

describe('Exam', () => {
  const proctoredExam = Factory.build('specialExams', {
    exam: Factory.build('exam', {
      type: ExamType.PROCTORED,
      id: 1,
    }),
  });

  const submittedTimedExamHiddenAfterDue = Factory.build('specialExams', {
    exam: Factory.build('exam', {
      type: ExamType.TIMED,
      passed_due_date: true,
      hide_after_due: true,
      attempt: {
        attempt_status: ExamStatus.SUBMITTED,
      },
    }),
  });
  const defaultProps = {
    isGated: false,
    isTimeLimited: true,
    originalUserIsStaff: false,
    canAccessProctoredExams: true,
    children: <div data-testid="exam-content">Exam Content</div>,
  };

  let store;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading spinner while the exam is being fetched', () => {
    const queryClient = createTestQueryClient();
    const specialExams = Factory.build('specialExams');
    fetchExamAttemptsData.mockReturnValue(new Promise(() => {}));
    queryClient.prefetchQuery(examQueryOptions(specialExams.exam.course_id, specialExams.exam.content_id));

    const { queryByTestId } = render(
      <Exam {...defaultProps} />,
      { queryClient, specialExams },
    );

    expect(queryByTestId('spinner')).toBeInTheDocument();
  });

  it('renders loading spinner while an attempt action is in flight', () => {
    useIsMutating.mockReturnValue(1);

    const { queryByTestId } = render(
      <Exam {...defaultProps} />,
      { specialExams: Factory.build('specialExams') },
    );

    expect(queryByTestId('spinner')).toBeInTheDocument();
    useIsMutating.mockReturnValue(0);
  });

  it('renders exam content when not loading', () => {
    // For this test, we'll verify that the Instructions component is rendered
    // which is what wraps our content
    const { queryByTestId } = render(
      <Exam {...defaultProps} />,
      { specialExams: Factory.build('specialExams') },
    );

    // Check for exam instructions which indicates content is being rendered
    expect(queryByTestId('exam-instructions-title')).toBeInTheDocument();
  });

  it('shows timer when there is an active attempt with STARTED status', () => {
    const specialExams = Factory.build('specialExams', {
      activeAttempt: {
        attempt_status: ExamStatus.STARTED,
      },
    });

    const { container } = render(
      <Exam {...defaultProps} />,
      { specialExams },
    );

    // Check for exam-timer which is rendered by ExamTimerBlock
    expect(container.querySelector('[data-testid="exam-timer"]')).toBeInTheDocument();
  });

  it('shows API error when isTimeLimited is true and apiErrorMsg exists', () => {
    const specialExams = Factory.build('specialExams');
    store = initializeTestStore({ specialExams: { apiErrorMsg: 'Test error message' } });

    const { queryByTestId } = render(
      <Exam {...defaultProps} />,
      { specialExams, store },
    );

    // ExamAPIError is rendered
    expect(queryByTestId('exam-api-error-component')).toBeInTheDocument();
  });

  it('does not show API error when isTimeLimited is false', () => {
    const specialExams = Factory.build('specialExams');
    store = initializeTestStore({ specialExams: { apiErrorMsg: 'Test error message' } });

    const { container } = render(
      <Exam {...defaultProps} isTimeLimited={false} />,
      { specialExams, store },
    );

    // ExamAPIError is not rendered
    expect(container.innerHTML).not.toContain('ExamAPIError');
  });

  it('shows access denied message when hasProctoredExamAccess is false', () => {
    const { queryByTestId } = render(
      <Exam {...defaultProps} canAccessProctoredExams={false} />,
      { specialExams: proctoredExam },
    );

    expect(queryByTestId('no-access')).toBeInTheDocument();
  });

  // Test for line 39: if (examType === ExamType.TIMED && passedDueDate && !hideAfterDue)
  // Testing all conditions true
  it('does not show masquerade alert for TIMED exam with passed due date and hideAfterDue=false', () => {
    const specialExams = Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.TIMED,
        passed_due_date: true,
        hide_after_due: false,
        attempt: {
          attempt_status: ExamStatus.SUBMITTED,
        },
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { specialExams },
    );

    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  // Testing first condition false: examType !== ExamType.TIMED
  it('shows masquerade alert for non-TIMED exam with passed due date and hideAfterDue=false', () => {
    const specialExams = Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED, // Not TIMED
        passed_due_date: true,
        hide_after_due: false,
        attempt: {
          attempt_status: ExamStatus.SUBMITTED,
        },
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { specialExams },
    );

    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Testing second condition false: !passedDueDate
  it('shows masquerade alert for TIMED exam without passed due date and hideAfterDue=false', () => {
    const specialExams = Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.TIMED,
        passed_due_date: false, // Due date not passed
        hide_after_due: false,
        attempt: {
          attempt_status: ExamStatus.SUBMITTED,
        },
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { specialExams },
    );

    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Edge case: exam is null
  it('handles null exam object gracefully', () => {
    const specialExams = Factory.build('specialExams', {
      exam: null,
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { specialExams },
    );

    // When exam is null, the component still shows masquerade alert for staff
    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Edge case: exam properties are undefined
  it('handles undefined exam properties gracefully', () => {
    const specialExams = Factory.build('specialExams', {
      exam: {
        // No type, passed_due_date, or hide_after_due properties
        attempt: {
          attempt_status: ExamStatus.SUBMITTED,
        },
      },
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { specialExams },
    );

    // When exam properties are undefined, the component still shows masquerade alert for staff
    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Edge case: attempt is null
  it('handles null attempt object gracefully', () => {
    const specialExams = Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.TIMED,
        passed_due_date: true,
        hide_after_due: true,
        attempt: null,
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { specialExams },
    );

    // Should show masquerade alert when attempt is null (attemptStatus will be undefined)
    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Additional test for line 39 with different conditions
  it('shows masquerade alert for TIMED exam with passed due date and hideAfterDue=true', () => {
    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { specialExams: submittedTimedExamHiddenAfterDue },
    );

    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Test for the outer condition in shouldShowMasqueradeAlert
  it('does not show masquerade alert when originalUserIsStaff is false', () => {
    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff={false} />,
      { specialExams: submittedTimedExamHiddenAfterDue },
    );

    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  // Test for the outer condition in shouldShowMasqueradeAlert
  it('does not show masquerade alert when isTimeLimited is false', () => {
    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff isTimeLimited={false} />,
      { specialExams: submittedTimedExamHiddenAfterDue },
    );

    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  // Test for the condition: return attemptStatus !== ExamStatus.STARTED;
  it('does not show masquerade alert when attemptStatus is STARTED', () => {
    const specialExams = Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED, // Not TIMED to avoid the first branch
        passed_due_date: false,
        hide_after_due: false,
        attempt: {
          attempt_status: ExamStatus.STARTED,
        },
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { specialExams },
    );

    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  // Test for the condition: return attemptStatus !== ExamStatus.STARTED;
  it('shows masquerade alert when attemptStatus is not STARTED', () => {
    const specialExams = Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED, // Not TIMED to avoid the first branch
        passed_due_date: false,
        hide_after_due: false,
        attempt: {
          attempt_status: ExamStatus.SUBMITTED,
        },
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { specialExams },
    );

    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Test for line 63: if (proctoredExamTypes.includes(examType))
  it('calls fetchProctoringSettings for PROCTORED exam type with examId', async () => {
    const specialExams = Factory.build('specialExams', {
      proctoringSettings: null,
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
        id: 1,
      }),
    });

    render(
      <Exam {...defaultProps} />,
      { specialExams },
    );

    await waitFor(() => expect(fetchProctoringSettings).toHaveBeenCalled());
  });

  // Test for line 63 with ONBOARDING exam type
  it('calls fetchProctoringSettings for ONBOARDING exam type with examId', async () => {
    const specialExams = Factory.build('specialExams', {
      proctoringSettings: null,
      exam: Factory.build('exam', {
        type: ExamType.ONBOARDING,
        id: 1,
      }),
    });

    render(
      <Exam {...defaultProps} />,
      { specialExams },
    );

    await waitFor(() => expect(fetchProctoringSettings).toHaveBeenCalled());
  });

  // Test for line 63 with PRACTICE exam type
  it('calls fetchProctoringSettings for PRACTICE exam type with examId', async () => {
    const specialExams = Factory.build('specialExams', {
      proctoringSettings: null,
      exam: Factory.build('exam', {
        type: ExamType.PRACTICE,
        id: 1,
      }),
    });

    render(
      <Exam {...defaultProps} />,
      { specialExams },
    );

    await waitFor(() => expect(fetchProctoringSettings).toHaveBeenCalled());
  });

  // Test for line 63 with TIMED exam type (should not call fetchProctoringSettings)
  it('does not call fetchProctoringSettings for TIMED exam type', () => {
    const specialExams = Factory.build('specialExams', {
      proctoringSettings: null,
      exam: Factory.build('exam', {
        type: ExamType.TIMED,
        id: 1,
      }),
    });

    render(
      <Exam {...defaultProps} />,
      { specialExams },
    );

    expect(fetchProctoringSettings).not.toHaveBeenCalled();
  });

  // Test for line 63 with proctored exam type but no examId
  it('does not call fetchProctoringSettings for PROCTORED exam type without examId', () => {
    const specialExams = Factory.build('specialExams', {
      proctoringSettings: null,
      exam: Factory.build('exam', {
        type: ExamType.PROCTORED,
        id: null,
      }),
    });

    render(
      <Exam {...defaultProps} />,
      { specialExams },
    );

    expect(fetchProctoringSettings).not.toHaveBeenCalled();
  });

  // Test for canAccessProctoredExams with proctored exam type
  it('sets hasProctoredExamAccess to false when canAccessProctoredExams is false for PROCTORED exam', () => {
    const { queryByTestId } = render(
      <Exam {...defaultProps} canAccessProctoredExams={false} />,
      { specialExams: proctoredExam },
    );

    expect(queryByTestId('no-access')).toBeInTheDocument();
  });

  // Test for canAccessProctoredExams with non-proctored exam type
  it('does not restrict access for TIMED exam when canAccessProctoredExams is false', () => {
    const specialExams = Factory.build('specialExams', {
      exam: Factory.build('exam', {
        type: ExamType.TIMED,
        id: 1,
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} canAccessProctoredExams={false} />,
      { specialExams },
    );

    // Should not show access denied message
    expect(queryByTestId('no-access')).not.toBeInTheDocument();

    // Should show exam instructions instead
    expect(queryByTestId('exam-instructions-title')).toBeInTheDocument();
  });
});
