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
  const [isShowTimer, showTimer, hideTimer] = useToggle(true);
  const { intl } = props;

  return (
    <div
      className="exam-timer-clock d-flex justify-content-between"
      style={{ minWidth: isShowTimer ? '110px' : '32px' }}
    >
      {isShowTimer && timer.getTimeString()}
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
          ? <Icon src={Visibility} onClick={hideTimer} />
          : <Icon src={VisibilityOff} onClick={showTimer} />}
      </span>
    </div>
  );
});

export default CountDownTimer;
