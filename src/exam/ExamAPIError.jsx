import React from 'react';
import { Alert, Hyperlink, Icon } from '@openedx/paragon';
import { Info } from '@openedx/paragon/icons';
import { useIntl, FormattedMessage } from 'react-intl';
import messages from './messages';
import { useSequenceExam } from '../core/SequenceExamContext';
import { useSpecialExams } from '../core/SpecialExamsProvider';

const ExamAPIError = () => {
  const { siteName: SITE_NAME, supportUrl: SUPPORT_URL } = useSpecialExams().config;
  const { apiErrorMsg } = useSequenceExam();
  const shouldShowApiErrorMsg = !!apiErrorMsg && !apiErrorMsg.includes('<');
  const intl = useIntl();

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

export default ExamAPIError;
