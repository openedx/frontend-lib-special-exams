import React, { useContext } from 'react';
import { getConfig } from '@edx/frontend-platform';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button } from '@edx/paragon';
import ExamStateContext from '../../context';
import { ExamType } from '../../constants';

const SubmitProctoredExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const {
    submitExam,
    exam,
    activeAttempt,
  } = state;
  const { type: examType, attempt } = exam || {};
  const { exam_display_name: examName } = activeAttempt;
  const examHasLtiProvider = !attempt.use_legacy_attempt_api;
  const submitLtiAttemptUrl = `${getConfig().EXAMS_BASE_URL}/lti/end_assessment/${attempt.attempt_id}`;

  const handleSubmitClick = () => {
    if (examHasLtiProvider) {
      window.location.assign(submitLtiAttemptUrl);
    }
    submitExam();
  };

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
      <Button variant="primary" onClick={handleSubmitClick} className="mr-2" data-testid="end-exam-button">
        <FormattedMessage
          id="exam.SubmitProctoredExamInstructions.submit"
          defaultMessage="Yes, end my proctored exam"
        />
      </Button>
    </>
  );
};

export default SubmitProctoredExamInstructions;
