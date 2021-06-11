import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button } from '@edx/paragon';
import ExamStateContext from '../../context';
import { ExamType } from '../../constants';

const SubmitProctoredExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const {
    submitExam,
    continueExam,
    exam,
    activeAttempt,
  } = state;
  const { type: examType } = exam || {};
  const { exam_display_name: examName } = activeAttempt;

  return (
    <>
      <h3 className="h3" data-testid="proctored-exam-instructions-title">
        <FormattedMessage
          id="exam.SubmitProctoredExamInstructions.title"
          defaultMessage="Are you sure you want to end your proctored exam?"
        />
      </h3>
      <ul>
        <li>
          <FormattedMessage
            id="exam.SubmitProctoredExamInstructions.warningText1"
            defaultMessage='Make sure that you have selected "Submit" for each answer before you submit your exam.'
          />
        </li>
        <li>
          <FormattedMessage
            id="exam.SubmitProctoredExamInstructions.warningText2"
            defaultMessage={'Once you click "Yes, end my proctored exam", the exam will'
            + ' be closed, and your proctoring session will be submitted for review.'}
          />
        </li>
      </ul>
      {examType === ExamType.ONBOARDING && (
        <p data-testid="submit-onboarding-exam">
          <FormattedMessage
            id="exam.SubmitOnboardingExamInstructions.text"
            defaultMessage={'You are taking "{examName}" as an '
            + 'onboarding exam. You must click “Yes, end my proctored exam” '
            + 'and submit your proctoring session to complete onboarding.'}
            values={{ examName }}
          />
        </p>
      )}
      <Button variant="primary" onClick={submitExam}>
        <FormattedMessage
          id="exam.SubmitProctoredExamInstructions.submit"
          defaultMessage="Yes, end my proctored exam"
        />
      </Button>
      &nbsp;
      <Button variant="outline-primary" onClick={continueExam}>
        <FormattedMessage
          id="exam.SubmitProctoredExamInstructions.continue"
          defaultMessage="No, I'd like to continue working"
        />
      </Button>
    </>
  );
};

export default SubmitProctoredExamInstructions;
