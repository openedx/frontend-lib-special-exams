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
const POLL_INTERVAL = 30;
const TIME_LIMIT_CRITICAL_PCT = 0.05;
const TIME_LIMIT_LOW_PCT = 0.2;

export const TimerContext = React.createContext({});

const mapStateToProps = (state) => {
  const { activeAttempt, exam } = state.examState;
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
  const [accessibilityTimeString, setAccessibilityTimeString] = useState('');
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

  /**
   * Converts the given value in minutes to a more human readable format
   * 1 -> 1 Minute
   * 2 -> 2 Minutes
   * 60 -> 1 hour
   * 90 -> 1 hour and 30 Minutes
   * 120 -> 2 hours
   * @param timeInMinutes - The exam time remaining as an integer of minutes
   * @returns - The time remaining as a human-readable string
   */
  function humanizedTime(timeInMinutes) {
    const hours = Number.parseInt(timeInMinutes / 60, 10);
    const minutes = timeInMinutes % 60;
    let remainingTime = '';

    if (hours !== 0) {
      remainingTime += `${hours} hour`;
      if (hours >= 2) {
        remainingTime += 's';
      }
      remainingTime += ' and ';
    }
    remainingTime += `${minutes} minute`;
    if (minutes !== 1) {
      remainingTime += 's';
    }

    return remainingTime;
  }

  /**
   * Generates an accessibility_time_string.
   * @param timeRemainingSeconds -  The exam time remaining as an integer of minutes
   * @returns - An accessibility string for knowing how much time emains in the exam
   */
  function generateAccessibilityString(timeRemainingSeconds) {
    const remainingTime = humanizedTime(parseInt(Math.floor(timeRemainingSeconds / 60.0, 0), 10));

    /**
    * INTL NOTE: At the moment, these strings are NOT internationalized/translated.
    * The back-end also does not support this either.
    *
    * It is TBD if this needs to be implemented
    */
    return `you have ${remainingTime} remaining`;
  }

  const pollExam = () => {
    const url = attempt.exam_started_poll_url;
    const queryString = `?sourceid=in_exam&proctored=${attempt.taking_as_proctored}`;
    pollHandler(url + queryString);
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
    liveInterval = setInterval(() => {
      secondsLeft -= 1;
      timerTick += 1;
      setTimeState(getFormattedRemainingTime(secondsLeft));
      processTimeLeft(liveInterval, secondsLeft);
      // Every tick, update the a11y string
      setAccessibilityTimeString(generateAccessibilityString(timeRemaining));

      // no polling during grace period
      // if (timerTick % POLL_INTERVAL === 0 && secondsLeft >= 0) {
      //   pollExam();
      // }
      // if exam is proctored ping provider app also
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
    <TimerContext.Provider value={{
      timeState,
      accessibilityTimeString,
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
