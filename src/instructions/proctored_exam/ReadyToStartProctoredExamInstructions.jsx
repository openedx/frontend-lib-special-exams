import React, { useContext, useEffect } from 'react';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { Button, Container } from '@edx/paragon';
import ExamStateContext from '../../context';
import Footer from './Footer';

const ReadyToStartProctoredExamInstructions = () => {
  const state = useContext(ExamStateContext);
  const {
    exam,
    proctoringSettings,
    getExamReviewPolicy,
    continueExam,
  } = state;
  const { time_limit_mins: examDuration, reviewPolicy } = exam;
  const { link_urls: linkUrls, platform_name: platformName } = proctoringSettings;
  const rulesUrl = linkUrls && linkUrls.online_proctoring_rules;

  useEffect(() => {
    getExamReviewPolicy();
  }, []);

  return (
    <div>
      <Container className="border py-5 mb-4">
        <div className="h3" data-testid="exam-instructions-title">
          <FormattedMessage
            id="exam.ReadyToStartProctoredExamInstructions.title1"
            defaultMessage="Important"
          />
        </div>
        <ul>
          <li data-testid="duration-text">
            <FormattedMessage
              id="exam.ReadyToStartProctoredExamInstructions.text1"
              defaultMessage={'You have {examDuration} minutes to complete this exam.'}
              values={{ examDuration }}
            />
          </li>
          <li>
            <FormattedMessage
              id="exam.ReadyToStartProctoredExamInstructions.text2"
              defaultMessage="Once you start the exam, you cannot stop the timer."
            />
          </li>
          <li>
            <FormattedMessage
              id="exam.ReadyToStartProctoredExamInstructions.text3"
              defaultMessage='For all question types, you must click "submit" to complete your answer.'
            />
          </li>
          <li>
            <FormattedMessage
              id="exam.ReadyToStartProctoredExamInstructions.text4"
              defaultMessage='If time expires before you click "End My Exam", only your submitted answers will be graded.'
            />
          </li>
        </ul>
        <div className="h3">
          <FormattedMessage
            id="exam.ReadyToStartProctoredExamInstructions.title2"
            defaultMessage="Proctored Exam Rules"
          />
        </div>
        <p>
          <FormattedMessage
            id="exam.ReadyToStartProctoredExamInstructions.text5"
            defaultMessage="You must adhere to the following rules while you complete this exam."
          />
          &nbsp;
          <strong>
            <FormattedMessage
              id="exam.ReadyToStartProctoredExamInstructions.text6"
              defaultMessage={'If you violate these rules, you will receive a score of 0 '
              + 'on the exam, and you will not be eligible for academic course credit.'}
            />
          </strong>
          <br />
          <Button
            variant="link"
            target="_blank"
            href={rulesUrl}
            data-testid="proctored-exam-instructions-rulesLink"
          >
            <FormattedMessage
              id="exam.ReadyToStartProctoredExamInstructions.rulesLink"
              defaultMessage={'{platformName} Rules for Online Proctored Exams'}
              values={{ platformName }}
            />
          </Button>
        </p>
        {reviewPolicy && (
          <>
            <div className="h3">
              <FormattedMessage
                id="exam.ReadyToStartProctoredExamInstructions.title3"
                defaultMessage="Additional Exam Rules"
              />
            </div>
            <p>
              <FormattedMessage
                id="exam.ReadyToStartProctoredExamInstructions.text7"
                defaultMessage={'The following additional rules apply to this exam. '
                + 'These rules take precedence over the Rules for Online Proctored Exams.'}
              />
            </p>
            <p>
              {reviewPolicy}
            </p>
          </>
        )}
        <Button
          data-testid="start-exam-button"
          variant="primary"
          onClick={() => continueExam(false)}
        >
          <FormattedMessage
            id="exam.startExamInstructions.startExamButtonText"
            defaultMessage="Start exam"
          />
        </Button>
      </Container>
      <Footer />
    </div>
  );
};

export default ReadyToStartProctoredExamInstructions;
