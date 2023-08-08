import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import SkipProctoredExamButton from '../SkipProctoredExamButton';

const PendingPrerequisitesProctoredExamInstructions = ({ allowProctoringOptOut, prerequisites, skipProctoredExam }) => (
  <>
    <p className="pb-2" data-testid="pending-prerequisites">
      <FormattedMessage
        id="exam.PendingPrerequisitesProctoredExamInstructions.text1"
        defaultMessage={'You have not completed the prerequisites for '
        + 'this exam. All requirements must be satisfied before you '
        + 'can take this proctored exam.'}
      />
    </p>
    <p>
      <FormattedMessage
        id="exam.PendingPrerequisitesProctoredExamInstructions.text2"
        defaultMessage="The following prerequisites are in a"
      />
      &nbsp;
      <strong>
        <FormattedMessage
          id="exam.PendingPrerequisitesProctoredExamInstructions.text3"
          defaultMessage="pending"
        />
      </strong>
      &nbsp;
      <FormattedMessage
        id="exam.PendingPrerequisitesProctoredExamInstructions.text4"
        defaultMessage="state and must be successfully completed before you can proceed:"
      />
    </p>
    <ol style={{ listStyleType: 'disc' }}>
      {prerequisites.map((item, index) => (
        <li key={`${index.toString()}`}>
          {item.jumpto_url
            ? <a href={item.jumpto_url}>{item.display_name}</a>
            : item.display_name}
        </li>
      ))}
    </ol>
    <p>
      <FormattedMessage
        id="exam.PendingPrerequisitesProctoredExamInstructions.text5"
        defaultMessage={'You can take this exam with proctoring only '
        + 'when all prerequisites-instructions have been successfully completed.'}
      />
    </p>
    {allowProctoringOptOut && <SkipProctoredExamButton handleClick={skipProctoredExam} />}
  </>
);

PendingPrerequisitesProctoredExamInstructions.propTypes = {
  allowProctoringOptOut: PropTypes.bool.isRequired,
  prerequisites: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  skipProctoredExam: PropTypes.func.isRequired,
};

export default PendingPrerequisitesProctoredExamInstructions;
