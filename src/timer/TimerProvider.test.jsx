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

const renderComponent = ({ remainingSeconds, timeLimitMins = 2 }) => {
  const store = initializeTestStore({
    specialExams: {
      activeAttempt: appendTimerEnd({
        time_remaining_seconds: remainingSeconds,
        exam_started_poll_url: 'https://some-poll.endpoint',
        desktop_application_js_url: 'https://desktop-application.js?url=42',
        ping_interval: 10,
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
  const advanceTime = (ms) => {
    now += ms;
    jest.advanceTimersToNextTimer();
  };

  beforeAll(() => jest.useFakeTimers());

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
        await waitFor(() => expect(screen.getByTestId('time-string')).toBeInTheDocument());
      });
      expect(screen.getByTestId('time-string')).toHaveTextContent('00:01:00');
      expect(screen.getByTestId('time-state')).toHaveTextContent(JSON.stringify({
        hours: 0,
        minutes: 1,
        seconds: 0,
      }));

      await act(async () => {
        advanceTime(1000);
        await waitFor(() => expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:59'));
      });

      expect(screen.getByTestId('time-state')).toHaveTextContent(JSON.stringify({
        hours: 0,
        minutes: 0,
        seconds: 59,
      }));

      expect(Emitter.emit).not.toHaveBeenCalled();

      // No Poll calls in between
      expect(pollAttempt).toHaveBeenCalledTimes(1);

      // No Ping attempts
      expect(pingAttempt).not.toHaveBeenCalled();

      unmount(); // Cleanup
    });
  });

  describe('when the remaining falls under the warning time', () => {
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
        advanceTime(1000);
        await waitFor(() => expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:24'));
      });

      expect(Emitter.emit).toHaveBeenCalledTimes(1);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_IS_LOW);

      unmount(); // Cleanup
    });
  });

  describe('when the remaining falls under the critical time', () => {
    it('should emit TIMER_IS_LOW when the timer falls under the threshold (10%)', async () => {
      const unmount = renderComponent({ remainingSeconds: 7 });

      await act(async () => {
        await waitFor(() => expect(screen.getByTestId('time-string')).toBeInTheDocument());
      });
      expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:07');

      // Low timer warning is called first render
      expect(Emitter.emit).toHaveBeenCalledTimes(1);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_IS_LOW);

      // The next second should trigger the critical warning.
      await act(async () => {
        advanceTime(1000);
        await waitFor(() => expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:06'));
      });

      expect(Emitter.emit).toHaveBeenCalledTimes(2);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_IS_CRITICALLY_LOW);

      unmount(); // Cleanup
    });
  });

  describe('when the timer reaches zero and there is a grace period', () => {
    it('should emit TIMER_REACHED_NULL when the timer falls under the threshold (10%)', async () => {
      const unmount = renderComponent({ remainingSeconds: 1 });

      await act(async () => {
        await waitFor(() => expect(screen.getByTestId('time-string')).toBeInTheDocument());
      });
      expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:01');

      // Critical timer warning is called first render
      expect(Emitter.emit).toHaveBeenCalledTimes(1);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_IS_CRITICALLY_LOW);

      // The next second should trigger the critical warning.
      await act(async () => {
        advanceTime(1000);
        await waitFor(() => expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:00'));
      });

      expect(Emitter.emit).toHaveBeenCalledTimes(2);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_REACHED_NULL);

      unmount(); // Cleanup
    });
  });

  describe('when the grace period ends', () => {
    it('should emit TIMER_LIMIT_REACHED when the timer falls under the grace period (5 secs)', async () => {
      const unmount = renderComponent({ remainingSeconds: -4 });

      await act(async () => {
        await waitFor(() => expect(screen.getByTestId('time-string')).toBeInTheDocument());
      });
      expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:00');

      // Timer is null is called first render
      expect(Emitter.emit).toHaveBeenCalledTimes(1);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_REACHED_NULL);

      // The next second should kill the exam.
      await act(async () => {
        advanceTime(1000);
        await waitFor(() => expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:00'));
      });

      expect(Emitter.emit).toHaveBeenCalledTimes(2);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_LIMIT_REACHED);

      // Lets just wait a couple more seconds and check that the timer was killed as well.
      await act(async () => {
        advanceTime(3000);
        await waitFor(() => expect(screen.getByTestId('time-string')).toHaveTextContent('00:00:00'));
      });

      // Emitter should be exactly as before
      expect(Emitter.emit).toHaveBeenCalledTimes(2);
      expect(Emitter.emit).toHaveBeenCalledWith(TIMER_LIMIT_REACHED);

      unmount(); // Cleanup
    });
  });
});
