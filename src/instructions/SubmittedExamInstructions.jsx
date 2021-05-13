import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Container } from '@edx/paragon';
import ExamStateContext from '../context';

const SubmittedExamInstructions = () => {
  const state = useContext(ExamStateContext);

  return (
    <Container className="border py-5 mb-4">
      <h3 className="h3">
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
      <p>
        <FormattedMessage
          id="exam.submittedExamInstructions.text"
          defaultMessage={'After the due date has passed, you can review the exam,'
                + ' but you cannot change your answers.'}
        />
      </p>
    </Container>
  );
};

export default SubmittedExamInstructions;
