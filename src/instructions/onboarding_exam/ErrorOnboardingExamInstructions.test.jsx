import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent } from '@testing-library/dom';
import {
  render, screen, initializeMockApp,
} from '../../setupTest';
import ErrorOnboardingExamInstructions from './ErrorOnboardingExamInstructions';

const mockResetExam = jest.fn();
jest.mock('../../data', () => ({
  ...jest.requireActual('../../data'),
  useResetExam: () => ({ mutate: mockResetExam }),
}));

describe('ErrorOnboardingExamInstructions', () => {
  beforeEach(() => {
    initializeMockApp();
    jest.clearAllMocks();
  });

  it('renders the error message correctly', () => {
    render(<ErrorOnboardingExamInstructions />);

    expect(screen.getByText('Error: There was a problem with your onboarding session')).toBeInTheDocument();
    expect(screen.getByText(/Your proctoring session ended before you completed this onboarding exam/)).toBeInTheDocument();
    expect(screen.getByText('Retry my exam')).toBeInTheDocument();
  });

  it('dispatches resetExam action when retry button is clicked', () => {
    render(<ErrorOnboardingExamInstructions />);

    const retryButton = screen.getByTestId('retry-exam-button');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);

    expect(mockResetExam).toHaveBeenCalledTimes(1);
  });
});
