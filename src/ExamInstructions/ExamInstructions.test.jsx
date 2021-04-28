import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import { ExamInstructions } from './ExamInstructions';

test('ExamInstructions renders successfully', () => {
  const defaultProps = {
    examDuration: 30,
    startExam: () => {},
  };
  const { getByTestId } = render(<ExamInstructions {...defaultProps} />);
  expect(getByTestId('exam-instructions-title')).toHaveTextContent('Subsection is a Timed Exam (30 minutes)');
});
