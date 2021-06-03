import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

const ProviderProctoredExamInstructions = ({ platformName, contactInfo, instructions }) => (
  <>
    <p>
      <FormattedMessage
        id="exam.DownloadSoftwareProctoredExamInstructions.text1"
        defaultMessage={'Note: As part of the proctored exam setup, you '
        + 'will be asked to verify your identity. Before you begin, make '
        + 'sure you are on a computer with a webcam, and that you have a '
        + 'valid form of photo identification such as a driver’s license or passport.'}
      />
    </p>
    <ol>
      {instructions.map((item, index) => (
        <li key={index.toString()}>
          {item}
        </li>
      ))}
    </ol>
    {platformName && contactInfo && (
      <p>
        <FormattedMessage
          id="exam.DownloadSoftwareProctoredExamInstructions.supportText"
          defaultMessage={'If you have issues relating to proctoring, you can '
          + 'contact {platformName} technical support by emailing {contactInfo}.'}
          values={{
            platformName,
            contactInfo,
          }}
        />
      </p>
    )}
  </>
);

ProviderProctoredExamInstructions.propTypes = {
  platformName: PropTypes.string.isRequired,
  contactInfo: PropTypes.string.isRequired,
  instructions: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ProviderProctoredExamInstructions;
