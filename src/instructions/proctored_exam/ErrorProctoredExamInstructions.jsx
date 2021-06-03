import React, { useContext } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Hyperlink } from '@edx/paragon';
import ExamStateContext from '../../context';

const ErrorProctoredExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const { link_urls: linkUrls, platform_name: platformName } = state.proctoringSettings;
  const contactUsUrl = linkUrls && linkUrls.contact_us;

  return (
    <div>
      <div className="h3">
        <FormattedMessage
          id="exam.ErrorProctoredExamInstructions.title"
          defaultMessage="Error with proctored exam"
        />
      </div>
      <p className="mb-0">
        <FormattedMessage
          id="exam.ErrorProctoredExamInstructions.text1"
          defaultMessage={'A system error has occurred with your proctored exam. '
          + 'Please reach out to '}
        />
        <Hyperlink href={contactUsUrl}>
          {platformName}
        </Hyperlink>
        <FormattedMessage
          id="exam.ErrorProctoredExamInstructions.text2"
          defaultMessage={' for assistance, and return to the exam once you receive '
          + 'further instructions'}
        />
      </p>
    </div>
  );
};

export default ErrorProctoredExamInstructions;
