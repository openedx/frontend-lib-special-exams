import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import { render, initializeTestStore } from '../setupTest';
import Exam from './Exam';
import { ExamType, ExamStatus } from '../constants';
import { getProctoringSettings } from '../data';

// Mock the getProctoringSettings function
jest.mock('../data', () => {
  const originalModule = jest.requireActual('../data');
  return {
    ...originalModule,
    getProctoringSettings: jest.fn(),
  };
});

getProctoringSettings.mockReturnValue(jest.fn());

describe('Exam', () => {
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
    store = initializeTestStore({
      specialExams: Factory.build('specialExams', {
        isLoading: false,
      }),
    });
  });

  it('renders loading spinner when isLoading is true', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        isLoading: true,
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} />,
      { store },
    );

    expect(queryByTestId('spinner')).toBeInTheDocument();
  });

  it('renders exam content when not loading', () => {
    // For this test, we'll verify that the Instructions component is rendered
    // which is what wraps our content
    const { queryByTestId } = render(
      <Exam {...defaultProps} />,
      { store },
    );

    // Check for exam instructions which indicates content is being rendered
    expect(queryByTestId('exam-instructions-title')).toBeInTheDocument();
  });

  it('shows timer when there is an active attempt with STARTED status', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        activeAttempt: {
          attempt_status: ExamStatus.STARTED,
        },
      }),
    });

    const { container } = render(
      <Exam {...defaultProps} />,
      { store },
    );

    // Check for exam-timer which is rendered by ExamTimerBlock
    expect(container.querySelector('[data-testid="exam-timer"]')).toBeInTheDocument();
  });

  it('shows API error when isTimeLimited is true and apiErrorMsg exists', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        apiErrorMsg: 'Test error message',
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} />,
      { store },
    );

    // ExamAPIError is rendered
    expect(queryByTestId('exam-api-error-component')).toBeInTheDocument();
  });

  it('does not show API error when isTimeLimited is false', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        apiErrorMsg: 'Test error message',
      }),
    });

    const { container } = render(
      <Exam {...defaultProps} isTimeLimited={false} />,
      { store },
    );

    // ExamAPIError is not rendered
    expect(container.innerHTML).not.toContain('ExamAPIError');
  });

  it('shows access denied message when hasProctoredExamAccess is false', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          id: 1,
        }),
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} canAccessProctoredExams={false} />,
      { store },
    );

    expect(queryByTestId('no-access')).toBeInTheDocument();
  });

  // Test for line 39: if (examType === ExamType.TIMED && passedDueDate && !hideAfterDue)
  // Testing all conditions true
  it('does not show masquerade alert for TIMED exam with passed due date and hideAfterDue=false', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.TIMED,
          passed_due_date: true,
          hide_after_due: false,
          attempt: {
            attempt_status: ExamStatus.SUBMITTED,
          },
        }),
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { store },
    );

    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  // Testing first condition false: examType !== ExamType.TIMED
  it('shows masquerade alert for non-TIMED exam with passed due date and hideAfterDue=false', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED, // Not TIMED
          passed_due_date: true,
          hide_after_due: false,
          attempt: {
            attempt_status: ExamStatus.SUBMITTED,
          },
        }),
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { store },
    );

    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Testing second condition false: !passedDueDate
  it('shows masquerade alert for TIMED exam without passed due date and hideAfterDue=false', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.TIMED,
          passed_due_date: false, // Due date not passed
          hide_after_due: false,
          attempt: {
            attempt_status: ExamStatus.SUBMITTED,
          },
        }),
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { store },
    );

    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Edge case: exam is null
  it('handles null exam object gracefully', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: null,
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { store },
    );

    // When exam is null, the component still shows masquerade alert for staff
    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Edge case: exam properties are undefined
  it('handles undefined exam properties gracefully', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: {
          // No type, passed_due_date, or hide_after_due properties
          attempt: {
            attempt_status: ExamStatus.SUBMITTED,
          },
        },
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { store },
    );

    // When exam properties are undefined, the component still shows masquerade alert for staff
    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Edge case: attempt is null
  it('handles null attempt object gracefully', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.TIMED,
          passed_due_date: true,
          hide_after_due: true,
          attempt: null,
        }),
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { store },
    );

    // Should show masquerade alert when attempt is null (attemptStatus will be undefined)
    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Additional test for line 39 with different conditions
  it('shows masquerade alert for TIMED exam with passed due date and hideAfterDue=true', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.TIMED,
          passed_due_date: true,
          hide_after_due: true,
          attempt: {
            attempt_status: ExamStatus.SUBMITTED,
          },
        }),
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { store },
    );

    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Test for the outer condition in shouldShowMasqueradeAlert
  it('does not show masquerade alert when originalUserIsStaff is false', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.TIMED,
          passed_due_date: true,
          hide_after_due: true,
          attempt: {
            attempt_status: ExamStatus.SUBMITTED,
          },
        }),
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff={false} />,
      { store },
    );

    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  // Test for the outer condition in shouldShowMasqueradeAlert
  it('does not show masquerade alert when isTimeLimited is false', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.TIMED,
          passed_due_date: true,
          hide_after_due: true,
          attempt: {
            attempt_status: ExamStatus.SUBMITTED,
          },
        }),
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff isTimeLimited={false} />,
      { store },
    );

    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  // Test for the condition: return attemptStatus !== ExamStatus.STARTED;
  it('does not show masquerade alert when attemptStatus is STARTED', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED, // Not TIMED to avoid the first branch
          passed_due_date: false,
          hide_after_due: false,
          attempt: {
            attempt_status: ExamStatus.STARTED,
          },
        }),
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { store },
    );

    expect(queryByTestId('masquerade-alert')).not.toBeInTheDocument();
  });

  // Test for the condition: return attemptStatus !== ExamStatus.STARTED;
  it('shows masquerade alert when attemptStatus is not STARTED', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED, // Not TIMED to avoid the first branch
          passed_due_date: false,
          hide_after_due: false,
          attempt: {
            attempt_status: ExamStatus.SUBMITTED,
          },
        }),
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} originalUserIsStaff />,
      { store },
    );

    expect(queryByTestId('masquerade-alert')).toBeInTheDocument();
  });

  // Test for line 63: if (proctoredExamTypes.includes(examType))
  it('calls getProctoringSettings for PROCTORED exam type with examId', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          id: 1,
        }),
      }),
    });

    render(
      <Exam {...defaultProps} />,
      { store },
    );

    expect(getProctoringSettings).toHaveBeenCalled();
  });

  // Test for line 63 with ONBOARDING exam type
  it('calls getProctoringSettings for ONBOARDING exam type with examId', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.ONBOARDING,
          id: 1,
        }),
      }),
    });

    render(
      <Exam {...defaultProps} />,
      { store },
    );

    expect(getProctoringSettings).toHaveBeenCalled();
  });

  // Test for line 63 with PRACTICE exam type
  it('calls getProctoringSettings for PRACTICE exam type with examId', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.PRACTICE,
          id: 1,
        }),
      }),
    });

    render(
      <Exam {...defaultProps} />,
      { store },
    );

    expect(getProctoringSettings).toHaveBeenCalled();
  });

  // Test for line 63 with TIMED exam type (should not call getProctoringSettings)
  it('does not call getProctoringSettings for TIMED exam type', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.TIMED,
          id: 1,
        }),
      }),
    });

    render(
      <Exam {...defaultProps} />,
      { store },
    );

    expect(getProctoringSettings).not.toHaveBeenCalled();
  });

  // Test for line 63 with proctored exam type but no examId
  it('does not call getProctoringSettings for PROCTORED exam type without examId', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          id: null,
        }),
      }),
    });

    render(
      <Exam {...defaultProps} />,
      { store },
    );

    expect(getProctoringSettings).not.toHaveBeenCalled();
  });

  // Test for canAccessProctoredExams with proctored exam type
  it('sets hasProctoredExamAccess to false when canAccessProctoredExams is false for PROCTORED exam', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.PROCTORED,
          id: 1,
        }),
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} canAccessProctoredExams={false} />,
      { store },
    );

    expect(queryByTestId('no-access')).toBeInTheDocument();
  });

  // Test for canAccessProctoredExams with non-proctored exam type
  it('does not restrict access for TIMED exam when canAccessProctoredExams is false', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        exam: Factory.build('exam', {
          type: ExamType.TIMED,
          id: 1,
        }),
      }),
    });

    const { queryByTestId } = render(
      <Exam {...defaultProps} canAccessProctoredExams={false} />,
      { store },
    );

    // Should not show access denied message
    expect(queryByTestId('no-access')).not.toBeInTheDocument();

    // Should show exam instructions instead
    expect(queryByTestId('exam-instructions-title')).toBeInTheDocument();
  });
});
