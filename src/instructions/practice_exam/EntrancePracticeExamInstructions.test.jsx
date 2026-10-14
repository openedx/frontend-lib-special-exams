import React from 'react';
import { Factory } from 'rosie';
import { EntrancePracticeExamInstructions } from './index';
import {
  render, screen, fireEvent,
} from '../../setupTest';
import { ExamType } from '../../constants';

const mockCreateProctoredExamAttempt = jest.fn();
jest.mock('../../data', () => ({
  ...jest.requireActual('../../data'),
  useCreateProctoredExamAttempt: () => ({ mutate: mockCreateProctoredExamAttempt }),
}));

describe('EntrancePracticeExamInstructions', () => {
  const practiceExam = {
    exam: Factory.build('exam', {
      is_proctored: true,
      type: ExamType.PRACTICE,
      attempt: Factory.build('attempt'),
    }),
  };
  // Reset mocks after each test
  afterEach(() => {
    jest.resetAllMocks();
  });

  /**
   * Test case for rendering the component with default state
   * This verifies that all UI elements are correctly rendered
   */
  describe('component rendering', () => {
    beforeEach(() => {
      // Initialize store with a practice exam
      // Render the component
      render(
        <EntrancePracticeExamInstructions />,
        { specialExams: practiceExam },
      );
    });

    it('renders the title correctly', () => {
      // Test that the title is rendered correctly
      expect(screen.getByTestId('exam-instructions-title')).toBeInTheDocument();
      expect(screen.getByTestId('exam-instructions-title')).toHaveTextContent('Try a proctored exam');
    });

    it('renders the description text correctly', () => {
      // Test that the description paragraphs are rendered correctly
      expect(screen.getByText(/Get familiar with proctoring for real exams later in the course/)).toBeInTheDocument();
      expect(screen.getByText(/You will be guided through steps to set up online proctoring software and verify your identity/)).toBeInTheDocument();
    });

    it('renders the start exam button correctly', () => {
      // Test that the button is rendered correctly
      const button = screen.getByTestId('start-exam-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Continue to my practice exam.');
    });

    it('renders the informational text correctly', () => {
      // Test that the informational text is rendered correctly
      expect(screen.getByText(
        /this practice exam has no impact on your grade in the course/i,
      )).toBeInTheDocument();
    });
  });

  /**
   * Test case for button click functionality
   * This verifies that clicking the button dispatches the correct action
   */
  describe('button click functionality', () => {
    beforeEach(() => {
      // Initialize store with a practice exam
      // Render the component
      render(
        <EntrancePracticeExamInstructions />,
        { specialExams: practiceExam },
      );
    });

    it('creates the proctored attempt when clicking the start button', () => {
      expect(mockCreateProctoredExamAttempt).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('start-exam-button'));

      expect(mockCreateProctoredExamAttempt).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test case for different exam types
   * This verifies the component works correctly with different exam configurations
   */
  describe('with different exam types', () => {
    it('renders correctly with a non-proctored exam', () => {
      // Initialize store with a non-proctored practice exam
      const specialExams = {
        exam: Factory.build('exam', {
          is_proctored: false,
          type: ExamType.PRACTICE,
          attempt: Factory.build('attempt'),
        }),
      };

      // Render the component
      render(
        <EntrancePracticeExamInstructions />,
        { specialExams },
      );

      // Verify the component renders correctly
      expect(screen.getByTestId('exam-instructions-title')).toHaveTextContent('Try a proctored exam');
      expect(screen.getByTestId('start-exam-button')).toBeInTheDocument();
    });

    it('renders correctly with a timed exam', () => {
      // Initialize store with a timed practice exam
      const specialExams = {
        exam: Factory.build('exam', {
          is_proctored: false,
          is_timed: true,
          type: ExamType.PRACTICE,
          attempt: Factory.build('attempt'),
        }),
      };

      // Render the component
      render(
        <EntrancePracticeExamInstructions />,
        { specialExams },
      );

      // Verify the component renders correctly
      expect(screen.getByTestId('exam-instructions-title')).toHaveTextContent('Try a proctored exam');
      expect(screen.getByTestId('start-exam-button')).toBeInTheDocument();
    });
  });

  /**
   * Test case for component structure and accessibility
   * This verifies the component structure and accessibility features
   */
  describe('component structure and accessibility', () => {
    beforeEach(() => {
      // Initialize store with a practice exam
      // Render the component
      render(
        <EntrancePracticeExamInstructions />,
        { specialExams: practiceExam },
      );
    });

    it('has the correct button variant', () => {
      // Verify the button has the correct variant (primary)
      const button = screen.getByTestId('start-exam-button');
      expect(button).toHaveClass('btn-primary');
    });

    it('has the correct structure with paragraphs and button', () => {
      // Verify the component structure
      const title = screen.getByTestId('exam-instructions-title');
      const button = screen.getByTestId('start-exam-button');
      const paragraphs = screen.getAllByText(/./i, { selector: 'p' });

      expect(title).toBeInTheDocument();
      expect(button).toBeInTheDocument();
      // There are 2 paragraphs (button is in a p tag but not matched by getAllByText)
      expect(paragraphs.length).toBe(2);
    });
  });
});
