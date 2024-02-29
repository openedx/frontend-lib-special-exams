import { useContext } from 'react';
import { appendTimerEnd } from '../helpers';
import TimerProvider, { TimerContext } from './TimerProvider';
import {
  render, screen, initializeTestStore, act, waitFor,
} from '../setupTest';
import { Emitter, pollAttempt, pingAttempt } from '../data';
import {
  TIMER_IS_CRITICALLY_LOW,
  TIMER_IS_LOW,
  TIMER_LIMIT_REACHED,
  TIMER_REACHED_NULL,
} from './events';

jest.mock('../data', () => ({
  Emitter: { emit: jest.fn() },
  pollAttempt: jest.fn(),
  pingAttempt: jest.fn(),
}));

const mockedDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn().mockImplementation(() => mockedDispatch),
}));

const TestingComponent = () => {
  const { timeState, getTimeString } = useContext(TimerContext);
  const timeString = getTimeString();
  const timeStateString = JSON.stringify(timeState);
  return (timeString ? (
    <>
      <div data-testid="time-string">{timeString}</div>
      <pre data-testid="time-state">{timeStateString}</pre>
    </>
  ) : null);
};

const TestComponent = () => (
  <TimerProvider>
    <TestingComponent />
  </TimerProvider>
);

const renderComponent = ({ remainingSeconds, timeLimitMins = 2, pingIntervalSeconds = undefined }) => {
  const store = initializeTestStore({
    specialExams: {
      activeAttempt: appendTimerEnd({
        time_remaining_seconds: remainingSeconds,
        exam_started_poll_url: 'https://some-poll.endpoint',
        desktop_application_js_url: 'https://desktop-application.js?url=42',
        ping_interval: pingIntervalSeconds,
      }),
      exam: {
        time_limit_mins: timeLimitMins,
      },
    },
  });

  const { unmount } = render(<TestComponent />, { store });
  return unmount;
};

const testRefDate = (new Date('2024-01-01 01:00:00')).getTime();

describe('TimerProvider', () => {
  let now = testRefDate;

  // This syncs up the reference date returned by Date.now() and the jest timers.
  const awaitSeconds = async (seconds = 1) => {
    now += 1000 * seconds;
    jest.advanceTimersToNextTimer(seconds); // Proc any remaining call.
  };

  beforeAll(() => jest.useFakeTimers('modern'));

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterAll(() => jest.useRealTimers());

  describe('when the remaining time is plenty', () => {
    it('should render normally', async () => {
      const unmount = renderComponent({ remainingSeconds: 60 });
      await act(async () => {
        // Since the first update is delayed untill the children are rendered, we need to
        // wait on it to validate the update.
        await waitFor(() => expect(screen.getByTestId('time-string')).toBeInTheDocument());
      });
      expect(screen.getByTestId('time-string')).toHaveTextContent('00:01:00');
      expect(screen.getByTestId('time-state')).toHaveTextContent(JSON.stringify({
        hours: 0,
        minutes: 1,
        seconds: 0,
      }));

      await act(async () => {
        awaitSeconds(1);
        await waitFor(() => expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:59'));
      });

      expect(screen.getByTestId('time-state')).toHaveTextContent(JSON.stringify({
        hours: 0,
        minutes: 0,
        seconds: 59,
      }));

      expect(Emitter.emit).not.toHaveBeenCalled();

      // No Poll calls in between.
      expect(pollAttempt).toHaveBeenCalledTimes(1);

      // No Ping attempts.
      expect(pingAttempt).not.toHaveBeenCalled();

      unmount(); // Cleanup.
    });
  });

  describe('when the remaining falls under the warning times', () => {
    it('should emit TIMER_IS_LOW when the timer falls under the threshold (40%)', async () => {
      const unmount = renderComponent({ remainingSeconds: 25 });

      await act(async () => {
        await waitFor(() => expect(screen.getByTestId('time-string')).toBeInTheDocument());
      });
      expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:25');

      expect(Emitter.emit).not.toHaveBeenCalled();
      expect(pingAttempt).not.toHaveBeenCalled();

      // The next second should trigger the warning.
      await act(async () => {
        awaitSeconds(1);
        await waitFor(() => expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:24'));
      });

      expect(Emitter.emit).toHaveBeenCalledTimes(1);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_IS_LOW);

      unmount(); // Cleanup.
    });

    it('should emit TIMER_IS_LOW when the timer falls under the threshold (10%)', async () => {
      const unmount = renderComponent({ remainingSeconds: 7 });

      await act(async () => {
        await waitFor(() => expect(screen.getByTestId('time-string')).toBeInTheDocument());
      });
      expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:07');

      // Low timer warning is called first render.
      expect(Emitter.emit).toHaveBeenCalledTimes(1);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_IS_LOW);

      // The next second should trigger the critical warning.
      await act(async () => {
        awaitSeconds(1);
        await waitFor(() => expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:06'));
      });

      expect(Emitter.emit).toHaveBeenCalledTimes(2);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_IS_CRITICALLY_LOW);

      unmount(); // Cleanup.
    });

    it('should emit TIMER_REACHED_NULL when the timer falls under the threshold (10%)', async () => {
      const unmount = renderComponent({ remainingSeconds: 1 });

      await act(async () => {
        await waitFor(() => expect(screen.getByTestId('time-string')).toBeInTheDocument());
      });
      expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:01');

      // Critical timer warning is called first render.
      expect(Emitter.emit).toHaveBeenCalledTimes(1);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_IS_CRITICALLY_LOW);

      // The next second should trigger the critical warning.
      await act(async () => {
        awaitSeconds(1);
        await waitFor(() => expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:00'));
      });

      expect(Emitter.emit).toHaveBeenCalledTimes(2);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_REACHED_NULL);

      unmount(); // Cleanup.
    });

    it('should emit TIMER_LIMIT_REACHED when the timer falls under the grace period (5 secs)', async () => {
      const unmount = renderComponent({ remainingSeconds: -4 });

      await act(async () => {
        await waitFor(() => expect(screen.getByTestId('time-string')).toBeInTheDocument());
      });
      expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:00');

      // Timer is null is called first render.
      expect(Emitter.emit).toHaveBeenCalledTimes(1);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_REACHED_NULL);

      // The next second should kill the exam.
      await act(async () => {
        awaitSeconds(1);
        await waitFor(() => expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:00'));
      });

      expect(Emitter.emit).toHaveBeenCalledTimes(2);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_LIMIT_REACHED);

      // Lets just wait a couple more seconds and check that the timer was killed as well.
      await act(async () => {
        awaitSeconds(3);
        await waitFor(() => expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:00'));
      });

      // Emitter should be exactly as before.
      expect(Emitter.emit).toHaveBeenCalledTimes(2);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_LIMIT_REACHED);

      unmount(); // Cleanup.
    });
  });

  describe('when the poll interval is reached (1 minute)', () => {
    it('should call poll attempt each time', async () => {
      const unmount = renderComponent({ remainingSeconds: 120 });

      await act(async () => {
        await waitFor(() => expect(screen.getByTestId('time-string')).toBeInTheDocument());
      });

      // A first poll attempt on render.
      expect(pollAttempt).toHaveBeenCalledTimes(1);

      await act(async () => awaitSeconds(60));

      // A 2nd poll attempt should fire.
      expect(pollAttempt).toHaveBeenCalledTimes(2);

      await act(async () => awaitSeconds(60));

      // A 3rd one, just in case.
      expect(pollAttempt).toHaveBeenCalledTimes(3);

      unmount(); // Cleanup.
    });
  });

  describe('when the ping interval is reached', () => {
    it('should ping first at half the time, then the full delay onwards', async () => {
      const unmount = renderComponent({ remainingSeconds: 120, timeLimitMins: 10, pingIntervalSeconds: 10 });

      await act(async () => {
        await waitFor(() => expect(screen.getByTestId('time-string')).toBeInTheDocument());
      });

      // No pings so far.
      expect(pingAttempt).not.toHaveBeenCalled();

      await act(async () => awaitSeconds(5));

      // A ping poll attempt should fire.
      expect(pingAttempt).toHaveBeenCalledTimes(1);

      // Then one ping after 10.
      await act(async () => awaitSeconds(10));

      // A ping poll attempt should fire.
      expect(pingAttempt).toHaveBeenCalledTimes(2);

      // Let's round it up on 6..
      await act(async () => awaitSeconds(40));

      // A ping poll attempt should fire.
      expect(pingAttempt).toHaveBeenCalledTimes(6);

      unmount(); // Cleanup.
    });
  });
});
