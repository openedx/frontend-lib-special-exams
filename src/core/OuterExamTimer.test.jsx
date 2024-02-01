import '@testing-library/jest-dom';
import { Factory } from 'rosie';
import React from 'react';
import OuterExamTimer from './OuterExamTimer';
import { store, getLatestAttemptData } from '../data';
import { render } from '../setupTest';
import { ExamStatus } from '../constants';

jest.mock('../data', () => ({
  store: {},
  getLatestAttemptData: jest.fn(),
  Emitter: {
    on: () => jest.fn(),
    once: () => jest.fn(),
    off: () => jest.fn(),
    emit: () => jest.fn(),
  },
}));
getLatestAttemptData.mockReturnValue(jest.fn());
store.subscribe = jest.fn();
store.dispatch = jest.fn();

describe('OuterExamTimer', () => {
  const courseId = 'course-v1:test+test+test';

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
