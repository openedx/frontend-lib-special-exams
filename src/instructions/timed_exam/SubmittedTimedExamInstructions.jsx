import React from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

const SubmittedTimedExamInstructions = () => {
  const { timeIsOver } = useSelector(state => state.specialExams);

  return (
    <h3 className="h3" data-testid="exam.submittedExamInstructions.title">
      {timeIsOver
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
