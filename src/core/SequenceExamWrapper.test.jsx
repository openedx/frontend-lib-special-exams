import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import SequenceExamWrapper from './SequenceExamWrapper';
import { initializeTestStore, render } from '../setupTest';

describe('SequenceExamWrapper', () => {
  const sequence = {
    id: 'block-v1:test+test+test+type@sequential+block@5b1bb1aaf6d34e79b213aa37422b4743',
    isTimeLimited: true,
  };
  const courseId = 'course-v1:test+test+test';
  let store;

  beforeEach(() => {
    store = initializeTestStore({
      specialExams: Factory.build('specialExams', {
        isLoading: false,
      }),
    });
  });

  it('renders without crashing', () => {
    // This is a minimal smoke test just for coverage purposes
    const { container } = render(
      <SequenceExamWrapper sequence={sequence} courseId={courseId}>
        <div>Test Content</div>
      </SequenceExamWrapper>,
      { store },
    );

    // Just verify that the component renders without throwing an error
    expect(container).toBeInTheDocument();
  });
});
