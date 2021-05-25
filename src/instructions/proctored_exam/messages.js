import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  cannotStartModalTitle: {
    id: 'exam.DownloadProctoringProviderSoftwareModal.title',
    defaultMessage: 'Cannot Start Exam',
  },
  cannotStartModalBody: {
    id: 'exam.DownloadProctoringProviderSoftwareModal.body',
    defaultMessage: 'You must complete the proctoring setup before you can start the exam.',
  },
  softwareLoadedModalTitle: {
    id: 'exam.ProctoringSoftwareDownloadedModal.title',
    defaultMessage: 'System Check Succeeded',
  },
  softwareLoadedModalBody: {
    id: 'exam.ProctoringSoftwareDownloadedModal.body',
    defaultMessage: 'Click "Start Exam" to proceed.',
  },
});

export default messages;
