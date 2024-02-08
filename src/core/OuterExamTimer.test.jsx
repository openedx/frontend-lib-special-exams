import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import OuterExamTimer from './OuterExamTimer';
import { getLatestAttemptData } from '../data';
import { initializeTestStore, render } from '../setupTest';
import { ExamStatus } from '../constants';

jest.mock('../data', () => ({
  getLatestAttemptData: jest.fn(),
  Emitter: {
    on: () => jest.fn(),
    once: () => jest.fn(),
    off: () => jest.fn(),
    emit: () => jest.fn(),
  },
}));
getLatestAttemptData.mockReturnValue(jest.fn());

describe('OuterExamTimer', () => {
  const courseId = 'course-v1:test+test+test';

  let store;

  beforeEach(() => {
    store = initializeTestStore();
  });

  it('is successfully rendered and shows timer if there is an exam in progress', () => {
    const attempt = Factory.build('attempt', {
      attempt_status: ExamStatus.STARTED,
    });
    store.getState = () => ({
      specialExams: {
        activeAttempt: attempt,
        exam: {
          time_limit_mins: 60,
        },
      },
    });

    const { queryByTestId } = render(
      <OuterExamTimer courseId={courseId} />,
      { store },
    );
    expect(queryByTestId('exam-timer')).toBeInTheDocument();
  });

  it('does not render timer if there is no exam in progress', () => {
    store.getState = () => ({
      specialExams: {
        activeAttempt: {},
        exam: {},
      },
    });

    const { queryByTestId } = render(
      <OuterExamTimer courseId={courseId} />,
      { store },
    );
    expect(queryByTestId('exam-timer')).not.toBeInTheDocument();
  });
});
