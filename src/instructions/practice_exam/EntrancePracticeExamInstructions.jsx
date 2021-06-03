import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button } from '@edx/paragon';
import ExamStateContext from '../../context';

const EntrancePracticeExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const { startProctoringExam } = state;

  return (
    <>
      <div className="h3" data-testid="exam-instructions-title">
        <FormattedMessage
          id="exam.EntrancePracticeExamInstructions.title"
          defaultMessage="Try a proctored exam"
        />
      </div>
      <p>
        <FormattedMessage
          id="exam.EntrancePracticeExamInstructions.text1"
          defaultMessage={'Get familiar with proctoring for real exams later in '
          + 'the course. This practice exam has no impact on your grade in the course.'}
        />
      </p>
      <p className="pl-4 m-md-0">
        <Button
          data-testid="start-exam-button"
          variant="primary"
          onClick={startProctoringExam}
        >
          <FormattedMessage
            id="exam.EntrancePracticeExamInstructions.startExamButtonText"
            defaultMessage="Continue to my practice exam."
          />
        </Button>
      </p>
      <p className="pl-md-4">
        <FormattedMessage
          id="exam.EntrancePracticeExamInstructions.text2"
          defaultMessage="You will be guided through steps to set up online proctoring software and verify your identity."
        />
      </p>
    </>
  );
};

export default EntrancePracticeExamInstructions;
