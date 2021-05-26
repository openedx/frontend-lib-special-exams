import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Icon } from '@edx/paragon';
import { Info } from '@edx/paragon/icons';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

// Fixme: Replace with store state data once exam settings are implemented
const platformName = 'edX';
const contactUs = 'https://courses.edx.org/support/contact_us';

export default function ExamAPIError({ details }) {
  return (
    <Alert variant="danger">
      <Icon src={Info} className="alert-icon" />
      <Alert.Heading>
        <FormattedMessage
          id="exam.apiError.text"
          defaultMessage={
            'A system error has occurred with your exam. '
              + 'Please reach out to {support_link} for assistance, '
              + 'and return to the exam once you receive further instructions.'
          }
          values={{ support_link: <a href={contactUs} target="_blank" rel="noopener noreferrer">{platformName} Support</a> }}
        />
      </Alert.Heading>
      <p>
        <FormattedMessage
          id="exam.apiError.details"
          defaultMessage="Details"
        />: {details}
      </p>
    </Alert>
  );
}

ExamAPIError.propTypes = {
  details: PropTypes.string.isRequired,
};
