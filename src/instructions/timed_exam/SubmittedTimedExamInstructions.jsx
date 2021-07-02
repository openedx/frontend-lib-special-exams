import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import ExamStateContext from '../../context';

const SubmittedTimedExamInstructions = () => {
  const state = useContext(ExamStateContext);

  return (
    <h3 className="h3" data-testid="exam.submittedExamInstructions.title">
      {state.timeIsOver
        ? (
          <FormattedMessage
            id="exam.submittedExamInstructions.overtimeTitle"
            defaultMessage="The time allotted for this exam has expired. Your exam has been submitted and any work you completed will be graded."
          />
        )
        : (
          <FormattedMessage
            id="exam.submittedExamInstructions.title"
            defaultMessage="You have submitted your timed exam."
          />
        )}
    </h3>
  );
};

export default SubmittedTimedExamInstructions;
