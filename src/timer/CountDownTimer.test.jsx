import React from 'react';
import { waitFor } from '@testing-library/dom';
import { ExamTimerBlock } from './index';
import {
  render, screen, initializeTestStore, fireEvent,
} from '../setupTest';
import examStore from '../data/store';

jest.mock('../data/store', () => ({
  examStore: {},
}));

describe('ExamTimerBlock', () => {
  let attempt;
  let store;
  const stopExamAttempt = () => {};
  const expireExamAttempt = () => {};
  const pollAttempt = () => {};

  beforeEach(async () => {
    const preloadedState = {
      examState: {
        isLoading: true,
        timeIsOver: false,
        activeAttempt: {
          attempt_status: 'started',
          exam_url_path: 'exam_url_path',
          exam_display_name: 'exam name',
          time_remaining_seconds: 10,
          low_threshold_sec: 15,
          critically_low_threshold_sec: 5,
          exam_started_poll_url: '',
          taking_as_proctored: false,
          exam_type: 'a timed exam',
        },
        proctoringSettings: {},
        exam: {},
      },
    };
    store = await initializeTestStore(preloadedState);
    examStore.getState = store.getState;
    attempt = store.getState().examState.activeAttempt;
  });

  it('renders items correctly', async () => {
    render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(attempt.exam_display_name)).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toEqual(2);
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End My Exam' })).toBeInTheDocument();
  });

  it('renders without activeAttempt return null', async () => {
    const preloadedState = {
      examState: {
        isLoading: true,
        timeIsOver: false,
        activeAttempt: null,
        proctoringSettings: {},
        exam: {},
      },
    };
    const testStore = await initializeTestStore(preloadedState);
    attempt = testStore.getState().examState.activeAttempt;
    const { container } = render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
      />,
    );
    expect(container.firstChild).not.toBeInTheDocument();
  });

  it('changes behavior when clock time decreases low threshold', async () => {
    render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
      />,
    );
    await waitFor(() => expect(screen.getByText('00:00:09')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveClass('alert-warning');
  });

  it('changes behavior when clock time decreases critically low threshold', async () => {
    const preloadedState = {
      examState: {
        isLoading: true,
        timeIsOver: false,
        activeAttempt: {
          attempt_status: 'started',
          exam_url_path: 'exam_url_path',
          exam_display_name: 'exam name',
          time_remaining_seconds: 5,
          low_threshold_sec: 15,
          critically_low_threshold_sec: 5,
          exam_started_poll_url: '',
          taking_as_proctored: false,
          exam_type: 'a timed exam',
        },
        proctoringSettings: {},
        exam: {},
      },
    };
    const testStore = await initializeTestStore(preloadedState);
    examStore.getState = store.testStore;
    attempt = testStore.getState().examState.activeAttempt;
    render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
      />,
    );
    await waitFor(() => expect(screen.getByText('00:00:04')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveClass('alert-danger');
  });

  it('toggles timer visibility correctly', async () => {
    render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
      />,
    );
    await waitFor(() => expect(screen.getByText('00:00:09')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Hide Timer')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('hide-timer'));
    expect(screen.getByLabelText('Show Timer')).toBeInTheDocument();
    expect(screen.queryByText(/00:00:0/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('show-timer'));
    expect(screen.getByLabelText('Hide Timer')).toBeInTheDocument();
    expect(screen.queryByText(/00:00:0/)).toBeInTheDocument();
  });

  it('toggles long text visibility on show more/less', async () => {
    render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
      />,
    );
    await waitFor(() => expect(screen.getByText('00:00:09')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.queryByText(/The timer on the right shows the time remaining in the exam./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.queryByText(/The timer on the right shows the time remaining in the exam./)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
  });
});
