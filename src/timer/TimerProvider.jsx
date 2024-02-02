import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useToggle } from '@edx/paragon';
import { Emitter } from '../data';
import {
  TIMER_IS_CRITICALLY_LOW,
  TIMER_IS_LOW,
  TIMER_LIMIT_REACHED,
  TIMER_REACHED_NULL,
} from './events';
import { withExamStore } from '../hocs';

/* give an extra 5 seconds where the timer holds at 00:00 before page refreshes */
const GRACE_PERIOD_SECS = 5;
const POLL_INTERVAL = 60;
const TIME_LIMIT_CRITICAL_PCT = 0.05;
const TIME_LIMIT_LOW_PCT = 0.2;

export const TimerContext = React.createContext({});

const mapStateToProps = (state) => {
  const { activeAttempt, exam } = state.specialExams;
  return { attempt: activeAttempt, timeLimitMins: exam.time_limit_mins };
};

const getFormattedRemainingTime = (timeLeft) => ({
  hours: Math.floor(timeLeft / (60 * 60)),
  minutes: Math.floor((timeLeft / 60) % 60),
  seconds: Math.floor(timeLeft % 60),
});

const TimerServiceProvider = ({
  children, attempt, timeLimitMins, pollHandler, pingHandler,
}) => {
  const [timeState, setTimeState] = useState({});
  const [limitReached, setLimitReached] = useToggle(false);
  const {
    desktop_application_js_url: workerUrl,
    ping_interval: pingInterval,
    time_remaining_seconds: timeRemaining,
  } = attempt;
  const LIMIT = GRACE_PERIOD_SECS ? 0 - GRACE_PERIOD_SECS : 0;
  const CRITICAL_LOW_TIME = timeLimitMins * 60 * TIME_LIMIT_CRITICAL_PCT;
  const LOW_TIME = timeLimitMins * 60 * TIME_LIMIT_LOW_PCT;
  let liveInterval = null;

  const getTimeString = () => Object.values(timeState).map(
    item => {
      // Do not show timer negative value.
      // User will see 00:00:00 during grace period if any.
      const value = item < 0 ? 0 : item;
      return (value < 10 ? `0${value}` : value);
    },
  ).join(':');

  const pollExam = () => {
    // poll url may be null if this is an LTI exam
    pollHandler(attempt.exam_started_poll_url);
  };

  const processTimeLeft = (timer, secondsLeft) => {
    if (secondsLeft <= CRITICAL_LOW_TIME) {
      Emitter.emit(TIMER_IS_CRITICALLY_LOW);
    } else if (secondsLeft <= LOW_TIME) {
      Emitter.emit(TIMER_IS_LOW);
    }
    // Used to hide continue exam button on submit exam pages.
    // Since TIME_LIMIT_REACHED is fired after the grace period we
    // need to emit separate event when timer reaches 00:00
    if (secondsLeft <= 0) {
      Emitter.emit(TIMER_REACHED_NULL);
    }
    if (!limitReached && secondsLeft < LIMIT) {
      clearInterval(timer);
      setLimitReached();
      Emitter.emit(TIMER_LIMIT_REACHED);
    }
  };

  useEffect(() => {
    let timerTick = 0;
    let secondsLeft = Math.floor(timeRemaining);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    liveInterval = setInterval(() => {
      secondsLeft -= 1;
      timerTick += 1;
      setTimeState(getFormattedRemainingTime(secondsLeft));
      processTimeLeft(liveInterval, secondsLeft);
      // no polling during grace period
      if (timerTick % POLL_INTERVAL === 0 && secondsLeft >= 0) {
        pollExam();
      }
      // if exam is proctored ping provider app
      if (workerUrl && timerTick % pingInterval === pingInterval / 2) {
        pingHandler(pingInterval, workerUrl);
      }
    }, 1000);
    return () => {
      if (liveInterval) {
        clearInterval(liveInterval);
        liveInterval = null;
      }
    };
  }, [timeRemaining]);

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

TimerServiceProvider.propTypes = {
  attempt: PropTypes.shape({
    time_remaining_seconds: PropTypes.number.isRequired,
    exam_started_poll_url: PropTypes.string,
    desktop_application_js_url: PropTypes.string,
    ping_interval: PropTypes.number,
    taking_as_proctored: PropTypes.bool,
    attempt_status: PropTypes.string.isRequired,
  }).isRequired,
  timeLimitMins: PropTypes.number.isRequired,
  children: PropTypes.element.isRequired,
  pollHandler: PropTypes.func,
  pingHandler: PropTypes.func,
};

TimerServiceProvider.defaultProps = {
  pollHandler: () => {},
  pingHandler: () => {},
};

export default withExamStore(TimerServiceProvider, mapStateToProps);
