import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import VerifiedOnboardingExamInstructions from './VerifiedOnboardingExamInstructions';
import {
  render, screen, initializeMockApp, initializeTestStore,
} from '../../setupTest';

describe('VerifiedOnboardingExamInstructions', () => {
  let store;

  beforeEach(() => {
    initializeMockApp();
    store = initializeTestStore();
  });

  /**
   * Test case for when proctoringSettings is defined with integration_specific_email
   * This tests the first branch of the conditional: proctoringSettings is defined
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

    render(<VerifiedOnboardingExamInstructions />, { store });

    // Verify the component renders correctly
    expect(screen.getByTestId('exam-instructions-title')).toHaveTextContent(
      'Your onboarding profile was reviewed successfully',
    );

    // Verify the email link is rendered with the correct email
    const emailLink = screen.getByRole('link', { name: 'test@example.com' });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:test@example.com');
  });

  /**
   * Test case for when proctoringSettings is null
   * This tests the second branch of the conditional: proctoringSettings is null/undefined
   */
  it('renders correctly when proctoringSettings is null', () => {
    // Set up the store with proctoringSettings as null
    store.getState = () => ({
      specialExams: Factory.build('specialExams', {
        proctoringSettings: null,
      }),
    });

    render(<VerifiedOnboardingExamInstructions />, { store });

    // Verify the component renders correctly
    expect(screen.getByTestId('exam-instructions-title')).toHaveTextContent(
      'Your onboarding profile was reviewed successfully',
    );

    // Verify the component renders correctly
    expect(screen.getByTestId('exam-instructions-title')).toBeInTheDocument();

    // The MailtoLink component should still be rendered, but with an empty href
    const mailtoLink = screen.getByRole('link');
    expect(mailtoLink).toBeInTheDocument();
    expect(mailtoLink).toHaveAttribute('href', 'mailto:');
  });

  /**
   * Test case for when proctoringSettings is defined but integration_specific_email is empty
   * This is an additional test to ensure the component handles empty email values correctly
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

    render(<VerifiedOnboardingExamInstructions />, { store });

    // Verify the component renders correctly
    expect(screen.getByTestId('exam-instructions-title')).toHaveTextContent(
      'Your onboarding profile was reviewed successfully',
    );

    // Verify the component renders correctly
    expect(screen.getByTestId('exam-instructions-title')).toBeInTheDocument();

    // The MailtoLink component should still be rendered, but with an empty href
    const mailtoLink = screen.getByRole('link');
    expect(mailtoLink).toBeInTheDocument();
    expect(mailtoLink).toHaveAttribute('href', 'mailto:');
  });
});
