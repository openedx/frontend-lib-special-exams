import { Factory } from 'rosie'; // eslint-disable-line import/no-extraneous-dependencies

Factory.define('attempt')
  .attrs({
    attempt_id: 1,
    attempt_status: 'started',
    in_timed_exam: true,
    taking_as_proctored: false,
    exam_type: 'a timed exam',
    exam_display_name: 'timed',
    exam_url_path: 'http://localhost:2000/course/course-v1:test+special+exam/block-v1:test+special+exam+type@sequential+block@abc123',
    time_remaining_seconds: 1799.9,
    course_id: 'course-v1:test+special+exam',
    accessibility_time_string: 'you have 30 minutes remaining',
    exam_started_poll_url: '/api/edx_proctoring/v1/proctored_exam/attempt/1',
    desktop_application_js_url: '',
    attempt_code: '',
    software_download_url: '',
    total_time: '30 minutes',
  });
