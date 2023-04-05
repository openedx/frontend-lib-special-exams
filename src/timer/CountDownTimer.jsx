import React, { useContext } from 'react';
import { Icon, useToggle } from '@edx/paragon';
import { Visibility, VisibilityOff } from '@edx/paragon/icons';
import { injectIntl } from '@edx/frontend-platform/i18n';
import { TimerContext } from './TimerProvider';

/**
 * Display timer textual value. Display hide/show button.
 */
const CountDownTimer = injectIntl((props) => {
  const timer = useContext(TimerContext);
  const timeString = timer.getTimeString();
  const [isShowTimer, showTimer, hideTimer] = useToggle(true);
  const { intl } = props;

  const generateAccessbilityString = (timeState) => {
    const { hours, minutes } = timeState;

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

    /**
    * INTL NOTE: At the moment, these strings are NOT internationalized/translated.
    * The back-end also does not support this either.
    *
    * It is TBD if this needs to be implemented
    */
    return `you have ${remainingTime} remaining`;
  };

  return (
    <div
      className="exam-timer-clock d-flex justify-content-between"
      style={{ minWidth: isShowTimer ? '110px' : '32px' }}
    >
      <span className="sr-only timer-announce" aria-live="assertive">{generateAccessbilityString(timer.timeState)}</span>
      {isShowTimer && timeString}
      <span
        className="pl-2 d-flex flex-column justify-content-center"
        id="toggle_timer"
        aria-pressed={isShowTimer ? 'false' : 'true'}
        aria-label={isShowTimer
          ? intl.formatMessage({
            id: 'exam.aria.hideTimer',
            defaultMessage: 'Hide Timer',
          })
          : intl.formatMessage({
            id: 'exam.aria.showTimer',
            defaultMessage: 'Show Timer',
          })}
      >
        {isShowTimer
          ? <Icon data-testid="hide-timer" src={VisibilityOff} onClick={hideTimer} />
          : <Icon data-testid="show-timer" src={Visibility} onClick={showTimer} />}
      </span>
    </div>
  );
});

export default CountDownTimer;
