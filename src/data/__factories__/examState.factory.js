import { Factory } from 'rosie'; // eslint-disable-line import/no-extraneous-dependencies

import './exam.factory';
import './proctoringSettings.factory';

Factory.define('examState')
  .attr('proctoringSettings', Factory.build('proctoringSettings'))
  .attr('exam', Factory.build('exam'))
  .attrs({
    isLoading: true,
    activeAttempt: null,
    verification: {},
    timeIsOver: false,
    apiErrorMsg: '',
  });
