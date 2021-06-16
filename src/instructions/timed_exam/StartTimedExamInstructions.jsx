import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button } from '@edx/paragon';
import ExamStateContext from '../../context';

const StartTimedExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const { exam, startTimedExam } = state;
  const examDuration = exam.total_time;

  return (
    <>
      <div className="h3" data-testid="exam-instructions-title">
        <FormattedMessage
          id="exam.startExamInstructions.title"
          defaultMessage="Subsection is a Timed Exam ({examDuration})"
          values={{ examDuration }}
        />
      </div>
      <p>
        <FormattedMessage
          id="exam.startExamInstructions.text1"
          defaultMessage="This exam has a time limit associated with it. "
        />
        <strong>
          <FormattedMessage
            id="exam.startExamInstructions.text2"
            defaultMessage="To pass this exam, you must complete the problems in the time allowed. "
          />
        </strong>
        <FormattedMessage
          id="exam.startExamInstructions.text3"
          defaultMessage={'After you select "I am ready to start this timed exam", '
          + 'you will have {examDuration} to complete and submit the exam.'}
          values={{ examDuration }}
        />
      </p>
      <Button
        data-testid="start-exam-button"
        variant="outline-primary"
        onClick={startTimedExam}
      >
        <FormattedMessage
          id="exam.startExamInstructions.startExamButtonText"
          defaultMessage="I am ready to start this timed exam."
        />
      </Button>
    </>
  );
};

export default StartTimedExamInstructions;
