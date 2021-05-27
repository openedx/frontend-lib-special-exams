import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import ExamCode from './ExamCode';

const DefaultInstructions = ({ code }) => (
  <>
    <div className="h4">
      <FormattedMessage
        id="exam.DefaultDownloadSoftwareProctoredExamInstructions.step1.title"
        defaultMessage="Step 1."
      />
    </div>
    <p>
      <ExamCode code={code} />
    </p>
    <p>
      <FormattedMessage
        id="exam.DefaultDownloadSoftwareProctoredExamInstructions.step1.body"
        defaultMessage="Select the exam code, then copy it using Control + C (Windows) or Command + C (Mac)."
      />
    </p>
    <div className="h4">
      <FormattedMessage
        id="exam.DefaultDownloadSoftwareProctoredExamInstructions.step2.title"
        defaultMessage="Step 2."
      />
    </div>
    <p>
      <FormattedMessage
        id="exam.DefaultDownloadSoftwareProctoredExamInstructions.step2.body1"
        defaultMessage="Start your system check now. A new window will open for this step and you will verify your identity."
      />
    </p>
    <p>
      <FormattedMessage
        id="exam.DefaultDownloadSoftwareProctoredExamInstructions.step2.body2"
        defaultMessage="Make sure you:"
      />
    </p>
    <ul>
      <li>
        <FormattedMessage
          id="exam.DefaultDownloadSoftwareProctoredExamInstructions.step2.body3"
          defaultMessage="Have a computer with a functioning webcam"
        />
      </li>
      <li>
        <FormattedMessage
          id="exam.DefaultDownloadSoftwareProctoredExamInstructions.step2.body4"
          defaultMessage="Have your valid photo ID (e.g. driver's license or passport) ready"
        />
      </li>
    </ul>
  </>
);

DefaultInstructions.propTypes = {
  code: PropTypes.string.isRequired,
};

export default DefaultInstructions;
