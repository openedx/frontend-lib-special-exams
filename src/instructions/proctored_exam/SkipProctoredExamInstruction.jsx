import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button, Container } from '@edx/paragon';
import ExamStateContext from '../../context';
import Footer from './Footer';

const SkipProctoredExamInstruction = ({ cancelSkipProctoredExam }) => {
  const state = useContext(ExamStateContext);
  const { skipProctoringExam } = state;

  return (
    <>
      <Container className="border py-5 mb-4">
        <p data-testid="proctored-exam-instructions-title">
          <FormattedMessage
            id="exam.skipProctoredExamInstructions.text1"
            defaultMessage="Are you sure you want to take this exam without proctoring?"
          />
        </p>
        <p>
          <FormattedMessage
            id="exam.skipProctoredExamInstructions.text2"
            defaultMessage={'If you take this exam without proctoring, you will not be eligible for '
            + 'course credit or the MicroMasters credential if either applies to this course.'}
          />
        </p>
        <p className="mb-0">
          <Button
            data-testid="skip-confirm-exam-button"
            variant="primary"
            className="mr-3 mb-2"
            onClick={skipProctoringExam}
          >
            <FormattedMessage
              id="exam.entranceExamInstructions.skipConfirmExamButtonText1"
              defaultMessage="Continue Exam Without Proctoring"
            />
          </Button>
          <Button
            data-testid="skip-cancel-exam-button"
            variant="secondary"
            className="mb-2"
            onClick={cancelSkipProctoredExam}
          >
            <FormattedMessage
              id="exam.entranceExamInstructions.skipCancelExamButtonText"
              defaultMessage="Go Back"
            />
          </Button>
        </p>
      </Container>
      <Footer />
    </>
  );
};

SkipProctoredExamInstruction.propTypes = {
  cancelSkipProctoredExam: PropTypes.func.isRequired,
};

export default SkipProctoredExamInstruction;
