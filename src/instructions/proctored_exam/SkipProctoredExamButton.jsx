import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@openedx/paragon';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

const SkipProctoredExamButton = ({ handleClick }) => (
  <p>
    <Button
      data-testid="start-exam-without-proctoring-button"
      variant="link"
      onClick={handleClick}
    >
      <FormattedMessage
        id="exam.skipProctoredExamButton"
        defaultMessage="Take this exam without proctoring."
      />
    </Button>
  </p>
);

SkipProctoredExamButton.propTypes = {
  handleClick: PropTypes.func.isRequired,
};

export default SkipProctoredExamButton;
