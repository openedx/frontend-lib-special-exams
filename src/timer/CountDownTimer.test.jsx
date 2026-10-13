import React from 'react';
import MockAdapter from 'axios-mock-adapter';
import { waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { ExamTimerBlock } from './index';
import {
  render, screen, fireEvent, act,
  createTestQueryClient, httpClient,
} from '../setupTest';
import { Emitter } from '../data';
import { specialExamsQueryKeys } from '../data/queryKeys';
import { TIMER_LIMIT_REACHED } from './events';

const mockExpireExam = jest.fn();
const mockStopExam = jest.fn();
const mockSubmitExam = jest.fn();
// We do a partial mock to avoid mocking out other exported values (e.g. the store and the Emitter).
jest.mock('../data', () => {
  const originalModule = jest.requireActual('../data');

  return {
    __esModule: true,
    ...originalModule,
    useExpireExam: () => ({ mutate: mockExpireExam }),
    useStopExam: () => ({ mutate: mockStopExam }),
    useSubmitExam: () => ({ mutate: mockSubmitExam }),
  };
});

const axiosMock = new MockAdapter(httpClient);

describe('ExamTimerBlock', () => {
  afterEach(() => {
    axiosMock.reset();
  });

  let specialExams;
  let attempt;

  beforeEach(() => {
    jest.clearAllMocks();
    specialExams = {
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
    };
    attempt = specialExams.activeAttempt;
  });

  it('renders items correctly', async () => {
    render(
      <ExamTimerBlock />,
      { specialExams },
    );

    await act(async () => {
      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    });
    expect(screen.getByText(attempt.exam_display_name)).toBeInTheDocument();
    expect(screen.getByText('Show more')).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toEqual(1);
    expect(screen.getByRole('button', { name: 'End My Exam' })).toBeInTheDocument();
  });

  it('renders without activeAttempt return null', () => {
    specialExams = {
      isLoading: true,
      timeIsOver: false,
      activeAttempt: null,
      proctoringSettings: {},
      exam: {},
    };
    attempt = specialExams.activeAttempt;
    const { container } = render(
      <ExamTimerBlock />,
      { specialExams },
    );
    expect(container.firstChild).not.toBeInTheDocument();
  });

  it('changes behavior when clock time decreases low threshold', async () => {
    render(
      <ExamTimerBlock />,
      { specialExams },
    );

    await screen.findByText('00:00:23');
    expect(screen.getByRole('alert')).toHaveClass('alert-warning');
  });

  it('changes behavior when clock time decreases critically low threshold', async () => {
    specialExams = {
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
    };
    attempt = specialExams.activeAttempt;
    render(
      <ExamTimerBlock />,
      { specialExams },
    );

    await screen.findByText('00:00:05');
    expect(screen.getByRole('alert')).toHaveClass('alert-danger');
  });

  it('toggles timer visibility correctly', async () => {
    render(
      <ExamTimerBlock />,
      { specialExams },
    );
    await screen.findByText('00:00:23');

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Hide Timer')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('hide-timer'));
    expect(screen.getByLabelText('Show Timer')).toBeInTheDocument();
    expect(screen.queryByText(/00:00:2/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('show-timer'));
    expect(screen.getByLabelText('Hide Timer')).toBeInTheDocument();
    expect(screen.queryByText(/00:00:2/)).toBeInTheDocument();
  });

  it('toggles long text visibility on show more/less', async () => {
    render(
      <ExamTimerBlock />,
      { specialExams },
    );

    await screen.findByText('00:00:23');
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Show more'));
    expect(screen.queryByText(/The timer on the right shows the time remaining in the exam./)).toBeInTheDocument();
    expect(screen.getByText('Show less')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Show less'));
    expect(screen.queryByText(/The timer on the right shows the time remaining in the exam./)).not.toBeInTheDocument();
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });

  it('submits exam if time reached 00:00 and user clicks end my exam button', async () => {
    specialExams = {
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
    };
    attempt = specialExams.activeAttempt;

    render(
      <ExamTimerBlock />,
      { specialExams },
    );

    await screen.findByText('00:00:00');
    await userEvent.click(screen.getByTestId('end-button', { name: 'Show more' }));

    expect(mockSubmitExam).toHaveBeenCalledTimes(1);
  });

  it('stops exam if time has not reached 00:00 and user clicks end my exam button', async () => {
    render(
      <ExamTimerBlock />,
      { specialExams },
    );

    await screen.findByText('00:00:23');
    await userEvent.click(screen.getByTestId('end-button'));

    expect(mockStopExam).toHaveBeenCalledTimes(1);
  });

  it('expires the exam once when the limit is reached after a remount', async () => {
    const first = render(<ExamTimerBlock />, { specialExams });
    await screen.findByText('00:00:23');
    first.unmount();

    render(<ExamTimerBlock />, { specialExams });
    await screen.findByText('00:00:23');
    act(() => {
      Emitter.emit(TIMER_LIMIT_REACHED);
    });

    expect(mockExpireExam).toHaveBeenCalledTimes(1);
  });

  it('Update exam timer when attempt time_remaining_seconds is smaller than displayed time', async () => {
    specialExams = {
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
    };
    const queryClient = createTestQueryClient();
    render(<ExamTimerBlock />, { queryClient, specialExams });

    await screen.findByText('00:03:59');

    // The poll writes a shorter remaining time over the attempt.
    act(() => {
      queryClient.setQueryData(specialExamsQueryKeys.exam(undefined, undefined), (state) => ({
        ...state,
        activeAttempt: { ...state.activeAttempt, time_remaining_seconds: 20 },
      }));
    });

    await screen.findByText('00:00:19');
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
    it(`Accessibility time string ${timeString} appears as expected based seconds remaining: ${timesToTest[timeString]}`, () => {
      // create a state with the respective number of seconds
      specialExams = {
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
      };

      // Store it in the state
      attempt = specialExams.activeAttempt;

      // render an exam timer block with that data
      render(
        <ExamTimerBlock />,
        { specialExams },
      );

      // expect the a11y string to be a certain output
      expect(screen.getByText(`you have ${timeString} remaining`)).toBeInTheDocument();
    });
  });
});
