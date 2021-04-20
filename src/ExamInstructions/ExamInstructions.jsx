import React from 'react';
import PropTypes from 'prop-types';
import { Button, Container } from '@edx/paragon';

const ExamInstructions = ({ examDuration, startExam }) => (
  <div>
    <Container className="border py-5 mb-4">
      <div className="h3" data-testid="exam-instructions-title">
        Subsection is a Timed Exam ({examDuration} minutes)
      </div>
      <p>
        This exam has a time limit associated with it.
        <strong> To pass this exam, you must complete the problems in the time allowed. </strong>
        After you select
        <strong> I am ready to start this timed exam, </strong>
        you will have {examDuration} minutes to complete and submit the exam.
      </p>
      <Button
        variant="outline-primary"
        onClick={startExam}
      >
        I am ready to start this timed exam.
      </Button>
    </Container>

    <div className="footer-sequence">
      <div className="h4">Can I request additional time to complete my exam? </div>
      <p>
        If you have disabilities,
        you might be eligible for an additional time allowance on timed exams.
        Ask your course team for information about additional time allowances.
      </p>
    </div>
  </div>
);

ExamInstructions.propTypes = {
  examDuration: PropTypes.number.isRequired,
  startExam: PropTypes.func.isRequired,
};

// eslint-disable-next-line import/prefer-default-export
export { ExamInstructions };
