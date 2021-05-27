import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@edx/paragon';
import { FormattedMessage } from '@edx/frontend-platform/i18n';

const DownloadButtons = ({
  downloadUrl, downloadClicked, onDownloadClick, onStartExamClick,
}) => (
  <>
    {downloadUrl && (
      <Button
        data-testid="exam.DownloadSoftwareProctoredExamInstructions-start-system-check-button"
        variant={downloadClicked ? 'outline-secondary' : 'primary'}
        onClick={onDownloadClick}
      >
        <FormattedMessage
          id="exam.DownloadSoftwareProctoredExamInstructions.startSystemCheckButton"
          defaultMessage="Start System Check"
        />
      </Button>
    )}
    &nbsp;
    <Button
      data-testid="exam.DownloadSoftwareProctoredExamInstructions-start-exam-button"
      variant={downloadUrl && !downloadClicked ? 'outline-secondary' : 'primary'}
      onClick={onStartExamClick}
    >
      <FormattedMessage
        id="exam.DownloadSoftwareProctoredExamInstructions.startExamButton"
        defaultMessage="Start Exam"
      />
    </Button>
  </>
);

DownloadButtons.propTypes = {
  downloadUrl: PropTypes.string.isRequired,
  downloadClicked: PropTypes.bool.isRequired,
  onDownloadClick: PropTypes.func.isRequired,
  onStartExamClick: PropTypes.func.isRequired,
};

export default DownloadButtons;
