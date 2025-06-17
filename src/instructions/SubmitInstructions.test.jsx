import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent } from '@testing-library/dom';
import {
  render, screen, act, initializeMockApp, initializeTestStore,
} from '../setupTest';
import SubmitExamInstructions from './SubmitInstructions';
import { ExamType } from '../constants';
import Emitter from '../data/emitter';
import { TIMER_REACHED_NULL } from '../timer/events';
import { continueExam } from '../data';

// Mock the imported components
jest.mock('./proctored_exam/Footer', () => jest.fn(() => <div data-testid="footer-component" />));
jest.mock('./proctored_exam', () => ({
  SubmitProctoredExamInstructions: jest.fn(() => <div data-testid="submit-proctored-exam-instructions" />),
}));
jest.mock('./timed_exam', () => ({
  SubmitTimedExamInstructions: jest.fn(() => <div data-testid="submit-timed-exam-instructions" />),
}));

// Mock the continueExam function
jest.mock('../data', () => ({
  continueExam: jest.fn(),
}));
continueExam.mockReturnValue(jest.fn());

describe('SubmitExamInstructions', () => {
  let store;

  beforeEach(() => {
    initializeMockApp();
    store = initializeTestStore();
    jest.clearAllMocks();
  });

  it('renders correct instructions based on examType', () => {
    // Test for PROCTORED exam type
    store.getState = () => ({
      specialExams: {
        exam: { type: ExamType.PROCTORED },
        activeAttempt: { time_remaining_seconds: 100 },
      },
    });

    const { rerender } = render(
      <SubmitExamInstructions />,
      { store },
    );
    expect(screen.getByTestId('submit-proctored-exam-instructions')).toBeInTheDocument();
    expect(screen.getByTestId('footer-component')).toBeInTheDocument();

    // Test for TIMED exam type
    store.getState = () => ({
      specialExams: {
        exam: { type: ExamType.TIMED },
        activeAttempt: { time_remaining_seconds: 100 },
      },
    });

    rerender(
      <SubmitExamInstructions />,
    );
    expect(screen.getByTestId('submit-timed-exam-instructions')).toBeInTheDocument();
    expect(screen.queryByTestId('footer-component')).not.toBeInTheDocument();
  });

  it('shows continue button when timeRemaining > 0', () => {
    // This test specifically targets line 19 in SubmitInstructions.jsx
    // where canContinue is set based on timeRemaining > 0
    store.getState = () => ({
      specialExams: {
        exam: { type: ExamType.PROCTORED },
        activeAttempt: { time_remaining_seconds: 100 },
      },
    });

    render(
      <SubmitExamInstructions />,
      { store },
    );

    const continueButton = screen.getByTestId('continue-exam-button');
    expect(continueButton).toBeInTheDocument();
    expect(continueButton).toHaveTextContent("No, I'd like to continue working");

    // Test that clicking the button calls continueExam
    fireEvent.click(continueButton);
    expect(continueExam).toHaveBeenCalledTimes(1);
  });

  it('does not show continue button when timeRemaining <= 0', () => {
    // This test specifically targets line 19 in SubmitInstructions.jsx
    // where canContinue is set based on timeRemaining > 0
    store.getState = () => ({
      specialExams: {
        exam: { type: ExamType.PROCTORED },
        activeAttempt: { time_remaining_seconds: 0 },
      },
    });

    render(
      <SubmitExamInstructions />,
      { store },
    );

    // Verify that the continue button is not rendered
    expect(screen.queryByTestId('continue-exam-button')).not.toBeInTheDocument();
  });

  it('does not show continue button when timeRemaining is undefined', () => {
    // This test specifically targets line 19 in SubmitInstructions.jsx
    // where canContinue is set based on timeRemaining > 0
    // Testing the case where timeRemaining is undefined
    store.getState = () => ({
      specialExams: {
        exam: { type: ExamType.PROCTORED },
        activeAttempt: { }, // time_remaining_seconds is undefined
      },
    });

    render(
      <SubmitExamInstructions />,
      { store },
    );

    // Verify that the continue button is not rendered
    expect(screen.queryByTestId('continue-exam-button')).not.toBeInTheDocument();
  });

  it('does not show continue button when timeRemaining is negative', () => {
    // This test specifically targets line 19 in SubmitInstructions.jsx
    // where canContinue is set based on timeRemaining > 0
    // Testing the case where timeRemaining is negative
    store.getState = () => ({
      specialExams: {
        exam: { type: ExamType.PROCTORED },
        activeAttempt: { time_remaining_seconds: -10 },
      },
    });

    render(
      <SubmitExamInstructions />,
      { store },
    );

    // Verify that the continue button is not rendered
    expect(screen.queryByTestId('continue-exam-button')).not.toBeInTheDocument();
  });

  it('does not show continue button when timeRemaining is null', () => {
    // This test specifically targets line 19 in SubmitInstructions.jsx
    // where canContinue is set based on timeRemaining > 0
    // Testing the case where timeRemaining is null
    store.getState = () => ({
      specialExams: {
        exam: { type: ExamType.PROCTORED },
        activeAttempt: { time_remaining_seconds: null },
      },
    });

    render(
      <SubmitExamInstructions />,
      { store },
    );

    // Verify that the continue button is not rendered
    expect(screen.queryByTestId('continue-exam-button')).not.toBeInTheDocument();
  });

  it('renders correctly when exam is undefined', () => {
    // This test specifically targets line 19 in SubmitInstructions.jsx
    // Testing the case where exam is undefined, which would make examType undefined
    store.getState = () => ({
      specialExams: {
        // exam is undefined
        activeAttempt: { time_remaining_seconds: 100 },
      },
    });

    render(
      <SubmitExamInstructions />,
      { store },
    );

    // Since examType is undefined, it should default to the non-TIMED branch
    expect(screen.getByTestId('submit-proctored-exam-instructions')).toBeInTheDocument();
    expect(screen.getByTestId('footer-component')).toBeInTheDocument();

    // Since timeRemaining > 0, the continue button should be rendered
    expect(screen.getByTestId('continue-exam-button')).toBeInTheDocument();
  });

  // Note: We can't test the case where activeAttempt is undefined
  // because the component doesn't handle that case - it would throw an error
  // when trying to destructure time_remaining_seconds from undefined

  it('hides continue button when TIMER_REACHED_NULL event is emitted', () => {
    // This test specifically targets the useEffect that listens for TIMER_REACHED_NULL
    store.getState = () => ({
      specialExams: {
        exam: { type: ExamType.PROCTORED },
        activeAttempt: { time_remaining_seconds: 100 },
      },
    });

    render(
      <SubmitExamInstructions />,
      { store },
    );

    // Verify that the continue button is initially rendered
    expect(screen.getByTestId('continue-exam-button')).toBeInTheDocument();

    // Emit the TIMER_REACHED_NULL event
    act(() => {
      Emitter.emit(TIMER_REACHED_NULL);
    });

    // Verify that the continue button is no longer rendered
    expect(screen.queryByTestId('continue-exam-button')).not.toBeInTheDocument();
  });
});
