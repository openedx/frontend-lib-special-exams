import React from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Alert } from '@edx/paragon';

const UnknownAttemptStatusError = () => (
  <Alert variant="danger" data-testid="unknown-status-error">
    <Alert.Heading>
      <FormattedMessage
        id="exam.defaultError"
        defaultMessage="A system error has occurred with your exam. Please reach out to support for assistance."
      />
    </Alert.Heading>
  </Alert>
);

export default UnknownAttemptStatusError;
