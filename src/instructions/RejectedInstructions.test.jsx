import React from 'react';
import { Factory } from 'rosie';
import RejectedInstructions from './RejectedInstructions';
import {
  render, screen, initializeTestStore, initializeMockApp,
} from '../setupTest';
import { ExamStatus, ExamType } from '../constants';

// Mock the Footer component to simplify testing
jest.mock('./proctored_exam/Footer', () => function MockFooter() {
  return <div data-testid="mock-footer">Mock Footer</div>;
});

// Mock the RejectedOnboardingExamInstructions component
jest.mock('./onboarding_exam/RejectedOnboardingExamInstructions', () => function MockRejectedOnboardingExamInstructions() {
  return <div data-testid="mock-rejected-onboarding">Mock Rejected Onboarding Instructions</div>;
});

// Mock the RejectedProctoredExamInstructions component
jest.mock('./proctored_exam/RejectedProctoredExamInstructions', () => function MockRejectedProctoredExamInstructions() {
  return <div data-testid="mock-rejected-proctored">Mock Rejected Proctored Instructions</div>;
});

describe('RejectedInstructions', () => {
  beforeEach(() => {
    initializeMockApp();
  });

  /**
   * Test case for rendering the component with PROCTORED exam type
   * This verifies that the correct instructions component is rendered
   * and the footer message is displayed
   */
  describe('with PROCTORED exam type', () => {
    beforeEach(() => {
      // Initialize store with a proctored exam with REJECTED status
      const preloadedState = {
        specialExams: Factory.build('specialExams', {
          exam: Factory.build('exam', {
            type: ExamType.PROCTORED,
            attempt: Factory.build('attempt', {
              attempt_status: ExamStatus.REJECTED,
            }),
          }),
        }),
      };
      initializeTestStore(preloadedState);

      // Render the component
      render(
        <RejectedInstructions examType={ExamType.PROCTORED} />,
      );
    });

    it('renders the RejectedProctoredExamInstructions component', () => {
      // Test that the RejectedProctoredExamInstructions component is rendered
      expect(screen.getByTestId('mock-rejected-proctored')).toBeInTheDocument();
    });

    it('renders the footer message for proctored exams', () => {
      // Test that the footer message is rendered
      expect(screen.getByText('If you have concerns about your proctoring session results, contact your course team.')).toBeInTheDocument();
    });

    it('renders the Footer component', () => {
      // Test that the Footer component is rendered
      expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    });
  });

  /**
   * Test case for rendering the component with PRACTICE exam type
   * This verifies that the correct instructions component is rendered
   * and the footer message is not displayed
   */
  describe('with PRACTICE exam type', () => {
    beforeEach(() => {
      // Initialize store with a practice exam with REJECTED status
      const preloadedState = {
        specialExams: Factory.build('specialExams', {
          exam: Factory.build('exam', {
            type: ExamType.PRACTICE,
            attempt: Factory.build('attempt', {
              attempt_status: ExamStatus.REJECTED,
            }),
          }),
        }),
      };
      initializeTestStore(preloadedState);

      // Render the component
      render(
        <RejectedInstructions examType={ExamType.PRACTICE} />,
      );
    });

    it('renders the RejectedProctoredExamInstructions component', () => {
      // Test that the RejectedProctoredExamInstructions component is rendered
      expect(screen.getByTestId('mock-rejected-proctored')).toBeInTheDocument();
    });

    it('does not render the footer message for proctored exams', () => {
      // Test that the footer message is not rendered
      expect(screen.queryByText('If you have concerns about your proctoring session results, contact your course team.')).not.toBeInTheDocument();
    });

    it('renders the Footer component', () => {
      // Test that the Footer component is rendered
      expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    });
  });

  /**
   * Test case for rendering the component with ONBOARDING exam type
   * This verifies that the correct instructions component is rendered
   * and the footer message is not displayed
   */
  describe('with ONBOARDING exam type', () => {
    beforeEach(() => {
      // Initialize store with an onboarding exam with REJECTED status
      const preloadedState = {
        specialExams: Factory.build('specialExams', {
          exam: Factory.build('exam', {
            type: ExamType.ONBOARDING,
            attempt: Factory.build('attempt', {
              attempt_status: ExamStatus.REJECTED,
            }),
          }),
        }),
      };
      initializeTestStore(preloadedState);

      // Render the component
      render(
        <RejectedInstructions examType={ExamType.ONBOARDING} />,
      );
    });

    it('renders the RejectedOnboardingExamInstructions component', () => {
      // Test that the RejectedOnboardingExamInstructions component is rendered
      expect(screen.getByTestId('mock-rejected-onboarding')).toBeInTheDocument();
    });

    it('does not render the footer message for proctored exams', () => {
      // Test that the footer message is not rendered
      expect(screen.queryByText('If you have concerns about your proctoring session results, contact your course team.')).not.toBeInTheDocument();
    });

    it('renders the Footer component', () => {
      // Test that the Footer component is rendered
      expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    });
  });

  /**
   * Test case for rendering the component with an unknown exam type
   * This verifies that no instructions component is rendered
   * and the footer message is not displayed
   */
  describe('with unknown exam type', () => {
    beforeEach(() => {
      // Initialize store with an exam with an unknown type
      const preloadedState = {
        specialExams: Factory.build('specialExams', {
          exam: Factory.build('exam', {
            type: 'unknown',
            attempt: Factory.build('attempt', {
              attempt_status: ExamStatus.REJECTED,
            }),
          }),
        }),
      };
      initializeTestStore(preloadedState);

      // Render the component
      render(
        <RejectedInstructions examType="unknown" />,
      );
    });

    it('does not render any instructions component', () => {
      // Test that no instructions component is rendered
      expect(screen.queryByTestId('mock-rejected-proctored')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-rejected-onboarding')).not.toBeInTheDocument();
    });

    it('does not render the footer message for proctored exams', () => {
      // Test that the footer message is not rendered
      expect(screen.queryByText('If you have concerns about your proctoring session results, contact your course team.')).not.toBeInTheDocument();
    });

    it('renders the Footer component', () => {
      // Test that the Footer component is rendered
      expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    });
  });

  /**
   * Test case for component structure and accessibility
   * This verifies the component structure and accessibility features
   */
  describe('component structure and accessibility', () => {
    beforeEach(() => {
      // Initialize store with a proctored exam with REJECTED status
      const preloadedState = {
        specialExams: Factory.build('specialExams', {
          exam: Factory.build('exam', {
            type: ExamType.PROCTORED,
            attempt: Factory.build('attempt', {
              attempt_status: ExamStatus.REJECTED,
            }),
          }),
        }),
      };
      initializeTestStore(preloadedState);

      // Render the component
      render(
        <RejectedInstructions examType={ExamType.PROCTORED} />,
      );
    });

    it('has the correct elements with proper classes', () => {
      // Check for the container with bg-danger-100 class
      const dangerContainer = document.querySelector('.bg-danger-100');
      expect(dangerContainer).toBeInTheDocument();
      expect(dangerContainer).toHaveClass('border', 'py-5', 'mb-4');

      // Check for the mock rejected proctored instructions
      const instructions = screen.getByTestId('mock-rejected-proctored');
      expect(instructions).toBeInTheDocument();

      // Check for the footer message
      const footerMessage = screen.getByText('If you have concerns about your proctoring session results, contact your course team.');
      expect(footerMessage).toBeInTheDocument();
      const footerMessageContainer = footerMessage.closest('div');
      expect(footerMessageContainer).toHaveClass('footer-sequence');

      // Check for the footer component
      const footer = screen.getByTestId('mock-footer');
      expect(footer).toBeInTheDocument();
    });
  });
});
