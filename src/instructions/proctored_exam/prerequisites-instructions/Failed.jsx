import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

const FailedPrerequisitesProctoredExamInstructions = ({ prerequisites, platformName }) => (
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
    <p>
      <FormattedMessage
        id="exam.FailedPrerequisitesProctoredExamInstructions.text3"
        defaultMessage={'If you have questions about the status of your requirements, contact {platformName} Support.'}
        values={{ platformName }}
      />
    </p>
  </>
);

FailedPrerequisitesProctoredExamInstructions.propTypes = {
  prerequisites: PropTypes.arrayOf(PropTypes.object).isRequired,
  platformName: PropTypes.string.isRequired,
};

export default FailedPrerequisitesProctoredExamInstructions;
