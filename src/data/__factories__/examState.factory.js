import { Factory } from 'rosie'; // eslint-disable-line import/no-extraneous-dependencies

import './exam.factory';
import './proctoringSettings.factory';

Factory.define('examState')
  .attr('proctoringSettings', Factory.build('proctoringSettings'))
  .attr('exam', Factory.build('exam'))
  .attrs({
    isLoading: false,
    activeAttempt: null,
    verification: {
      status: 'none',
      can_verify: true,
    },
    timeIsOver: false,
    apiErrorMsg: '',
    allowProctoringOptOut: false,
  });
