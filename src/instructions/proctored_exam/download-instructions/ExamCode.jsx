import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { StatefulButton, Form } from '@openedx/paragon';
import { Check } from '@openedx/paragon/icons';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

const ExamCode = ({ code }) => {
  const props = {
    labels: {
      default: 'Copy',
      complete: 'Copied',
    },
    icons: {
      complete: <Check />,
    },
    variant: 'primary',
    className: 'mr-0',
    disabledStates: [],
  };

  const [buttonState, setButtonState] = useState('default');

  const onClick = () => {
    navigator.clipboard.writeText(code);
    setButtonState('complete');
  };

  return (
    <Form.Group>
      <Form.Label>
        <FormattedMessage
          id="exam.DefaultDownloadSoftwareProctoredExamInstructions.exam-code-text"
          defaultMessage="Copy this unique exam code. You will be prompted to paste this code later before you start the exam."
        />
      </Form.Label>
      <Form.Control
        value={code}
        readOnly
        className="w-50"
        trailingElement={(
          <StatefulButton
            {...props}
            state={buttonState}
            onClick={onClick}
          >
            Copy Exam Code
          </StatefulButton>
        )}
      />
    </Form.Group>
  );
};

ExamCode.propTypes = {
  code: PropTypes.string.isRequired,
};

export default ExamCode;
