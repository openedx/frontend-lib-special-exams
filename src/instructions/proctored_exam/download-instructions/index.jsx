import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { getConfig } from '@edx/frontend-platform';
import { FormattedMessage, injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Container } from '@edx/paragon';
import ExamStateContext from '../../../context';
import { ExamStatus } from '../../../constants';
import WarningModal from '../WarningModal';
import { pollExamAttempt, softwareDownloadAttempt } from '../../../data/api';
import messages from '../messages';
import LtiProviderExamInstructions from './LtiProviderInstructions';
import RestProviderInstructions from './RestProviderInstructions';
import RPNowInstructions from './RPNowInstructions';
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
    use_legacy_attempt_api: useLegacyAttemptApi,
  } = attempt;
  const {
    provider_name: providerName,
    provider_tech_support_email: supportEmail,
    provider_tech_support_phone: supportPhone,
    exam_proctoring_backend: proctoringBackend,
  } = proctoringSettings;
  const examHasLtiProvider = !useLegacyAttemptApi;
  const { instructions } = proctoringBackend || {};
  const [systemCheckStatus, setSystemCheckStatus] = useState('');
  const [downloadClicked, setDownloadClicked] = useState(false);
  const withProviderInstructions = instructions && instructions.length > 0;
  const launchSoftwareUrl = examHasLtiProvider
    ? `${getConfig().EXAMS_BASE_URL}/lti/start_proctoring/${attemptId}` : downloadUrl;

  const handleDownloadClick = () => {
    pollExamAttempt(`${pollUrl}?sourceid=instructions`)
      .then((data) => {
        if (data.status === ExamStatus.READY_TO_START) {
          setSystemCheckStatus('success');
        } else {
          // TODO: This call circumvents the thunk for startProctoringSoftwareDownload
          // which is a bit odd and would handle useLegacyAttempt for us.
          // There's an opportunity to refactor and clean this up a bit.
          softwareDownloadAttempt(attemptId, useLegacyAttemptApi);
          window.open(launchSoftwareUrl, '_blank');
        }
      });
    setDownloadClicked(true);
  };

  const handleStartExamClick = () => {
    pollExamAttempt(`${pollUrl}?sourceid=instructions`)
      .then((data) => (
        data.status === ExamStatus.READY_TO_START
          ? getExamAttemptsData(courseId, sequenceId)
          : setSystemCheckStatus('failure')
      ));
  };

  function providerInstructions() {
    if (examHasLtiProvider) {
      return (
        <LtiProviderExamInstructions
          providerName={providerName}
          supportEmail={supportEmail}
          supportPhone={supportPhone}
        />
      );
    }
    if (withProviderInstructions) {
      return (
        <RestProviderInstructions
          providerName={providerName}
          supportEmail={supportEmail}
          supportPhone={supportPhone}
          instructions={instructions}
        />
      );
    }
    return (
      <RPNowInstructions code={examCode} />
    );
  }

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
        { providerInstructions() }
        <DownloadButtons
          downloadUrl={launchSoftwareUrl}
          onDownloadClick={handleDownloadClick}
          onStartExamClick={handleStartExamClick}
          downloadClicked={downloadClicked}
        />
        {!examHasLtiProvider && !withProviderInstructions && (
          <div className="pt-3">
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
          </div>
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
