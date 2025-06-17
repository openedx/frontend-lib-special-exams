import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import { fireEvent } from '@testing-library/react';
import EntranceOnboardingExamInstructions from './EntranceOnboardingExamInstructions';
import {
  render, screen, initializeMockApp, initializeTestStore,
} from '../../setupTest';
import * as dataModule from '../../data';

// Mock the createProctoredExamAttempt function to test if it's called
jest.mock('../../data', () => {
  const originalModule = jest.requireActual('../../data');
  return {
    ...originalModule,
    createProctoredExamAttempt: jest.fn(() => ({ type: 'MOCK_CREATE_PROCTORED_EXAM_ATTEMPT' })),
  };
});

describe('EntranceOnboardingExamInstructions', () => {
  let store;

  beforeEach(() => {
    initializeMockApp();
    store = initializeTestStore();
    // Reset the mock before each test
    jest.clearAllMocks();
  });

  /**
   * Test case for when proctoringSettings is defined with all email properties
   * This tests the component rendering with both email contact information types
   */
  it('renders correctly with both learner notification and integration emails', () => {
    // Set up the store with proctoringSettings containing both email types
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        proctoringSettings: Factory.build('proctoringSettings', {
          provider_name: 'Test Provider',
          learner_notification_from_email: 'notification@example.com',
          integration_specific_email: 'support@example.com',
        }),
      }),
    });

    render(<EntranceOnboardingExamInstructions />, { store });

    // Verify the component renders correctly with the title
    expect(screen.getByTestId('exam-instructions-title')).toHaveTextContent(
      'Proctoring onboarding exam',
    );

    // Verify the provider name is displayed correctly
    expect(screen.getByText(/Proctoring for this course is provided via Test Provider/)).toBeInTheDocument();

    // Verify both email links are rendered with the correct emails
    const notificationEmailLink = screen.getByRole('link', { name: 'notification@example.com' });
    expect(notificationEmailLink).toBeInTheDocument();
    expect(notificationEmailLink).toHaveAttribute('href', 'mailto:notification@example.com');

    const supportEmailLink = screen.getByRole('link', { name: 'support@example.com' });
    expect(supportEmailLink).toBeInTheDocument();
    expect(supportEmailLink).toHaveAttribute('href', 'mailto:support@example.com');

    // Verify both email contact paragraphs are rendered
    expect(screen.getByTestId('learner-notification-email-contact')).toBeInTheDocument();
    expect(screen.getByTestId('integration-email-contact')).toBeInTheDocument();
  });

  /**
   * Test case for when proctoringSettings is defined with only learner_notification_from_email
   * This tests the component rendering with only notification email
   */
  it('renders correctly with only learner notification email', () => {
    // Set up the store with proctoringSettings containing only learner_notification_from_email
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        proctoringSettings: Factory.build('proctoringSettings', {
          provider_name: 'Test Provider',
          learner_notification_from_email: 'notification@example.com',
          integration_specific_email: '',
        }),
      }),
    });

    render(<EntranceOnboardingExamInstructions />, { store });

    // Verify the component renders correctly with the title
    expect(screen.getByTestId('exam-instructions-title')).toHaveTextContent(
      'Proctoring onboarding exam',
    );

    // Verify the notification email link is rendered with the correct email
    const notificationEmailLink = screen.getByRole('link', { name: 'notification@example.com' });
    expect(notificationEmailLink).toBeInTheDocument();
    expect(notificationEmailLink).toHaveAttribute('href', 'mailto:notification@example.com');

    // Verify the notification email contact paragraph is rendered
    expect(screen.getByTestId('learner-notification-email-contact')).toBeInTheDocument();

    // Verify the integration email contact paragraph is not rendered
    expect(screen.queryByTestId('integration-email-contact')).not.toBeInTheDocument();
  });

  /**
   * Test case for when proctoringSettings is defined with only integration_specific_email
   * This tests the component rendering with only support email
   */
  it('renders correctly with only integration specific email', () => {
    // Set up the store with proctoringSettings containing only integration_specific_email
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        proctoringSettings: Factory.build('proctoringSettings', {
          provider_name: 'Test Provider',
          learner_notification_from_email: '',
          integration_specific_email: 'support@example.com',
        }),
      }),
    });

    render(<EntranceOnboardingExamInstructions />, { store });

    // Verify the component renders correctly with the title
    expect(screen.getByTestId('exam-instructions-title')).toHaveTextContent(
      'Proctoring onboarding exam',
    );

    // Verify the support email link is rendered with the correct email
    const supportEmailLink = screen.getByRole('link', { name: 'support@example.com' });
    expect(supportEmailLink).toBeInTheDocument();
    expect(supportEmailLink).toHaveAttribute('href', 'mailto:support@example.com');

    // Verify the notification email contact paragraph is not rendered
    expect(screen.queryByTestId('learner-notification-email-contact')).not.toBeInTheDocument();

    // Verify the integration email contact paragraph is rendered
    expect(screen.getByTestId('integration-email-contact')).toBeInTheDocument();
  });

  /**
   * Test case for when proctoringSettings is null
   * This tests the component rendering without any email contact information
   */
  it('renders correctly when proctoringSettings is null', () => {
    // Set up the store with proctoringSettings as null
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        proctoringSettings: null,
      }),
    });

    render(<EntranceOnboardingExamInstructions />, { store });

    // Verify the component renders correctly with the title
    expect(screen.getByTestId('exam-instructions-title')).toHaveTextContent(
      'Proctoring onboarding exam',
    );

    // Verify neither email contact paragraph is rendered
    expect(screen.queryByTestId('learner-notification-email-contact')).not.toBeInTheDocument();
    expect(screen.queryByTestId('integration-email-contact')).not.toBeInTheDocument();
  });

  /**
   * Test case for when proctoringSettings is defined but both email properties are empty
   * This tests the component handling empty email values
   */
  it('renders correctly when both email properties are empty', () => {
    // Set up the store with proctoringSettings containing empty email properties
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        proctoringSettings: Factory.build('proctoringSettings', {
          provider_name: 'Test Provider',
          learner_notification_from_email: '',
          integration_specific_email: '',
        }),
      }),
    });

    render(<EntranceOnboardingExamInstructions />, { store });

    // Verify the component renders correctly with the title
    expect(screen.getByTestId('exam-instructions-title')).toHaveTextContent(
      'Proctoring onboarding exam',
    );

    // Verify neither email contact paragraph is rendered
    expect(screen.queryByTestId('learner-notification-email-contact')).not.toBeInTheDocument();
    expect(screen.queryByTestId('integration-email-contact')).not.toBeInTheDocument();
  });

  /**
   * Test case for the "Continue to onboarding" button functionality
   * This tests that clicking the button dispatches the createProctoredExamAttempt action
   */
  it('dispatches createProctoredExamAttempt action when button is clicked', () => {
    // Set up the store
    store.getState = () => ({
      specialExams: Factory.build('specialExams'),
    });

    render(<EntranceOnboardingExamInstructions />, { store });

    // Find and click the start exam button
    const startButton = screen.getByTestId('start-exam-button');
    expect(startButton).toBeInTheDocument();
    expect(startButton).toHaveTextContent('Continue to onboarding');
    fireEvent.click(startButton);

    // Verify that createProctoredExamAttempt was called
    expect(dataModule.createProctoredExamAttempt).toHaveBeenCalledTimes(1);
  });
});
