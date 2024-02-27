import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useToggle } from '@edx/paragon';
import { Emitter, pollAttempt, pingAttempt } from '../data';
import {
  TIMER_IS_CRITICALLY_LOW,
  TIMER_IS_LOW,
  TIMER_LIMIT_REACHED,
  TIMER_REACHED_NULL,
} from './events';

/* give an extra 5 seconds where the timer holds at 00:00 before page refreshes */
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
  const [limitReached, setLimitReached] = useToggle(false);
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
    // poll url may be null if this is an LTI exam
    dispatch(pollAttempt(attempt.exam_started_poll_url));
  }, [attempt.exam_started_poll_url, dispatch]);

  const processTimeLeft = useCallback((secondsLeft) => {
    const criticalLowTime = timeLimitMins * 60 * TIME_LIMIT_CRITICAL_PCT;
    const lowTime = timeLimitMins * 60 * TIME_LIMIT_LOW_PCT;

    if (secondsLeft <= criticalLowTime) {
      Emitter.emit(TIMER_IS_CRITICALLY_LOW);
    } else if (secondsLeft <= lowTime) {
      Emitter.emit(TIMER_IS_LOW);
    }
    // Used to hide continue exam button on submit exam pages.
    // Since TIME_LIMIT_REACHED is fired after the grace period we
    // need to emit separate event when timer reaches 00:00
    if (secondsLeft <= 0) {
      Emitter.emit(TIMER_REACHED_NULL);
    }

    if (!limitReached && secondsLeft < LIMIT) {
      setLimitReached();
      Emitter.emit(TIMER_LIMIT_REACHED);

      return false; // Stop the time ticker.
    }

    return true;
  }, [
    timeLimitMins,
    limitReached,
    setLimitReached,
  ]);

  useEffect(() => {
    let timerHandler = true;
    let timerTick = -1;
    const deadline = new Date(timerEnds);
    let timerRef = null;

    const ticker = () => {
      timerTick++;
      const now = new Date();
      const remainingTime = (deadline.getTime() - now.getTime()) / 1000;
      const secondsLeft = Math.floor(remainingTime);

      setTimeState(getFormattedRemainingTime(secondsLeft));
      // no polling during grace period
      if (timerTick % POLL_INTERVAL === 0 && secondsLeft >= 0) {
        pollExam();
      }
      // if exam is proctored ping provider app
      if (workerUrl && timerTick % pingInterval === pingInterval / 2) {
        dispatch(pingAttempt(pingInterval, workerUrl));
      }

      const keepTimerRunning = processTimeLeft(secondsLeft);
      if (!keepTimerRunning) {
        clearInterval(timerHandler);
        timerHandler = null;
      }
    };

    // We delay the first ticker execution to give time for the emmiter
    // subscribers to hook up, otherwise immediate emissions will miss their purpose.
    setTimeout(() => {
      ticker();

      // If the timer handler is not true it means that it was stopped in the first run.
      if (timerHandler === true) {
        // After the first run, we start the ticker.
        timerHandler = setInterval(ticker, 1000);
      }
    });

    return () => {
      if (timerRef) {
        clearInterval(timerHandler);
        timerRef = null;
      }
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
