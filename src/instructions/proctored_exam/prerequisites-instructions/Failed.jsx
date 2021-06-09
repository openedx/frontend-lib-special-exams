import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import SkipProctoredExamButton from '../SkipProctoredExamButton';

const FailedPrerequisitesProctoredExamInstructions = (props) => {
  const {
    allowProctoringOptOut, prerequisites, platformName, skipProctoredExam,
  } = props;

  return (
    <>
      <p className="pb-2" data-testid="failed-prerequisites">
        <FormattedMessage
          id="exam.FailedPrerequisitesProctoredExamInstructions.text1"
          defaultMessage="You did not satisfy the requirements for taking this exam with proctoring."
        />
      </p>
      <p>
        <FormattedMessage
          id="exam.FailedPrerequisitesProctoredExamInstructions.text2"
          defaultMessage="You did not satisfy the following prerequisites:"
        />
      </p>
      <ol style={{ listStyleType: 'disc' }}>
        {prerequisites.map((item, index) => (
          <li key={index.toString()}>
            {item.jumpto_url
              ? <a href={item.jumpto_url}>{item.display_name}</a>
              : item.display_name}
          </li>
        ))}
      </ol>
      {allowProctoringOptOut && (
        <>
          <p>
            <FormattedMessage
              id="exam.startExamInstructions.skipExamText"
              defaultMessage="Due to unsatisfied prerequisites, you can only take this exam without proctoring."
            />
          </p>
          <SkipProctoredExamButton handleClick={skipProctoredExam} />
        </>
      )}
      <p>
        <FormattedMessage
          id="exam.FailedPrerequisitesProctoredExamInstructions.text3"
          defaultMessage={'If you have questions about the status of your requirements, contact {platformName} Support.'}
          values={{ platformName }}
        />
      </p>
    </>
  );
};

FailedPrerequisitesProctoredExamInstructions.propTypes = {
  allowProctoringOptOut: PropTypes.bool.isRequired,
  prerequisites: PropTypes.arrayOf(PropTypes.object).isRequired,
  platformName: PropTypes.string.isRequired,
  skipProctoredExam: PropTypes.func.isRequired,
};

export default FailedPrerequisitesProctoredExamInstructions;
