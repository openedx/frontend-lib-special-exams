import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import VerifiedExamInstructions from './VerifiedInstructions';
import {
  render, screen, initializeMockApp, initializeTestStore,
} from '../setupTest';
import { ExamType } from '../constants';

// Mock the imported components
jest.mock('./onboarding_exam', () => ({
  VerifiedOnboardingExamInstructions: () => <div data-testid="verified-onboarding-exam-instructions" />,
}));

jest.mock('./proctored_exam', () => ({
  VerifiedProctoredExamInstructions: () => <div data-testid="verified-proctored-exam-instructions" />,
}));

jest.mock('./proctored_exam/Footer', () => function Footer() {
  return <div data-testid="footer" />;
});

describe('VerifiedExamInstructions', () => {
  let store;

  beforeEach(() => {
    initializeMockApp();
    store = initializeTestStore();
  });

  /**
   * Test case for PROCTORED exam type
   * This tests the first branch of the switch statement in renderInstructions
   */
  it('renders correctly for PROCTORED exam type', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams'),
    });

    render(<VerifiedExamInstructions examType={ExamType.PROCTORED} />, { store });

    // Verify the component renders the correct instructions
    expect(screen.getByTestId('verified-proctored-exam-instructions')).toBeInTheDocument();

    // Verify the Footer component is rendered
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  /**
   * Test case for PRACTICE exam type
   * This tests the second branch of the switch statement in renderInstructions
   */
  it('renders correctly for PRACTICE exam type', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams'),
    });

    render(<VerifiedExamInstructions examType={ExamType.PRACTICE} />, { store });

    // Verify the component renders the correct instructions
    expect(screen.getByTestId('verified-proctored-exam-instructions')).toBeInTheDocument();

    // Verify the Footer component is rendered
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  /**
   * Test case for ONBOARDING exam type
   * This tests the third branch of the switch statement in renderInstructions
   */
  it('renders correctly for ONBOARDING exam type', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams'),
    });

    render(<VerifiedExamInstructions examType={ExamType.ONBOARDING} />, { store });

    // Verify the component renders the correct instructions
    expect(screen.getByTestId('verified-onboarding-exam-instructions')).toBeInTheDocument();

    // Verify the Footer component is rendered
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  /**
   * Test case for TIMED exam type
   * This tests the default branch of the switch statement in renderInstructions
   * and the conditional rendering of the Footer component
   */
  it('renders correctly for TIMED exam type (default case)', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams'),
    });

    render(<VerifiedExamInstructions examType={ExamType.TIMED} />, { store });

    // Verify the container is rendered but no instructions (default case returns null)
    expect(screen.queryByTestId('verified-proctored-exam-instructions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('verified-onboarding-exam-instructions')).not.toBeInTheDocument();

    // Verify the Footer component is NOT rendered for TIMED exam type
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });

  /**
   * Test case for an unknown exam type
   * This tests the default branch of the switch statement in renderInstructions
   */
  it('renders correctly for unknown exam type', () => {
    store.getState = () => ({
      specialExams: Factory.build('specialExams'),
    });

    render(<VerifiedExamInstructions examType="UNKNOWN_TYPE" />, { store });

    // Verify the container is rendered but no instructions (default case returns null)
    expect(screen.queryByTestId('verified-proctored-exam-instructions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('verified-onboarding-exam-instructions')).not.toBeInTheDocument();

    // Verify the Footer component is rendered for non-TIMED exam types
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
