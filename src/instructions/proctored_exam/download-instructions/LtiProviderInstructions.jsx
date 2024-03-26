import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Hyperlink } from '@openedx/paragon';

const LtiProviderExamInstructions = ({
  providerName, supportEmail, supportPhone, supportURL,
}) => {
  const supportURLHyperlink = (chunks) => (
    <Hyperlink destination={chunks[0]} target="_blank">
      {chunks}
    </Hyperlink>
  );

  const getSupportText = () => {
    // We assume that an LTI-based provider will either have a supportURL or a supportEmail and supportPhone.
    // In the unlikely event a provider has all three, we prioritize the supportURL.
    if (supportURL) {
      return (
        <FormattedMessage
          id="exam.DownloadSoftwareProctoredExamInstructions.LTI.supportText.URL"
          defaultMessage={'If you have issues relating to proctoring, you can contact '
            + '{providerName} technical support by visiting <a>{supportURL}</a>.'}
          values={{
            providerName,
            supportURL,
            a: supportURLHyperlink,
          }}
        />
      );
    }
    if (supportEmail && supportPhone) {
      return (
        <FormattedMessage
          id="exam.DownloadSoftwareProctoredExamInstructions.LTI.supportText.EmailPhone"
          defaultMessage={'If you have issues relating to proctoring, you can contact '
            + '{providerName} technical support by emailing {supportEmail} or by calling {supportPhone}.'}
          values={{
            providerName,
            supportEmail,
            supportPhone,
          }}
        />
      );
    }
    return null;
  };

  return (
    <p>
      {getSupportText()}
    </p>
  );
};

LtiProviderExamInstructions.propTypes = {
  providerName: PropTypes.string,
  supportEmail: PropTypes.string,
  supportPhone: PropTypes.string,
  supportURL: PropTypes.string,
};

LtiProviderExamInstructions.defaultProps = {
  providerName: '',
  supportEmail: '',
  supportPhone: '',
  supportURL: '',
};

export default LtiProviderExamInstructions;
