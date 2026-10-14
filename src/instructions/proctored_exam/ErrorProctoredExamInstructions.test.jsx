import '@testing-library/jest-dom';
import React from 'react';
import ErrorProctoredExamInstructions from './ErrorProctoredExamInstructions';
import {
  initializeMockApp,
  render,
  screen,
} from '../../setupTest';

describe('ErrorProctoredExamInstructions', () => {
  // Mock configuration values
  const mockSiteName = 'Test Platform';
  const mockContactUrl = 'https://example.com/contact';
  const services = { config: { siteName: mockSiteName, contactUrl: mockContactUrl } };

  beforeEach(() => {
    initializeMockApp();
    jest.clearAllMocks();
  });

  /**
   * Test case for rendering when proctoringEscalationEmail exists
   * This tests the first branch of the conditional rendering in renderBody()
   */
  it('renders correctly with proctoringEscalationEmail', () => {
    // Set up the store state with proctoringEscalationEmail
    const testEmail = 'support@example.com';
    const specialExams = {
      proctoringSettings: {
        proctoring_escalation_email: testEmail,
      },
    };

    render(<ErrorProctoredExamInstructions />, { specialExams, services });

    // Verify the title is rendered correctly
    expect(screen.getByText('Error with proctored exam')).toBeInTheDocument();

    // Verify the email link is rendered with the correct email
    const emailLink = screen.getByText(testEmail);
    expect(emailLink).toBeInTheDocument();
    expect(emailLink.tagName).toBe('A'); // Check that it's a link
    expect(emailLink).toHaveAttribute('href', `mailto:${testEmail}`);

    // Verify the text content includes the expected message
    const textContent = screen.getByText(/A system error has occurred with your proctored exam/);
    expect(textContent).toBeInTheDocument();
    expect(textContent).toHaveTextContent('Please reach out to your course team');
  });

  /**
   * Test case for rendering when proctoringEscalationEmail does not exist
   * This tests the second branch of the conditional rendering in renderBody()
   */
  it('renders correctly without proctoringEscalationEmail', () => {
    // Set up the store state without proctoringEscalationEmail
    const specialExams = {
      proctoringSettings: {
        // No proctoring_escalation_email
      },
    };

    render(<ErrorProctoredExamInstructions />, { specialExams, services });

    // Verify the title is rendered correctly
    expect(screen.getByText('Error with proctored exam')).toBeInTheDocument();

    // Verify the support link is rendered with the correct URL and text
    const supportLink = screen.getByText(`${mockSiteName} Support`);
    expect(supportLink).toBeInTheDocument();
    expect(supportLink.tagName).toBe('A'); // Check that it's a link
    expect(supportLink).toHaveAttribute('href', mockContactUrl);
    expect(supportLink).toHaveAttribute('target', '_blank');

    // Verify the text content includes the expected message
    const textContent = screen.getByText(/A system error has occurred with your proctored exam/);
    expect(textContent).toBeInTheDocument();
    expect(textContent).toHaveTextContent('Please reach out to');
  });

  /**
   * Test case for when specialExams or proctoringSettings is undefined
   * This tests the fallback for when the state structure is not as expected
   */
  it('handles undefined specialExams or proctoringSettings', () => {
    // Set up the store state with undefined specialExams
    render(<ErrorProctoredExamInstructions />, { services });

    // Verify the title is rendered correctly
    expect(screen.getByText('Error with proctored exam')).toBeInTheDocument();

    // Verify the support link is rendered with the correct URL and text
    const supportLink = screen.getByText(`${mockSiteName} Support`);
    expect(supportLink).toBeInTheDocument();
    expect(supportLink.tagName).toBe('A'); // Check that it's a link
    expect(supportLink).toHaveAttribute('href', mockContactUrl);

    // Verify the text content includes the expected message
    const textContent = screen.getByText(/A system error has occurred with your proctored exam/);
    expect(textContent).toBeInTheDocument();
  });

  /**
   * Test case for when proctoringSettings is null
   * This tests the fallback for when proctoringSettings is null
   */
  it('handles null proctoringSettings', () => {
    // Set up the store state with null proctoringSettings
    const specialExams = {
      proctoringSettings: null,
    };

    render(<ErrorProctoredExamInstructions />, { specialExams, services });

    // Verify the title is rendered correctly
    expect(screen.getByText('Error with proctored exam')).toBeInTheDocument();

    // Verify the support link is rendered with the correct URL and text
    const supportLink = screen.getByText(`${mockSiteName} Support`);
    expect(supportLink).toBeInTheDocument();
    expect(supportLink.tagName).toBe('A'); // Check that it's a link
    expect(supportLink).toHaveAttribute('href', mockContactUrl);

    // Verify the text content includes the expected message
    const textContent = screen.getByText(/A system error has occurred with your proctored exam/);
    expect(textContent).toBeInTheDocument();
  });
});
