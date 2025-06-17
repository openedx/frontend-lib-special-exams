import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import { fireEvent } from '@testing-library/react';
import RejectedOnboardingExamInstructions from './RejectedOnboardingExamInstructions';
import {
  render, screen, initializeMockApp, initializeTestStore,
} from '../../setupTest';
import * as dataModule from '../../data';

// Mock the resetExam function to test if it's called
jest.mock('../../data', () => {
  const originalModule = jest.requireActual('../../data');
  return {
    ...originalModule,
    resetExam: jest.fn(() => ({ type: 'MOCK_RESET_EXAM' })),
  };
});

describe('RejectedOnboardingExamInstructions', () => {
  let store;

  beforeEach(() => {
    initializeMockApp();
    store = initializeTestStore();
    // Reset the mock before each test
    jest.clearAllMocks();
  });

  /**
   * Test case for when proctoringSettings is defined with integration_specific_email
   * This tests the component rendering with email contact information
   */
  it('renders correctly with integration email', () => {
    // Set up the store with proctoringSettings containing integration_specific_email
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        proctoringSettings: Factory.build('proctoringSettings', {
          integration_specific_email: 'test@example.com',
        }),
      }),
    });

    render(<RejectedOnboardingExamInstructions />, { store });

    // Verify the component renders correctly with the title
    expect(screen.getByTestId('rejected-onboarding-title')).toHaveTextContent(
      'Your onboarding session was reviewed, but did not pass all requirements',
    );

    // Verify the email link is rendered with the correct email
    const emailLink = screen.getByRole('link', { name: 'test@example.com' });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:test@example.com');

    // Verify the integration email contact paragraph is rendered
    expect(screen.getByTestId('integration-email-contact')).toBeInTheDocument();
  });

  /**
   * Test case for when proctoringSettings is null
   * This tests the component rendering without email contact information
   */
  it('renders correctly when proctoringSettings is null', () => {
    // Set up the store with proctoringSettings as null
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        proctoringSettings: null,
      }),
    });

    render(<RejectedOnboardingExamInstructions />, { store });

    // Verify the component renders correctly with the title
    expect(screen.getByTestId('rejected-onboarding-title')).toHaveTextContent(
      'Your onboarding session was reviewed, but did not pass all requirements',
    );

    // Verify the integration email contact paragraph is not rendered
    expect(screen.queryByTestId('integration-email-contact')).not.toBeInTheDocument();
  });

  /**
   * Test case for when proctoringSettings is defined but integration_specific_email is empty
   * This tests the component handling empty email values
   */
  it('renders correctly when integration_specific_email is empty', () => {
    // Set up the store with proctoringSettings containing an empty integration_specific_email
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        proctoringSettings: Factory.build('proctoringSettings', {
          integration_specific_email: '',
        }),
      }),
    });

    render(<RejectedOnboardingExamInstructions />, { store });

    // Verify the component renders correctly with the title
    expect(screen.getByTestId('rejected-onboarding-title')).toHaveTextContent(
      'Your onboarding session was reviewed, but did not pass all requirements',
    );

    // Verify the integration email contact paragraph is not rendered
    expect(screen.queryByTestId('integration-email-contact')).not.toBeInTheDocument();
  });

  /**
   * Test case for the "Retry my exam" button functionality
   * This tests that clicking the button dispatches the resetExam action
   */
  it('dispatches resetExam action when retry button is clicked', () => {
    // Set up the store
    store.getState = () => ({
      specialExams: Factory.build('specialExams'),
    });

    render(<RejectedOnboardingExamInstructions />, { store });

    // Find and click the retry button
    const retryButton = screen.getByTestId('reset-exam-button');
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);

    // Verify that resetExam was called
    expect(dataModule.resetExam).toHaveBeenCalledTimes(1);
  });
});
