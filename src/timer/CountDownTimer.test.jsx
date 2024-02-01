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
  const stopExamAttempt = jest.fn();
  const expireExamAttempt = () => { };
  const pollAttempt = () => { };
  const submitAttempt = jest.fn();
  submitAttempt.mockReturnValue(jest.fn());
  stopExamAttempt.mockReturnValue(jest.fn());

  beforeEach(async () => {
    const preloadedState = {
      specialExams: {
        isLoading: true,
        timeIsOver: false,
        activeAttempt: {
          attempt_status: 'started',
          exam_url_path: 'exam_url_path',
          exam_display_name: 'exam name',
          time_remaining_seconds: 24,
          exam_started_poll_url: '',
          taking_as_proctored: false,
          exam_type: 'a timed exam',
        },
        proctoringSettings: {},
        exam: {
          time_limit_mins: 2,
        },
      },
    };
    store = await initializeTestStore(preloadedState);
    examStore.getState = store.getState;
    attempt = store.getState().specialExams.activeAttempt;
  });

  it('renders items correctly', async () => {
    render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
        submitExam={submitAttempt}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(attempt.exam_display_name)).toBeInTheDocument();
    expect(screen.getByText('Show more')).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toEqual(1);
    expect(screen.getByRole('button', { name: 'End My Exam' })).toBeInTheDocument();
  });

  it('renders without activeAttempt return null', async () => {
    const preloadedState = {
      specialExams: {
        isLoading: true,
        timeIsOver: false,
        activeAttempt: null,
        proctoringSettings: {},
        exam: {},
      },
    };
    const testStore = await initializeTestStore(preloadedState);
    attempt = testStore.getState().specialExams.activeAttempt;
    const { container } = render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
        submitExam={submitAttempt}
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
        submitExam={submitAttempt}
      />,
    );
    await waitFor(() => expect(screen.getByText('00:00:23')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveClass('alert-warning');
  });

  it('changes behavior when clock time decreases critically low threshold', async () => {
    const preloadedState = {
      specialExams: {
        isLoading: true,
        timeIsOver: false,
        activeAttempt: {
          attempt_status: 'started',
          exam_url_path: 'exam_url_path',
          exam_display_name: 'exam name',
          time_remaining_seconds: 6,
          exam_started_poll_url: '',
          taking_as_proctored: false,
          exam_type: 'a timed exam',
        },
        proctoringSettings: {},
        exam: {
          time_limit_mins: 2,
        },
      },
    };
    const testStore = await initializeTestStore(preloadedState);
    examStore.getState = store.testStore;
    attempt = testStore.getState().specialExams.activeAttempt;
    render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
        submitExam={submitAttempt}
      />,
    );
    await waitFor(() => expect(screen.getByText('00:00:05')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveClass('alert-danger');
  });

  it('toggles timer visibility correctly', async () => {
    render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
        submitExam={submitAttempt}
      />,
    );
    await waitFor(() => expect(screen.getByText('00:00:23')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Hide Timer')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('hide-timer'));
    expect(screen.getByLabelText('Show Timer')).toBeInTheDocument();
    expect(screen.queryByText(/00:00:2/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('show-timer'));
    expect(screen.getByLabelText('Hide Timer')).toBeInTheDocument();
    expect(screen.queryByText(/00:00:2/)).toBeInTheDocument();
  });

  it('toggles long text visibility on show more/less', async () => {
    render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
        submitExam={submitAttempt}
      />,
    );
    await waitFor(() => expect(screen.getByText('00:00:23')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Show more'));
    expect(screen.queryByText(/The timer on the right shows the time remaining in the exam./)).toBeInTheDocument();
    expect(screen.getByText('Show less')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Show less'));
    expect(screen.queryByText(/The timer on the right shows the time remaining in the exam./)).not.toBeInTheDocument();
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });

  it('submits exam if time reached 00:00 and user clicks end my exam button', async () => {
    const preloadedState = {
      specialExams: {
        isLoading: true,
        timeIsOver: false,
        activeAttempt: {
          attempt_status: 'started',
          exam_url_path: 'exam_url_path',
          exam_display_name: 'exam name',
          time_remaining_seconds: 1,
          exam_started_poll_url: '',
          taking_as_proctored: false,
          exam_type: 'a timed exam',
        },
        proctoringSettings: {},
        exam: {
          time_limit_mins: 30,
        },
      },
    };
    const testStore = await initializeTestStore(preloadedState);
    examStore.getState = store.testStore;
    attempt = testStore.getState().specialExams.activeAttempt;

    render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
        submitExam={submitAttempt}
      />,
    );
    await waitFor(() => expect(screen.getByText('00:00:00')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('end-button', { name: 'Show more' }));
    expect(submitAttempt).toHaveBeenCalledTimes(1);
  });

  it('stops exam if time has not reached 00:00 and user clicks end my exam button', async () => {
    render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
        submitExam={submitAttempt}
      />,
    );
    await waitFor(() => expect(screen.getByText('00:00:23')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('end-button'));
    expect(stopExamAttempt).toHaveBeenCalledTimes(1);
  });

  it('Update exam timer when attempt time_remaining_seconds is smaller than displayed time', async () => {
    const preloadedState = {
      specialExams: {
        isLoading: true,
        timeIsOver: false,
        activeAttempt: {
          attempt_status: 'started',
          exam_url_path: 'exam_url_path',
          exam_display_name: 'exam name',
          time_remaining_seconds: 240,
          exam_started_poll_url: '',
          taking_as_proctored: false,
          exam_type: 'a timed exam',
        },
        proctoringSettings: {},
        exam: {
          time_limit_mins: 30,
        },
      },
    };
    let testStore = await initializeTestStore(preloadedState);
    examStore.getState = store.testStore;
    attempt = testStore.getState().specialExams.activeAttempt;
    const { rerender } = render(
      <ExamTimerBlock
        attempt={attempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
        submitExam={submitAttempt}
      />,
    );
    await waitFor(() => expect(screen.getByText('00:03:59')).toBeInTheDocument());

    preloadedState.specialExams.activeAttempt = {
      ...attempt,
      time_remaining_seconds: 20,
    };
    testStore = await initializeTestStore(preloadedState);
    examStore.getState = store.testStore;
    const updatedAttempt = testStore.getState().specialExams.activeAttempt;

    expect(updatedAttempt.time_remaining_seconds).toBe(20);

    rerender(
      <ExamTimerBlock
        attempt={updatedAttempt}
        stopExamAttempt={stopExamAttempt}
        expireExamAttempt={expireExamAttempt}
        pollExamAttempt={pollAttempt}
        submitExam={submitAttempt}
      />,
    );

    await waitFor(() => expect(screen.getByText('00:00:19')).toBeInTheDocument());
  });

  const timesToTest = {
    // Because times are rounded down, these values are 60 seconds off
    '2 hours and 30 minutes': 9000,
    '1 hour and 30 minutes': 5400,
    '2 hours and 2 minutes': 7320,
    '1 hour and 2 minutes': 3720,
    '2 hours and 1 minute': 7260,
    '1 hour and 1 minute': 3660,
    '1 hour and 0 minutes': 3600,
    '30 minutes': 1800,
  };
  Object.keys(timesToTest).forEach((timeString) => {
    it(`Accessibility time string ${timeString} appears as expected based seconds remaining: ${timesToTest[timeString]}`, async () => {
      // create a state with the respective number of seconds
      const preloadedState = {
        specialExams: {
          isLoading: true,
          timeIsOver: false,
          activeAttempt: {
            attempt_status: 'started',
            exam_url_path: 'exam_url_path',
            exam_display_name: 'exam name',
            time_remaining_seconds: timesToTest[timeString],
            exam_started_poll_url: '',
            taking_as_proctored: false,
            exam_type: 'a timed exam',
          },
          proctoringSettings: {},
          exam: {
            time_limit_mins: 30,
          },
        },
      };

      // Store it in the state
      const testStore = await initializeTestStore(preloadedState);
      examStore.getState = store.testStore;
      attempt = testStore.getState().specialExams.activeAttempt;

      // render an exam timer block with that data
      render(
        <ExamTimerBlock
          attempt={attempt}
          stopExamAttempt={stopExamAttempt}
          expireExamAttempt={expireExamAttempt}
          pollExamAttempt={pollAttempt}
          submitExam={submitAttempt}
        />,
      );

      // expect the a11y string to be a certain output
      await waitFor(() => expect(screen.getByText(`you have ${timeString} remaining`)).toBeInTheDocument());
    });
  });
});
