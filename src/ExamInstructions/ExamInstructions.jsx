import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button, Container } from '@edx/paragon';

const ExamInstructions = ({ examDuration, startExam }) => (
  <div>
    <Container className="border py-5 mb-4">
      <div className="h3" data-testid="exam-instructions-title">
        <FormattedMessage
          id="exam.startExamInstructions.title"
          defaultMessage="Subsection is a Timed Exam ({examDuration} minutes)"
          values={{ examDuration }}
        />
      </div>
      {/* eslint-disable-next-line react/no-danger */}
      <p dangerouslySetInnerHTML={{
        __html: <FormattedMessage
          id="exam.startExamInstructions.text"
          defaultMessage={'This exam has a time limit associated with it. '
            + '<strong> To pass this exam, you must complete the problems in the time allowed. </strong>'
            + 'After you select <strong> I am ready to start this timed exam, </strong>'
            + 'you will have {examDuration} minutes to complete and submit the exam.'}
          values={{ examDuration }}
        />,
      }}
      />
      <Button
        variant="outline-primary"
        onClick={startExam}
      >
        <FormattedMessage
          id="exam.startExamInstructions.startExamButtonText"
          defaultMessage="I am ready to start this timed exam."
        />
      </Button>
    </Container>

    <div className="footer-sequence">
      <div className="h4">
        <FormattedMessage
          id="exam.startExamInstructions.footerTitle"
          defaultMessage="Can I request additional time to complete my exam?"
        />
      </div>
      <p>
        <FormattedMessage
          id="exam.startExamInstructions.footerText"
          defaultMessage={'If you have disabilities, '
              + 'you might be eligible for an additional time allowance on timed exams. '
              + 'Ask your course team for information about additional time allowances.'}
        />
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
