import '@testing-library/jest-dom';
import React from 'react';
import { getConfig } from '@edx/frontend-platform';
import Footer from './Footer';
import {
  initializeMockApp,
  initializeTestStore,
  render,
  screen,
} from '../../setupTest';

// Mock the getConfig function
jest.mock('@edx/frontend-platform', () => ({
  getConfig: jest.fn(),
}));

describe('Footer', () => {
  let store;

  // Mock FAQ URL for testing
  const mockFaqUrl = 'https://example.com/faq';

  beforeEach(() => {
    initializeMockApp();
    jest.clearAllMocks();
    store = initializeTestStore();
  });

  /**
   * Test case for when PROCTORED_EXAM_FAQ_URL exists in the config
   * This tests the branch where faqUrl is truthy and the button is rendered
   */
  it('renders the FAQ button when PROCTORED_EXAM_FAQ_URL exists', () => {
    // Set up the mock configuration with a FAQ URL
    getConfig.mockReturnValue({
      PROCTORED_EXAM_FAQ_URL: mockFaqUrl,
    });

    render(<Footer />, { store });

    // Verify the button is rendered with the correct attributes
    const button = screen.getByTestId('request-exam-time-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', mockFaqUrl);
    expect(button).toHaveAttribute('target', '_blank');

    // Verify the button text is correct
    expect(screen.getByText('About Proctored Exams')).toBeInTheDocument();
  });

  /**
   * Test case for when PROCTORED_EXAM_FAQ_URL does not exist in the config
   * This tests the branch where faqUrl is falsy and the button is not rendered
   */
  it('does not render the FAQ button when PROCTORED_EXAM_FAQ_URL does not exist', () => {
    // Set up the mock configuration without a FAQ URL
    getConfig.mockReturnValue({
      // No PROCTORED_EXAM_FAQ_URL
    });

    render(<Footer />, { store });

    // Verify the button is not rendered
    expect(screen.queryByTestId('request-exam-time-button')).not.toBeInTheDocument();
    expect(screen.queryByText('About Proctored Exams')).not.toBeInTheDocument();
  });

  /**
   * Test case for when PROCTORED_EXAM_FAQ_URL is null
   * This tests another falsy condition for faqUrl
   */
  it('does not render the FAQ button when PROCTORED_EXAM_FAQ_URL is null', () => {
    // Set up the mock configuration with a null FAQ URL
    getConfig.mockReturnValue({
      PROCTORED_EXAM_FAQ_URL: null,
    });

    render(<Footer />, { store });

    // Verify the button is not rendered
    expect(screen.queryByTestId('request-exam-time-button')).not.toBeInTheDocument();
    expect(screen.queryByText('About Proctored Exams')).not.toBeInTheDocument();
  });

  /**
   * Test case for when PROCTORED_EXAM_FAQ_URL is an empty string
   * This tests another falsy condition for faqUrl
   */
  it('does not render the FAQ button when PROCTORED_EXAM_FAQ_URL is an empty string', () => {
    // Set up the mock configuration with an empty string FAQ URL
    getConfig.mockReturnValue({
      PROCTORED_EXAM_FAQ_URL: '',
    });

    render(<Footer />, { store });

    // Verify the button is not rendered
    expect(screen.queryByTestId('request-exam-time-button')).not.toBeInTheDocument();
    expect(screen.queryByText('About Proctored Exams')).not.toBeInTheDocument();
  });
});
