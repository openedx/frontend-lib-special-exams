import React from 'react';
import { useDispatch } from 'react-redux';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button } from '@openedx/paragon';

import { submitExam } from '../../data';

const SubmitTimedExamInstructions = () => {
  const dispatch = useDispatch();

  return (
    <>
      <h3 className="h3" data-testid="exam-instructions-title">
        <FormattedMessage
          id="exam.submitExamInstructions.title"
          defaultMessage="Are you sure that you want to submit your timed exam?"
        />
      </h3>
      <p>
        <FormattedMessage
          id="exam.submitExamInstructions.warningText"
          defaultMessage='Make sure that you have selected "Submit" for each problem before you submit your exam.'
        />
      </p>
      <p>
        <FormattedMessage
          id="exam.submitExamInstructions.text"
          defaultMessage="After you submit your exam, your exam will be graded."
        />
      </p>
      <Button variant="primary" onClick={() => dispatch(submitExam())} className="mr-2" data-testid="end-exam-button">
        <FormattedMessage
          id="exam.submitExamInstructions.submit"
          defaultMessage="Yes, submit my timed exam."
        />
      </Button>
    </>
  );
};

export default SubmitTimedExamInstructions;
