import '@testing-library/jest-dom';
import React from 'react';
import {
  render,
  screen,
  initializeMockApp,
  initializeTestStore,
} from '../setupTest';
import ErrorExamInstructions from './ErrorInstructions';
import { ExamType } from '../constants';
import Footer from './proctored_exam/Footer';

// Mock the imported components
jest.mock('./proctored_exam/Footer', () => jest.fn(() => <div data-testid="footer-component" />));
jest.mock('./practice_exam', () => ({
  ErrorPracticeExamInstructions: jest.fn(() => <div>Error Practice Exam Instructions</div>),
}));
jest.mock('./onboarding_exam', () => ({
  ErrorOnboardingExamInstructions: jest.fn(() => <div>Error Onboarding Exam Instructions</div>),
}));
jest.mock('./proctored_exam', () => ({
  ErrorProctoredExamInstructions: jest.fn(() => <div>Error Proctored Exam Instructions</div>),
}));

describe('ErrorExamInstructions', () => {
  let store;

  beforeEach(() => {
    initializeMockApp();
    store = initializeTestStore();
    jest.clearAllMocks();
  });

  it('renders correct instructions based on examType', () => {
    // Test for PROCTORED exam type
    const { rerender } = render(
      <ErrorExamInstructions examType={ExamType.PROCTORED} />,
      { store },
    );
    expect(screen.getByText('Error Proctored Exam Instructions')).toBeInTheDocument();

    // Test for ONBOARDING exam type
    rerender(
      <ErrorExamInstructions examType={ExamType.ONBOARDING} />,
    );
    expect(screen.getByText('Error Onboarding Exam Instructions')).toBeInTheDocument();

    // Test for PRACTICE exam type
    rerender(
      <ErrorExamInstructions examType={ExamType.PRACTICE} />,
    );
    expect(screen.getByText('Error Practice Exam Instructions')).toBeInTheDocument();
  });

  it('renders Footer component when examType is not TIMED', () => {
    render(
      <ErrorExamInstructions examType={ExamType.PROCTORED} />,
      { store },
    );

    // Verify that the Footer component is rendered
    expect(screen.getByTestId('footer-component')).toBeInTheDocument();

    // Verify that Footer was called
    expect(Footer).toHaveBeenCalled();
  });

  it('does not render Footer component when examType is TIMED', () => {
    render(
      <ErrorExamInstructions examType={ExamType.TIMED} />,
      { store },
    );

    // Verify that the Footer component is not rendered
    expect(screen.queryByTestId('footer-component')).not.toBeInTheDocument();

    // Verify that Footer was not called
    expect(Footer).not.toHaveBeenCalled();
  });

  it('returns null for unknown exam type', () => {
    // This test specifically targets line 20 in ErrorInstructions.jsx
    render(
      <ErrorExamInstructions examType="UNKNOWN_TYPE" />,
      { store },
    );

    // Verify that no instruction components are rendered
    expect(screen.queryByText('Error Proctored Exam Instructions')).not.toBeInTheDocument();
    expect(screen.queryByText('Error Onboarding Exam Instructions')).not.toBeInTheDocument();
    expect(screen.queryByText('Error Practice Exam Instructions')).not.toBeInTheDocument();

    // Verify that the Footer component is rendered
    expect(screen.getByTestId('footer-component')).toBeInTheDocument();

    // This test specifically verifies that the default case in the switch statement
    // returns null, which means no instruction component is rendered inside the Container
  });
});
