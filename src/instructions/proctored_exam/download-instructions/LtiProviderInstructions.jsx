import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

const LtiProviderExamInstructions = ({
  providerName, supportEmail, supportPhone,
}) => (
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
    {supportEmail && supportPhone && (
      <p>
        <FormattedMessage
          id="exam.DownloadSoftwareProctoredExamInstructions.supportText"
          defaultMessage={'If you have issues relating to proctoring, you can contact '
          + '{providerName} technical support by emailing {supportEmail} or by calling {supportPhone}.'}
          values={{
            providerName,
            supportEmail,
            supportPhone,
          }}
        />
      </p>
    )}
  </>
);

LtiProviderExamInstructions.propTypes = {
  providerName: PropTypes.string,
  supportEmail: PropTypes.string,
  supportPhone: PropTypes.string,
};

LtiProviderExamInstructions.defaultProps = {
  providerName: '',
  supportEmail: '',
  supportPhone: '',
};

export default LtiProviderExamInstructions;
