import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent } from '@testing-library/dom';
import { resetExam } from '../../data';
import {
  render, screen, initializeMockApp, initializeTestStore,
} from '../../setupTest';
import ErrorOnboardingExamInstructions from './ErrorOnboardingExamInstructions';

jest.mock('../../data', () => ({
  resetExam: jest.fn(),
}));

resetExam.mockReturnValue(jest.fn());

describe('ErrorOnboardingExamInstructions', () => {
  let store;

  beforeEach(() => {
    initializeMockApp();
    store = initializeTestStore();
    store.subscribe = jest.fn();
    store.dispatch = jest.fn();
    jest.clearAllMocks();
  });

  it('renders the error message correctly', () => {
    render(<ErrorOnboardingExamInstructions />, { store });

    expect(screen.getByText('Error: There was a problem with your onboarding session')).toBeInTheDocument();
    expect(screen.getByText(/Your proctoring session ended before you completed this onboarding exam/)).toBeInTheDocument();
    expect(screen.getByText('Retry my exam')).toBeInTheDocument();
  });

  it('dispatches resetExam action when retry button is clicked', () => {
    render(<ErrorOnboardingExamInstructions />, { store });

    const retryButton = screen.getByTestId('retry-exam-button');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);

    expect(resetExam).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledTimes(1);
  });
});
