import '@testing-library/jest-dom';
import React from 'react';
import {
  render, screen, initializeMockApp, initializeTestStore,
} from '../setupTest';
import EntranceExamInstructions from './EntranceInstructions';
import { ExamType } from '../constants';
import Footer from './proctored_exam/Footer';
import { TimedExamFooter } from './timed_exam';

// Mock the imported components
jest.mock('./proctored_exam/Footer', () => jest.fn(() => <div data-testid="footer-component" />));
jest.mock('./timed_exam', () => ({
  TimedExamFooter: jest.fn(() => <div data-testid="timed-exam-footer-component" />),
  StartTimedExamInstructions: jest.fn(() => <div>Start Timed Exam Instructions</div>),
}));
jest.mock('./proctored_exam', () => ({
  EntranceProctoredExamInstructions: jest.fn(() => <div>Entrance Proctored Exam Instructions</div>),
}));
jest.mock('./onboarding_exam', () => ({
  EntranceOnboardingExamInstructions: jest.fn(() => <div>Entrance Onboarding Exam Instructions</div>),
}));
jest.mock('./practice_exam', () => ({
  EntrancePracticeExamInstructions: jest.fn(() => <div>Entrance Practice Exam Instructions</div>),
}));

describe('EntranceExamInstructions', () => {
  const skipProctoredExam = jest.fn();
  let store;

  beforeEach(() => {
    initializeMockApp();
    store = initializeTestStore();
    jest.clearAllMocks();
  });

  it('renders Footer component when examType is not TIMED', () => {
    // This test specifically targets line 23 in EntranceInstructions.jsx
    render(
      <EntranceExamInstructions
        examType={ExamType.PROCTORED}
        skipProctoredExam={skipProctoredExam}
      />,
      { store },
    );

    // Verify that the Footer component is rendered
    expect(screen.getByTestId('footer-component')).toBeInTheDocument();

    // Verify that the TimedExamFooter component is not rendered
    expect(screen.queryByTestId('timed-exam-footer-component')).not.toBeInTheDocument();

    // Verify that Footer was called
    expect(Footer).toHaveBeenCalled();
  });

  it('renders TimedExamFooter component when examType is TIMED', () => {
    render(
      <EntranceExamInstructions
        examType={ExamType.TIMED}
        skipProctoredExam={skipProctoredExam}
      />,
      { store },
    );

    // Verify that the TimedExamFooter component is rendered
    expect(screen.getByTestId('timed-exam-footer-component')).toBeInTheDocument();

    // Verify that the Footer component is not rendered
    expect(screen.queryByTestId('footer-component')).not.toBeInTheDocument();

    // Verify that TimedExamFooter was called
    expect(TimedExamFooter).toHaveBeenCalled();
  });

  it('renders correct instructions based on examType', () => {
    // Test for PROCTORED exam type
    const { rerender } = render(
      <EntranceExamInstructions
        examType={ExamType.PROCTORED}
        skipProctoredExam={skipProctoredExam}
      />,
      { store },
    );
    expect(screen.getByText('Entrance Proctored Exam Instructions')).toBeInTheDocument();

    // Test for ONBOARDING exam type
    rerender(
      <EntranceExamInstructions
        examType={ExamType.ONBOARDING}
        skipProctoredExam={skipProctoredExam}
      />,
    );
    expect(screen.getByText('Entrance Onboarding Exam Instructions')).toBeInTheDocument();

    // Test for PRACTICE exam type
    rerender(
      <EntranceExamInstructions
        examType={ExamType.PRACTICE}
        skipProctoredExam={skipProctoredExam}
      />,
    );
    expect(screen.getByText('Entrance Practice Exam Instructions')).toBeInTheDocument();

    // Test for TIMED exam type
    rerender(
      <EntranceExamInstructions
        examType={ExamType.TIMED}
        skipProctoredExam={skipProctoredExam}
      />,
    );
    expect(screen.getByText('Start Timed Exam Instructions')).toBeInTheDocument();
  });

  it('renders null for unknown exam type', () => {
    render(
      <EntranceExamInstructions
        examType="UNKNOWN_TYPE"
        skipProctoredExam={skipProctoredExam}
      />,
      { store },
    );

    // The container should only have the Footer component
    const container = screen.getByTestId('footer-component').parentElement;
    expect(container.children.length).toBe(2); // Container and Footer

    // Verify that no instruction components are rendered
    expect(screen.queryByText('Entrance Proctored Exam Instructions')).not.toBeInTheDocument();
    expect(screen.queryByText('Entrance Onboarding Exam Instructions')).not.toBeInTheDocument();
    expect(screen.queryByText('Entrance Practice Exam Instructions')).not.toBeInTheDocument();
    expect(screen.queryByText('Start Timed Exam Instructions')).not.toBeInTheDocument();
  });
});
