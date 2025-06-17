import React from 'react';
import { Factory } from 'rosie';
import { EntrancePracticeExamInstructions } from './index';
import {
  render, screen, initializeTestStore, fireEvent,
} from '../../setupTest';
import { ExamType } from '../../constants';

// Mock return value for createProctoredExamAttempt
const mockCreateAttemptReturn = { type: 'CREATE_ATTEMPT' };
const mockDispatch = jest.fn();

// Mock the react-redux useDispatch hook
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

// Mock the createProctoredExamAttempt function from data module
jest.mock('../../data', () => ({
  ...jest.requireActual('../../data'),
  createProctoredExamAttempt: () => mockCreateAttemptReturn,
}));

describe('EntrancePracticeExamInstructions', () => {
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
      const preloadedState = {
        specialExams: {
          exam: Factory.build('exam', {
            is_proctored: true,
            type: ExamType.PRACTICE,
            attempt: Factory.build('attempt'),
          }),
        },
      };
      initializeTestStore(preloadedState);

      // Render the component
      render(
        <EntrancePracticeExamInstructions />,
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
      const preloadedState = {
        specialExams: {
          exam: Factory.build('exam', {
            is_proctored: true,
            type: ExamType.PRACTICE,
            attempt: Factory.build('attempt'),
          }),
        },
      };
      initializeTestStore(preloadedState);

      // Render the component
      render(
        <EntrancePracticeExamInstructions />,
      );
    });

    it('dispatches createProctoredExamAttempt when clicking the start button', () => {
      // Verify dispatch hasn't been called yet
      expect(mockDispatch).not.toHaveBeenCalled();

      // Click the button
      fireEvent.click(screen.getByTestId('start-exam-button'));

      // Verify dispatch was called with the correct action
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(mockCreateAttemptReturn);
    });
  });

  /**
   * Test case for different exam types
   * This verifies the component works correctly with different exam configurations
   */
  describe('with different exam types', () => {
    it('renders correctly with a non-proctored exam', () => {
      // Initialize store with a non-proctored practice exam
      const preloadedState = {
        specialExams: {
          exam: Factory.build('exam', {
            is_proctored: false,
            type: ExamType.PRACTICE,
            attempt: Factory.build('attempt'),
          }),
        },
      };
      initializeTestStore(preloadedState);

      // Render the component
      render(
        <EntrancePracticeExamInstructions />,
      );

      // Verify the component renders correctly
      expect(screen.getByTestId('exam-instructions-title')).toHaveTextContent('Try a proctored exam');
      expect(screen.getByTestId('start-exam-button')).toBeInTheDocument();
    });

    it('renders correctly with a timed exam', () => {
      // Initialize store with a timed practice exam
      const preloadedState = {
        specialExams: {
          exam: Factory.build('exam', {
            is_proctored: false,
            is_timed: true,
            type: ExamType.PRACTICE,
            attempt: Factory.build('attempt'),
          }),
        },
      };
      initializeTestStore(preloadedState);

      // Render the component
      render(
        <EntrancePracticeExamInstructions />,
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
      const preloadedState = {
        specialExams: {
          exam: Factory.build('exam', {
            is_proctored: true,
            type: ExamType.PRACTICE,
            attempt: Factory.build('attempt'),
          }),
        },
      };
      initializeTestStore(preloadedState);

      // Render the component
      render(
        <EntrancePracticeExamInstructions />,
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
