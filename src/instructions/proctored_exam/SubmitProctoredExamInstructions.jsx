import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button, Container } from '@edx/paragon';
import ExamStateContext from '../../context';

const SubmitProctoredExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const { submitExam, continueExam } = state;

  return (
    <Container className="border py-5 mb-4">
      <h3 className="h3">
        <FormattedMessage
          id="exam.SubmitProctoredExamInstructions.title"
          defaultMessage="Are you sure you want to end your proctored exam?"
        />
      </h3>
      <p>
        <FormattedMessage
          id="exam.SubmitProctoredExamInstructions.warningText"
          defaultMessage='Make sure that you have selected "Submit" for each answer before you submit your exam.'
        />
      </p>
      <p>
        <FormattedMessage
          id="exam.SubmitProctoredExamInstructions.text"
          defaultMessage='Make sure that you have selected "Submit" for each answer before you submit your exam.'
        />
      </p>
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
    </Container>
  );
};

export default SubmitProctoredExamInstructions;
