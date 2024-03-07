import React, {
  useEffect, useState, useCallback, useRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Emitter, pollAttempt, pingAttempt } from '../data';
import {
  TIMER_IS_CRITICALLY_LOW,
  TIMER_IS_LOW,
  TIMER_LIMIT_REACHED,
  TIMER_REACHED_NULL,
} from './events';

// Give an extra 5 seconds where the timer holds at 00:00 before page refreshes
const GRACE_PERIOD_SECS = 5;
const POLL_INTERVAL = 60;
const TIME_LIMIT_CRITICAL_PCT = 0.05;
const TIME_LIMIT_LOW_PCT = 0.2;
const LIMIT = GRACE_PERIOD_SECS ? 0 - GRACE_PERIOD_SECS : 0;

export const TimerContext = React.createContext({});

const getFormattedRemainingTime = (timeLeft) => ({
  hours: Math.floor(timeLeft / (60 * 60)),
  minutes: Math.floor((timeLeft / 60) % 60),
  seconds: Math.floor(timeLeft % 60),
});

const TimerProvider = ({
  children,
}) => {
  const { activeAttempt: attempt, exam } = useSelector(state => state.specialExams);
  const [timeState, setTimeState] = useState({});
  const lastSignal = useRef(null);
  const dispatch = useDispatch();
  const { time_limit_mins: timeLimitMins } = exam;
  const {
    desktop_application_js_url: workerUrl,
    ping_interval: pingInterval,
    timer_ends: timerEnds,
  } = attempt;

  const getTimeString = () => Object.values(timeState).map(
    item => {
      // Do not show timer negative value.
      // User will see 00:00:00 during grace period if any.
      const value = item < 0 ? 0 : item;
      return (value < 10 ? `0${value}` : value);
    },
  ).join(':');

  const pollExam = useCallback(() => {
    // Poll url may be null if this is an LTI exam.
    dispatch(pollAttempt(attempt.exam_started_poll_url));
  }, [attempt.exam_started_poll_url, dispatch]);

  const processTimeLeft = useCallback((secondsLeft) => {
    const emit = (signal) => {
      // This prevents spamming.
      if (lastSignal.current === signal) {
        return;
      }
      Emitter.emit(signal);
      lastSignal.current = signal;
    };

    const criticalLowTime = timeLimitMins * 60 * TIME_LIMIT_CRITICAL_PCT;
    const lowTime = timeLimitMins * 60 * TIME_LIMIT_LOW_PCT;

    if (secondsLeft <= LIMIT) {
      emit(TIMER_LIMIT_REACHED);
      return true; // Kill the timer.
    }

    if (secondsLeft <= 0) {
      // Used to hide continue exam button on submit exam pages.
      // Since TIME_LIMIT_REACHED is fired after the grace period we
      // need to emit separate event when timer reaches 00:00
      emit(TIMER_REACHED_NULL);
      return false;
    }

    if (secondsLeft <= criticalLowTime) {
      emit(TIMER_IS_CRITICALLY_LOW);
      return false;
    }

    if (secondsLeft <= lowTime) {
      emit(TIMER_IS_LOW);
      return false;
    }

    return false;
  }, [
    timeLimitMins,
  ]);

  useEffect(() => {
    const timerRef = { current: true };
    let timerTick = -1;
    const deadline = new Date(timerEnds);

    const ticker = () => {
      timerTick++;
      const now = Date.now();
      const remainingTime = (deadline.getTime() - now) / 1000;
      const secondsLeft = Math.floor(remainingTime);

      setTimeState(getFormattedRemainingTime(secondsLeft));

      // No polling during grace period.
      if (timerTick % POLL_INTERVAL === 0 && secondsLeft >= 0) {
        pollExam();
      }

      // If exam is proctored ping provider app.
      if (workerUrl && timerTick % pingInterval === pingInterval / 2) {
        dispatch(pingAttempt(pingInterval, workerUrl));
      }

      const killTimer = processTimeLeft(secondsLeft);
      if (killTimer) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    // We delay the first ticker execution to give time for the emmiter
    // subscribers to hook up, otherwise immediate emissions will miss their purpose.
    setTimeout(() => {
      ticker();

      // If the timer handler is not true at this point, it means that it was stopped in the first run.
      // So we don't need to start the timer.
      if (timerRef.current === true) {
        // After the first run, we start the ticker.
        timerRef.current = setInterval(ticker, 1000);
      }
    });

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [
    timerEnds,
    pingInterval,
    workerUrl,
    processTimeLeft,
    pollExam,
    dispatch,
  ]);

  return (
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    <TimerContext.Provider value={{
      timeState,
      getTimeString,
    }}
    >
      {children}
    </TimerContext.Provider>
  );
};

TimerProvider.propTypes = {
  children: PropTypes.element.isRequired,
};
export default TimerProvider;
