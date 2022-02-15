import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  apiErrorDefault: {
    id: 'exam.apiError.default',
    defaultMessage: 'A system error has occurred with your exam.',
  },
  supportTextWithoutLink: {
    id: 'exam.apiError.supportText.withoutLink',
    defaultMessage: 'If the issue persists, please reach out to support for assistance, and return to the exam once you receive further instructions.',
  },
  proctoredExamAccessDenied: {
    id: 'exam.proctoredExamDenied',
    defaultMessage: 'You do not have access to proctored exams with your current enrollment.',
  },
});

export default messages;
