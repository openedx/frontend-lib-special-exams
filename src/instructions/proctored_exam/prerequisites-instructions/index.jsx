import React, { useContext } from 'react';
import { Container } from '@edx/paragon';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import ExamStateContext from '../../../context';
import PendingPrerequisitesProctoredExamInstructions from './Pending';
import FailedPrerequisitesProctoredExamInstructions from './Failed';
import Footer from '../Footer';

const PrerequisitesProctoredExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const { exam, proctoringSettings } = state;
  const { prerequisite_status: prerequisitesData } = exam;
  const { pending_prerequisites: pending, failed_prerequisites: failed } = prerequisitesData;
  const { platform_name: platformName } = proctoringSettings;

  let child = null;
  if (failed && failed.length > 0) {
    child = <FailedPrerequisitesProctoredExamInstructions prerequisites={failed} platformName={platformName} />;
  } else if (pending && pending.length > 0) {
    child = <PendingPrerequisitesProctoredExamInstructions prerequisites={pending} />;
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

export default PrerequisitesProctoredExamInstructions;
