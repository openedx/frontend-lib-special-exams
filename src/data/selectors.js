/*
Slice: activeAttempt, apiErrorMsg
In ExamStateProviders, needs to be moved to slice: showTimer,
Thunks, which need to be imported instead: stopExam, submitExam, expireExam, pollAttempt, pingAttempt, getLatestAttemptData,
*/

// TODO: Perhaps name the slice 'name:' var to 'currentExam',
// or change the one in frontend-app-exams-dashboard to 'examsList' or something.

/*
I got this error:

 OuterExamTimer › is successfully rendered and shows timer if there is an exam in progress

    TypeError: Cannot read properties of undefined (reading 'activeAttempt')

       7 | // TODO: Perhaps name the slice 'name:' var to 'currentExam',
       8 | // or change the one in frontend-app-exams-dashboard to 'examsList' or something.
    >  9 | export const activeAttempt = state => state.exam.activeAttempt;
         |                                                  ^
      10 | export const apiErrorMsg = state => state.exam.apiErrorMsg;
      11 | export const showTimer = state => state.exam.showTimer;

Why isn't the selector working?
*/
export const activeAttempt = state => state.examState.activeAttempt;
export const apiErrorMsg = state => state.examState.apiErrorMsg;
export const showTimer = state => state.examState.showTimer;

