import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Container } from '@edx/paragon';
import ExamStateContext from '../../../context';
import { ExamStatus } from '../../../constants';
import WarningModal from '../WarningModal';
import { pollExamAttempt, softwareDownloadAttempt } from '../../../data/api';
import messages from '../messages';
import ProviderInstructions from './ProviderInstructions';
import DefaultInstructions from './DefaultInstructions';
import DownloadButtons from './DownloadButtons';
import Footer from '../Footer';
import SkipProctoredExamButton from '../SkipProctoredExamButton';

const DownloadSoftwareProctoredExamInstructions = ({ intl, skipProctoredExam }) => {
  const state = useContext(ExamStateContext);
  const {
    proctoringSettings,
    exam,
    getExamAttemptsData,
    allowProctoringOptOut,
  } = state;
  const {
    attempt,
    course_id: courseId,
    content_id: sequenceId,
  } = exam;
  const {
    exam_started_poll_url: pollUrl,
    attempt_code: examCode,
    attempt_id: attemptId,
    software_download_url: downloadUrl,
  } = attempt;
  const {
    provider_name: providerName,
    provider_tech_support_email: supportEmail,
    provider_tech_support_phone: supportPhone,
    exam_proctoring_backend: proctoringBackend,
  } = proctoringSettings;
  const { instructions } = proctoringBackend || {};
  const [systemCheckStatus, setSystemCheckStatus] = useState('');
  const [downloadClicked, setDownloadClicked] = useState(false);
  const withProviderInstructions = instructions && instructions.length > 0;

  const handleDownloadClick = () => {
    pollExamAttempt(`${pollUrl}?sourceid=instructions`)
      .then((data) => {
        if (data.status === ExamStatus.READY_TO_START) {
          setSystemCheckStatus('success');
        } else {
          softwareDownloadAttempt(attemptId);
          window.open(downloadUrl, '_blank');
        }
      });
    setDownloadClicked(true);
  };

  const handleStartExamClick = () => {
    pollExamAttempt(`${attempt.exam_started_poll_url}?sourceid=instructions`)
      .then((data) => (
        data.status === ExamStatus.READY_TO_START
          ? getExamAttemptsData(courseId, sequenceId)
          : setSystemCheckStatus('failure')
      ));
  };

  return (
    <div>
      <Container className="border py-5 mb-4">
        <WarningModal
          isOpen={Boolean(systemCheckStatus)}
          title={
            systemCheckStatus === 'success'
              ? intl.formatMessage(messages.softwareLoadedModalTitle)
              : intl.formatMessage(messages.cannotStartModalTitle)
          }
          body={
            systemCheckStatus === 'success'
              ? intl.formatMessage(messages.softwareLoadedModalBody)
              : intl.formatMessage(messages.cannotStartModalBody)
          }
          handleClose={() => setSystemCheckStatus('')}
        />
        <div className="h3" data-testid="exam-instructions-title">
          <FormattedMessage
            id="exam.DownloadSoftwareProctoredExamInstructions.title"
            defaultMessage="Set up and start your proctored exam."
          />
        </div>
        {withProviderInstructions
          ? (
            <ProviderInstructions
              providerName={providerName}
              supportEmail={supportEmail}
              supportPhone={supportPhone}
              instructions={instructions}
            />
          )
          : <DefaultInstructions code={examCode} />}
        <DownloadButtons
          downloadUrl={downloadUrl}
          onDownloadClick={handleDownloadClick}
          onStartExamClick={handleStartExamClick}
          downloadClicked={downloadClicked}
        />
        {!withProviderInstructions && (
          <p className="pt-3">
            <div className="h4">
              <FormattedMessage
                id="exam.DefaultDownloadSoftwareProctoredExamInstructions.step3.title"
                defaultMessage="Step 3."
              />
            </div>
            <p>
              <FormattedMessage
                id="exam.DefaultDownloadSoftwareProctoredExamInstructions.step3.body"
                defaultMessage={'For security and exam integrity reasons, '
                + 'we ask you to sign in to your edX account. Then we will '
                + 'direct you to the RPNow proctoring experience.'}
              />
            </p>
          </p>
        )}
      </Container>
      {allowProctoringOptOut && <SkipProctoredExamButton handleClick={skipProctoredExam} />}
      <Footer />
    </div>
  );
};

DownloadSoftwareProctoredExamInstructions.propTypes = {
  intl: intlShape.isRequired,
  skipProctoredExam: PropTypes.func.isRequired,
};

export default injectIntl(DownloadSoftwareProctoredExamInstructions);
