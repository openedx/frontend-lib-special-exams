import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent } from '@testing-library/dom';
import EntranceProctoredExamInstructions from './EntranceProctoredExamInstructions';
import { createProctoredExamAttempt } from '../../data';
import {
  initializeMockApp,
  initializeTestStore,
  render,
  screen,
} from '../../setupTest';

// Mock the data module
jest.mock('../../data', () => ({
  createProctoredExamAttempt: jest.fn(),
}));

// Mock the SkipProctoredExamButton component with a simple function
// This avoids using PropTypes entirely
jest.mock('./SkipProctoredExamButton', () => ({
  __esModule: true,
  default: function MockSkipProctoredExamButton(props) {
    return (
      <button
        type="button"
        data-testid="skip-proctored-exam-button-mock"
        onClick={props.handleClick}
      >
        Skip Proctored Exam
      </button>
    );
  },
}));

describe('EntranceProctoredExamInstructions', () => {
  let store;
  const skipProctoredExamMock = jest.fn();

  beforeEach(() => {
    initializeMockApp();
    jest.clearAllMocks();
    store = initializeTestStore();
    store.dispatch = jest.fn();
  });

  /**
   * Test case for rendering when attempt_ready_to_resume is false
   * This tests the default rendering of the component
   */
  it('renders correctly when attempt_ready_to_resume is false', () => {
    // Set up the store state
    store.getState = () => ({
      specialExams: {
        exam: {
          attempt: {
            attempt_ready_to_resume: false,
            total_time: '30 minutes',
          },
        },
        allowProctoringOptOut: true,
      },
    });

    render(
      <EntranceProctoredExamInstructions skipProctoredExam={skipProctoredExamMock} />,
      { store },
    );

    // Verify the title is rendered correctly
    expect(screen.getByTestId('proctored-exam-instructions-title'))
      .toHaveTextContent('This exam is proctored');

    // Verify the button is rendered
    expect(screen.getByTestId('start-exam-button'))
      .toHaveTextContent('Continue to my proctored exam.');

    // Verify the skip button is rendered
    expect(screen.getByTestId('skip-proctored-exam-button-mock'))
      .toBeInTheDocument();
  });

  /**
   * Test case for rendering when attempt_ready_to_resume is true
   * This tests the conditional rendering branch in the component
   */
  it('renders correctly when attempt_ready_to_resume is true', () => {
    // Set up the store state
    store.getState = () => ({
      specialExams: {
        exam: {
          attempt: {
            attempt_ready_to_resume: true,
            total_time: '30 minutes',
          },
        },
        allowProctoringOptOut: true,
      },
    });

    render(
      <EntranceProctoredExamInstructions skipProctoredExam={skipProctoredExamMock} />,
      { store },
    );

    // Verify the title is rendered correctly
    expect(screen.getByTestId('proctored-exam-instructions-title'))
      .toHaveTextContent('Your exam is ready to be resumed.');

    // Verify the text about total time is rendered
    expect(screen.getByText('You will have 30 minutes to complete your exam.'))
      .toBeInTheDocument();

    // Verify the button is rendered
    expect(screen.getByTestId('start-exam-button'))
      .toHaveTextContent('Continue to my proctored exam.');

    // Verify the skip button is rendered
    expect(screen.getByTestId('skip-proctored-exam-button-mock'))
      .toBeInTheDocument();
  });

  /**
   * Test case for when allowProctoringOptOut is false
   * This tests the conditional rendering of the SkipProctoredExamButton
   */
  it('does not render skip button when allowProctoringOptOut is false', () => {
    // Set up the store state
    store.getState = () => ({
      specialExams: {
        exam: {
          attempt: {
            attempt_ready_to_resume: false,
            total_time: '30 minutes',
          },
        },
        allowProctoringOptOut: false,
      },
    });

    render(
      <EntranceProctoredExamInstructions skipProctoredExam={skipProctoredExamMock} />,
      { store },
    );

    // Verify the title is rendered correctly
    expect(screen.getByTestId('proctored-exam-instructions-title'))
      .toHaveTextContent('This exam is proctored');

    // Verify the button is rendered
    expect(screen.getByTestId('start-exam-button'))
      .toHaveTextContent('Continue to my proctored exam.');

    // Verify the skip button is NOT rendered
    expect(screen.queryByTestId('skip-proctored-exam-button-mock'))
      .not.toBeInTheDocument();
  });

  /**
   * Test case for clicking the "Continue to my proctored exam" button
   * This tests the onClick handler for the button
   */
  it('dispatches createProctoredExamAttempt when continue button is clicked', () => {
    // Set up the mock function
    createProctoredExamAttempt.mockReturnValue({ type: 'CREATE_PROCTORED_EXAM_ATTEMPT' });

    // Set up the store state
    store.getState = () => ({
      specialExams: {
        exam: {
          attempt: {
            attempt_ready_to_resume: false,
            total_time: '30 minutes',
          },
        },
        allowProctoringOptOut: true,
      },
    });

    render(
      <EntranceProctoredExamInstructions skipProctoredExam={skipProctoredExamMock} />,
      { store },
    );

    // Click the continue button
    fireEvent.click(screen.getByTestId('start-exam-button'));

    // Verify the createProctoredExamAttempt function was called
    expect(createProctoredExamAttempt).toHaveBeenCalled();

    // Verify the dispatch was called with the correct action
    expect(store.dispatch).toHaveBeenCalledWith({ type: 'CREATE_PROCTORED_EXAM_ATTEMPT' });
  });

  /**
   * Test case for clicking the skip button
   * This tests the skipProctoredExam prop function
   */
  it('calls skipProctoredExam when skip button is clicked', () => {
    // Set up the store state
    store.getState = () => ({
      specialExams: {
        exam: {
          attempt: {
            attempt_ready_to_resume: false,
            total_time: '30 minutes',
          },
        },
        allowProctoringOptOut: true,
      },
    });

    render(
      <EntranceProctoredExamInstructions skipProctoredExam={skipProctoredExamMock} />,
      { store },
    );

    // Click the skip button
    fireEvent.click(screen.getByTestId('skip-proctored-exam-button-mock'));

    // Verify the skipProctoredExam function was called
    expect(skipProctoredExamMock).toHaveBeenCalled();
  });

  /**
   * Test case for when total_time is undefined
   * This tests the default value for totalTime
   */
  it('handles undefined total_time correctly', () => {
    // Set up the store state
    store.getState = () => ({
      specialExams: {
        exam: {
          attempt: {
            attempt_ready_to_resume: true,
            // total_time is undefined
          },
        },
        allowProctoringOptOut: true,
      },
    });

    render(
      <EntranceProctoredExamInstructions skipProctoredExam={skipProctoredExamMock} />,
      { store },
    );

    // Verify the text about total time is rendered with the default value
    expect(screen.getByText('You will have 0 to complete your exam.'))
      .toBeInTheDocument();
  });

  // Note: We can't test the case where attempt is undefined without modifying the component code.
  // The component assumes attempt is always defined and will throw an error if it's not.
  // This is a limitation of the current implementation and would require a code change to fix.
  // Since we're not allowed to modify the JavaScript files, we'll leave this as a known limitation.
});
