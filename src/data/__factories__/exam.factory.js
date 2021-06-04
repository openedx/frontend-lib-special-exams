import { Factory } from 'rosie'; // eslint-disable-line import/no-extraneous-dependencies

import './attempt.factory';

Factory.define('exam')
  .attr('attempt', {})
  .attr('prerequisite_status', {
    are_prerequisites_satisifed: true,
    satisfied_prerequisites: [],
    failed_prerequisites: [],
    pending_prerequisites: [],
    declined_prerequisites: [],
  })
  .attrs({
    id: 1,
    exam_name: 'prock exam',
    course_id: 'course-v1:test+special+exam',
    content_id: 'block-v1:test+special+exam+type@sequential+block@abc123',
    external_id: null,
    time_limit_mins: 30,
    is_proctored: false,
    is_practice_exam: false,
    is_active: true,
    type: 'timed',
    due_date: null,
    hide_after_due: false,
    backend: 'test',
  });
