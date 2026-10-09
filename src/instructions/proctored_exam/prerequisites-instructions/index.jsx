import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '@openedx/paragon';
import { FormattedMessage } from 'react-intl';
import PendingPrerequisitesProctoredExamInstructions from './Pending';
import FailedPrerequisitesProctoredExamInstructions from './Failed';
import Footer from '../Footer';
import { useExam } from '../../../data';
import { useSequenceExam } from '../../../core/SequenceExamContext';

const PrerequisitesProctoredExamInstructions = ({ skipProctoredExam }) => {
  const exam = useExam();
  const { allowProctoringOptOut } = useSequenceExam();

  const { prerequisite_status: prerequisitesData } = exam;
  const { pending_prerequisites: pending, failed_prerequisites: failed } = prerequisitesData;

  let child = null;
  if (failed && failed.length > 0) {
    child = (
      <FailedPrerequisitesProctoredExamInstructions
        prerequisites={failed}
        allowProctoringOptOut={allowProctoringOptOut}
        skipProctoredExam={skipProctoredExam}
      />
    );
  } else if (pending && pending.length > 0) {
    child = (
      <PendingPrerequisitesProctoredExamInstructions
        prerequisites={pending}
        allowProctoringOptOut={allowProctoringOptOut}
        skipProctoredExam={skipProctoredExam}
      />
    );
  }

  return (
    <div>
      <Container className="border py-5 mb-4">
        <div className="h3" data-testid="exam-instructions-title">
          <FormattedMessage
            id="exam.EntranceProctoredExamInstructions.title"
            defaultMessage="This exam is proctored"
          />
        </div>
        {child}
      </Container>
      <Footer />
    </div>
  );
};

PrerequisitesProctoredExamInstructions.propTypes = {
  skipProctoredExam: PropTypes.func.isRequired,
};

export default PrerequisitesProctoredExamInstructions;
