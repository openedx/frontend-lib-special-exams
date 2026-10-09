import '@testing-library/jest-dom';
import React from 'react';
import SubmittedTimedExamInstructions from './SubmittedTimedExamInstructions';
import { render, screen } from '../../setupTest';

describe('SubmittedTimedExamInstructions', () => {
  beforeEach(() => {
  });

  it('tells the learner the exam was submitted', () => {
    render(<SubmittedTimedExamInstructions timeIsOver={false} />);
    expect(screen.getByText('You have submitted your timed exam.')).toBeInTheDocument();
  });

  it('tells the learner the time limit forced the submission', () => {
    render(<SubmittedTimedExamInstructions timeIsOver />);
    expect(screen.getByText(/The time allotted for this exam has expired/)).toBeInTheDocument();
  });
});
