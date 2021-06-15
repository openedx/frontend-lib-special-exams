import React, { useState, useContext } from 'react';
import { Alert, Icon } from '@edx/paragon';
import { Info } from '@edx/paragon/icons';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import ExamStateContext from '../context';

export default function ExamAPIError() {
  const state = useContext(ExamStateContext);
  const { apiErrorMsg, proctoringSettings } = state;
  const { contact_us: contactUs, platform_name: platformName } = proctoringSettings;
  const [showError, setShowError] = useState(false);

  const renderHeading = () => {
    if (contactUs && platformName) {
      return (
        <FormattedMessage
          id="exam.apiError.text1"
          defaultMessage={
            'A system error has occurred with your exam. '
              + 'Please reach out to {supportLink} for assistance, '
              + 'and return to the exam once you receive further instructions.'
          }
          values={{ supportLink: <a data-testid="support-link" href={contactUs} target="_blank" rel="noopener noreferrer">{platformName} Support</a> }}
        />
      );
    }

    return (
      <FormattedMessage
        id="exam.apiError.text2"
        defaultMessage="A system error has occurred with your exam. Please reach out to support for assistance."
      />
    );
  };

  return (
    <Alert variant="danger" data-testid="exam-api-error-component">
      <Icon src={Info} className="alert-icon" />
      <Alert.Heading data-testid="heading">
        {renderHeading()}
      </Alert.Heading>
      <p>
        <FormattedMessage
          id="exam.apiError.details"
          defaultMessage="Details"
        />:
        <span className="pl-2">
          <Alert.Link onClick={() => setShowError(!showError)} data-testid="show-button">
            {showError ? (
              <FormattedMessage
                id="exam.apiError.showLink"
                defaultMessage="Hide"
              />
            ) : (
              <FormattedMessage
                id="exam.apiError.hideLink"
                defaultMessage="Show"
              />
            )}
          </Alert.Link>
        </span>
      </p>
      {showError && <p data-testid="error-details">{apiErrorMsg}</p>}
    </Alert>
  );
}
