import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from '@edx/frontend-platform/i18n';
import { Button, Alert, useToggle } from '@edx/paragon';
import CountDownTimer from './CountDownTimer';
import { ExamStatus, IS_STARTED_STATUS } from '../constants';
import TimerProvider from './TimerProvider';
import { Emitter } from '../data';
import {
  TIMER_IS_CRITICALLY_LOW,
  TIMER_IS_LOW,
  TIMER_LIMIT_REACHED,
  TIMER_REACHED_NULL,
} from './events';

/**
 * Exam timer block component.
 */
const ExamTimerBlock = injectIntl(({
  attempt, stopExamAttempt, expireExamAttempt, pollExamAttempt,
  intl, pingAttempt, submitExam,
}) => {
  const [isShowMore, showMore, showLess] = useToggle(false);
  const [alertVariant, setAlertVariant] = useState('info');
  const [timeReachedNull, setTimeReachedNull] = useState(false);

  if (!attempt || !IS_STARTED_STATUS(attempt.attempt_status)) {
    return null;
  }

  const onLowTime = () => setAlertVariant('warning');
  const onCriticalLowTime = () => setAlertVariant('danger');
  const onTimeReachedNull = () => setTimeReachedNull(true);

  const handleEndExamClick = () => {
    // if timer reached 00:00 submit exam right away
    // instead of trying to move user to ready_to_submit page
    if (timeReachedNull) {
      submitExam();
    } else {
      stopExamAttempt();
    }
  };

  useEffect(() => {
    Emitter.once(TIMER_IS_LOW, onLowTime);
    Emitter.once(TIMER_IS_CRITICALLY_LOW, onCriticalLowTime);
    Emitter.once(TIMER_LIMIT_REACHED, expireExamAttempt);
    Emitter.once(TIMER_REACHED_NULL, onTimeReachedNull);

    return () => {
      Emitter.off(TIMER_IS_LOW, onLowTime);
      Emitter.off(TIMER_IS_CRITICALLY_LOW, onCriticalLowTime);
      Emitter.off(TIMER_LIMIT_REACHED, expireExamAttempt);
      Emitter.off(TIMER_REACHED_NULL, onTimeReachedNull);
    };
  }, []);

  return (
    <TimerProvider attempt={attempt} pollHandler={pollExamAttempt} pingHandler={pingAttempt}>
      <Alert variant={alertVariant}>
        <div
          className="d-flex justify-content-between flex-column flex-lg-row align-items-start"
          data-testid="exam-timer"
        >
          <div>
            <FormattedMessage
              id="exam.examTimer.text"
              defaultMessage='You are taking "{examLink}" as {examType}.'
              values={{
                examLink: (
                  <Alert.Link href={attempt.exam_url_path}>
                    {attempt.exam_display_name}
                  </Alert.Link>
                ),
                examType: attempt.exam_type,
              }}
            />
            {' '}
            {
              isShowMore
                ? (
                  <span>
                    <FormattedMessage
                      id="exam.examTimer.showLess"
                      defaultMessage={'The timer on the right shows the time remaining in the exam. '
                        + 'To receive credit for problems, you must select "Submit" '
                        + 'for each problem before you select "End My Exam" '}
                    />
                    <Alert.Link onClick={showLess}>
                      <FormattedMessage
                        id="exam.examTimer.showLessLink"
                        defaultMessage="Show less"
                      />
                    </Alert.Link>
                  </span>
                )
                : (
                  <Alert.Link onClick={showMore}>
                    <FormattedMessage
                      id="exam.examTimer.showMoreLink"
                      defaultMessage="Show more"
                    />
                  </Alert.Link>
                )
            }
          </div>
          <div
            className="d-flex align-items-center flex-shrink-0 ml-lg-3 mt-2 mt-lg-0"
            aria-label={intl.formatMessage({
              id: 'exam.aria.examTimerAndEndExamButton',
              defaultMessage: 'Exam timer and end exam button',
            })}
          >

            {attempt.attempt_status !== ExamStatus.READY_TO_SUBMIT && (
              <Button data-testid="end-button" className="mr-3" variant="outline-primary" onClick={handleEndExamClick}>
                <FormattedMessage
                  id="exam.examTimer.endExamBtn"
                  defaultMessage="End My Exam"
                />
              </Button>
            )}

            <CountDownTimer />

          </div>
        </div>
      </Alert>
    </TimerProvider>
  );
});

ExamTimerBlock.propTypes = {
  attempt: PropTypes.shape({
    exam_url_path: PropTypes.string.isRequired,
    exam_display_name: PropTypes.string.isRequired,
    time_remaining_seconds: PropTypes.number.isRequired,
  }),
  stopExamAttempt: PropTypes.func.isRequired,
  expireExamAttempt: PropTypes.func.isRequired,
  submitExam: PropTypes.func.isRequired,
};

export default ExamTimerBlock;
