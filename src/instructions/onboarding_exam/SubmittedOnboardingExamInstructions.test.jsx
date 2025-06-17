import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useToggle } from '@openedx/paragon';

import { resetExam } from '../../data';
import SubmittedOnboardingExamInstructions from './SubmittedOnboardingExamInstructions';
import { render, initializeTestStore, initializeMockApp } from '../../setupTest';

// Mock the resetExam action
jest.mock('../../data', () => ({
  resetExam: jest.fn(),
}));

// Mock the useToggle hook
jest.mock('@openedx/paragon', () => {
  const originalModule = jest.requireActual('@openedx/paragon');
  return {
    ...originalModule,
    useToggle: jest.fn(),
  };
});

describe('SubmittedOnboardingExamInstructions', () => {
  // Setup common test variables
  let store;
  const mockResetExam = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Initialize the mock app and store
    initializeMockApp();
    store = initializeTestStore();

    // Setup mock implementations
    resetExam.mockReturnValue(mockResetExam);

    // Mock the dispatch function
    store.dispatch = jest.fn();

    // Default mock for useToggle - returns [false, toggleFn]
    useToggle.mockImplementation(() => [false, jest.fn()]);
  });

  it('renders the component with all email addresses', () => {
    // Set up the store with both email addresses
    const proctoringSettings = {
      learner_notification_from_email: 'test_notification@example.com',
      integration_specific_email: 'test@example.com',
    };

    store.getState = () => ({
      specialExams: {
        proctoringSettings,
      },
    });

    render(<SubmittedOnboardingExamInstructions />, { store });

    // Verify title is rendered
    expect(screen.getByTestId('exam-instructions-title')).toHaveTextContent(
      'You have submitted this onboarding exam',
    );

    // Verify both email links are rendered
    expect(screen.getByRole('link', { name: 'test_notification@example.com' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'test@example.com' })).toBeInTheDocument();

    // Verify retry button is disabled initially
    expect(screen.getByTestId('retry-exam-button')).toBeDisabled();
  });

  it('renders the component without learner notification email', () => {
    // Set up the store with missing learner notification email
    const proctoringSettings = {
      learner_notification_from_email: null, // Missing email
      integration_specific_email: 'test@example.com',
    };

    store.getState = () => ({
      specialExams: {
        proctoringSettings,
      },
    });

    render(<SubmittedOnboardingExamInstructions />, { store });

    // Verify the integration email is still present
    expect(screen.getByRole('link', { name: 'test@example.com' })).toBeInTheDocument();

    // Verify the learner notification email link is not rendered
    // We can't check for absence by role/name, so we check the text content doesn't include it
    const pageText = screen.getByTestId('exam-instructions-title').parentElement.textContent;
    expect(pageText).not.toContain('test_notification@example.com');
  });

  it('renders the component without integration specific email', () => {
    // Set up the store with missing integration specific email
    const proctoringSettings = {
      learner_notification_from_email: 'test_notification@example.com',
      integration_specific_email: null, // Missing email
    };

    store.getState = () => ({
      specialExams: {
        proctoringSettings,
      },
    });

    render(<SubmittedOnboardingExamInstructions />, { store });

    // Verify the learner notification email is still present
    expect(screen.getByRole('link', { name: 'test_notification@example.com' })).toBeInTheDocument();

    // Verify the integration email link is not rendered
    const pageText = screen.getByTestId('exam-instructions-title').parentElement.textContent;
    expect(pageText).not.toContain('test@example.com');
  });

  it('renders the component with no email addresses', () => {
    // Set up the store with both emails missing
    const proctoringSettings = {
      learner_notification_from_email: null,
      integration_specific_email: null,
    };

    store.getState = () => ({
      specialExams: {
        proctoringSettings,
      },
    });

    render(<SubmittedOnboardingExamInstructions />, { store });

    // Verify the component still renders without errors
    expect(screen.getByTestId('exam-instructions-title')).toBeInTheDocument();

    // Verify no email links with text content are rendered
    // Note: Empty mailto links are still rendered, but they don't have text content
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.textContent).toBe('');
    });
  });

  it('renders the component with undefined proctoringSettings', () => {
    // Set up the store with undefined proctoringSettings
    store.getState = () => ({
      specialExams: {
        proctoringSettings: undefined,
      },
    });

    render(<SubmittedOnboardingExamInstructions />, { store });

    // Verify the component still renders without errors
    expect(screen.getByTestId('exam-instructions-title')).toBeInTheDocument();

    // Verify no email links with text content are rendered
    // Note: Empty mailto links are still rendered, but they don't have text content
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.textContent).toBe('');
    });
  });

  it('enables the retry button after confirmation', () => {
    // Set up the store
    const proctoringSettings = {
      learner_notification_from_email: 'test_notification@example.com',
      integration_specific_email: 'test@example.com',
    };

    store.getState = () => ({
      specialExams: {
        proctoringSettings,
      },
    });

    // Setup toggle to simulate confirmation
    // First call returns [false, confirmFn], then after the click it should return [true, confirmFn]
    const confirmFn = jest.fn().mockImplementation(() => {
      // Update the mock to return true after being called
      useToggle.mockReturnValue([true, confirmFn]);
    });
    useToggle.mockReturnValue([false, confirmFn]);

    const { rerender } = render(<SubmittedOnboardingExamInstructions />, { store });

    // Verify button is initially disabled
    const retryButton = screen.getByTestId('retry-exam-button');
    expect(retryButton).toBeDisabled();

    // Click the confirmation button
    fireEvent.click(screen.getByRole('button', {
      name: 'I understand and want to reset this onboarding exam.',
    }));

    // Verify the toggle function was called
    expect(confirmFn).toHaveBeenCalled();

    // Re-render the component to reflect the updated state
    rerender(<SubmittedOnboardingExamInstructions />);

    // Now the button should be enabled
    expect(screen.getByTestId('retry-exam-button')).not.toBeDisabled();
  });

  it('dispatches resetExam action when retry button is clicked', () => {
    // Set up the store
    const proctoringSettings = {
      learner_notification_from_email: 'test_notification@example.com',
      integration_specific_email: 'test@example.com',
    };

    store.getState = () => ({
      specialExams: {
        proctoringSettings,
      },
    });

    // Setup toggle to simulate confirmation already done
    // This needs to be the default implementation for this test
    useToggle.mockImplementation(() => [true, jest.fn()]);

    render(<SubmittedOnboardingExamInstructions />, { store });

    // Verify button is enabled
    const retryButton = screen.getByTestId('retry-exam-button');
    expect(retryButton).not.toBeDisabled();

    // Click the retry button
    fireEvent.click(retryButton);

    // Verify resetExam was called and the result was dispatched
    expect(resetExam).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(mockResetExam);
  });
});
