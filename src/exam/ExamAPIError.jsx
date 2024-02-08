import React from 'react';
import { useSelector } from 'react-redux';
import { getConfig } from '@edx/frontend-platform';
import { Alert, Hyperlink, Icon } from '@edx/paragon';
import { Info } from '@edx/paragon/icons';
import { injectIntl, intlShape, FormattedMessage } from '@edx/frontend-platform/i18n';
import messages from './messages';

const ExamAPIError = ({ intl }) => {
  const { SITE_NAME, SUPPORT_URL } = getConfig();
  const { apiErrorMsg } = useSelector(state => state.specialExams);
  const shouldShowApiErrorMsg = !!apiErrorMsg && !apiErrorMsg.includes('<');

  return (
    <Alert variant="danger" data-testid="exam-api-error-component">
      <Icon src={Info} className="alert-icon" />
      <Alert.Heading data-testid="error-details">
        {shouldShowApiErrorMsg ? apiErrorMsg : intl.formatMessage(messages.apiErrorDefault)}
      </Alert.Heading>
      <p>
        {SITE_NAME && SUPPORT_URL ? (
          <FormattedMessage
            id="exam.apiError.supportText.withLink"
            defaultMessage={
              'If the issue persists, please reach out to {supportLink} for assistance, '
              + 'and return to the exam once you receive further instructions.'
            }
            values={{
              supportLink: (
                <Hyperlink
                  data-testid="support-link"
                  destination={SUPPORT_URL}
                  target="_blank"
                >
                  {SITE_NAME} Support
                </Hyperlink>
              ),
            }}
          />
        ) : intl.formatMessage(messages.supportTextWithoutLink)}
      </p>
    </Alert>
  );
};

ExamAPIError.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(ExamAPIError);
