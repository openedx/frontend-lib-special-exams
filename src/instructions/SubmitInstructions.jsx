import React, { useContext, useEffect, useState } from 'react';
import { Button, Container } from '@edx/paragon';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import Emitter from '../data/emitter';
import { ExamType } from '../constants';
import { SubmitProctoredExamInstructions } from './proctored_exam';
import { SubmitTimedExamInstructions } from './timed_exam';
import Footer from './proctored_exam/Footer';
import ExamStateContext from '../context';
import { TIMER_REACHED_NULL } from '../timer/events';

const SubmitExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const { exam, continueExam, activeAttempt } = state;
  const { time_remaining_seconds: timeRemaining } = activeAttempt;
  const { type: examType } = exam || {};
  const [canContinue, setCanContinue] = useState(timeRemaining > 0);

  const hideContinueButton = () => setCanContinue(false);

  useEffect(() => {
    Emitter.once(TIMER_REACHED_NULL, hideContinueButton);

    return () => {
      Emitter.off(TIMER_REACHED_NULL, hideContinueButton);
    };
  }, []);

  return (
    <div>
      <Container className="border py-5 mb-4">
        {examType === ExamType.TIMED
          ? <SubmitTimedExamInstructions />
          : <SubmitProctoredExamInstructions />}
        {canContinue && (
          <Button variant="outline-primary" onClick={continueExam} data-testid="continue-exam-button">
            <FormattedMessage
              id="exam.SubmitExamInstructions.continueButton"
              defaultMessage="No, I'd like to continue working"
            />
          </Button>
        )}
      </Container>
      {examType !== ExamType.TIMED && <Footer />}
    </div>
  );
};

export default SubmitExamInstructions;
