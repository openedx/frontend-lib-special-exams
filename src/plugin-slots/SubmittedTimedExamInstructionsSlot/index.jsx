import { useSelector } from 'react-redux';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { PluginSlot } from '@openedx/frontend-plugin-framework';

const SubmittedTimedExamInstructionsSlot = () => {
  const timeIsOver = useSelector(state => state.specialExams?.timeIsOver || false);

  return (
    <PluginSlot
      id="org.openedx.frontend.special_exams.submitted_timed_exam_instructions.v1"
      pluginProps={{ timeIsOver }}
    >
      <h3 className="h3" data-testid="exam.submittedExamInstructions.title">
        {timeIsOver
          ? (
            <FormattedMessage
              id="exam.submittedExamInstructions.overtimeTitle"
              defaultMessage="The time allotted for this exam has expired. Your exam has been submitted and any work you completed will be graded."
            />
          )
          : (
            <FormattedMessage
              id="exam.submittedExamInstructions.title"
              defaultMessage="You have submitted your timed exam."
            />
          )}
      </h3>
    </PluginSlot>
  );
};

export default SubmittedTimedExamInstructionsSlot;
