import { Factory } from 'rosie'; // eslint-disable-line import/no-extraneous-dependencies

Factory.define('proctoringSettings')
  .attrs({
    platform_name: 'Your Platform Name Here',
    contact_us: 'info@example.com',
    link_urls: {
      contact_us: 'https://example.com/contact_us/',
      faq: 'https://example.com/faq/',
      online_proctoring_rules: 'https://example.com/online_proctoring_rules/',
      tech_requirements: 'https://example.com/tech_requirements/',
    },
    exam_proctoring_backend: {
      download_url: '',
      instructions: [],
      name: '',
      rules: {},
    },
    provider_tech_support_email: '',
    provider_tech_support_phone: '',
    provider_name: '',
    learner_notification_from_email: '',
    integration_specific_email: '',
  });
