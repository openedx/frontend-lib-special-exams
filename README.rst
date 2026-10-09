##########################
frontend-lib-special-exams
##########################

*******
Purpose
*******
This is a react library responsible for extending learning app with special exams functionality, e.g. proctored/timed exams.

***************
Getting Started
***************

Installation
============

1. Clone your new repo:

  ``git clone https://github.com/edx/frontend-lib-special-exams.git``

2. Use node v12.x.

   Using other major versions of node *may* work, but is unsupported.  For convenience, this repository includes an .nvmrc file to help in setting the correct node version via `nvm <https://github.com/nvm-sh/nvm>`_.

3. Install npm dependencies:

  ``cd frontend-lib-special-exams && npm install``

*****
Setup
*****

The library takes what it needs from the host through ``SpecialExamsProvider``, mounted once above the
special exams components: the URLs it reads from the host's configuration, an HTTP client that
authenticates its requests, the host's error logger, and whether a user is signed in. A
frontend-platform host passes its own services:

.. code-block:: jsx

   import { getConfig } from '@edx/frontend-platform';
   import { getAuthenticatedHttpClient, getAuthenticatedUser } from '@edx/frontend-platform/auth';
   import { logError } from '@edx/frontend-platform/logging';
   import { SpecialExamsProvider } from '@edx/frontend-lib-special-exams';

   const config = {
     examsBaseUrl: getConfig().EXAMS_BASE_URL,
     lmsBaseUrl: getConfig().LMS_BASE_URL,
     siteName: getConfig().SITE_NAME,
     supportUrl: getConfig().SUPPORT_URL,
     contactUrl: getConfig().CONTACT_URL,
     proctoredExamFaqUrl: getConfig().PROCTORED_EXAM_FAQ_URL,
     proctoredExamRulesUrl: getConfig().PROCTORED_EXAM_RULES_URL,
   };

   <SpecialExamsProvider
     config={config}
     httpClient={getAuthenticatedHttpClient()}
     logError={logError}
     isAuthenticated={!!getAuthenticatedUser()}
   >
     <App />
   </SpecialExamsProvider>

``examsBaseUrl`` unset selects the LMS ``edx_proctoring`` endpoints; set, the edx-exams service. A
frontend-base host passes the equivalent values from its site configuration and runtime. The library
also expects ``react-intl``'s ``IntlProvider`` and ``@tanstack/react-query``'s ``QueryClientProvider``
above it, as both hosts already provide.

*******************
Build Process Notes
*******************

**Production Build**

The production build is created with ``npm run build``.

*********************
Internationalization
*********************

Messages are defined with `react-intl <https://formatjs.io/docs/react-intl/>`_ and extracted with ``make extract_translations``; the host provides the ``IntlProvider`` and the translations.

*******
Testing
*******

``@edx/frontend-lib-special-exams/testing`` ships a stateful mock of the special-exams backend for a consumer's Jest tests, built on `axios-mock-adapter <https://github.com/ctimmerm/axios-mock-adapter>`_. Register it before any catch-all handler, then describe each exam sequence with ``setExam``:

.. code-block:: js

   import MockAdapter from 'axios-mock-adapter';
   import { mockSpecialExams } from '@edx/frontend-lib-special-exams/testing';

   const axiosMock = new MockAdapter(httpClient); // the client given to SpecialExamsProvider
   const specialExams = mockSpecialExams(axiosMock, courseId, config); // the same config object
   specialExams.setExam(sequenceId, { status: 'started', exam: { time_limit_mins: 30 } });

It answers both URL families the library talks to: the LMS ``edx_proctoring`` endpoints under ``lmsBaseUrl``, and edx-exams when ``examsBaseUrl`` is set. Each sequence's attempt status carries across requests: POST creates an attempt, PUT applies its ``action``, polls count the time down from ``time_limit_mins``. Every request it answered is recorded in ``requests``. The payload builders it uses (``buildExam``, ``buildAttempt``, ``buildProctoringSettings``, ``buildExamAccessToken``) are exported as well.

*************
Customization
*************

``SequenceExamWrapper`` takes an optional ``submittedTimedExamInstructions`` component, rendered in
place of the default "You have submitted your timed exam." heading once a timed exam is submitted. It
receives ``timeIsOver``, true when the time limit forced the submission.

.. code-block:: jsx

    <SequenceExamWrapper sequence={sequence} courseId={courseId} submittedTimedExamInstructions={MyInstructions}>
      {sequenceContent}
    </SequenceExamWrapper>

************
Contributing
************

Contributions are very welcome.  Please read `How To Contribute`_ for details.

.. _How To Contribute: https://openedx.org/r/how-to-contribute

This project is currently accepting all types of contributions, bug fixes,
security fixes, maintenance work, or new features.  However, please make sure
to have a discussion about your new feature idea with the maintainers prior to
beginning development to maximize the chances of your change being accepted.
You can start a conversation by creating a new issue on this repo summarizing
your idea.

************
Getting Help
************

If you're having trouble, we have discussion forums at
https://discuss.openedx.org where you can connect with others in the community.

Our real-time conversations are on Slack. You can request a `Slack
invitation`_, then join our `community Slack workspace`_.  Because this is a
frontend repository, the best place to discuss it would be in the `#wg-frontend
channel`_.

For anything non-trivial, the best path is to open an issue in this repository
with as many details about the issue you are facing as you can provide.

https://github.com/openedx/frontend-lib-special-exams/issues

For more information about these options, see the `Getting Help`_ page.

.. _Slack invitation: https://openedx.org/slack
.. _community Slack workspace: https://openedx.slack.com/
.. _#wg-frontend channel: https://openedx.slack.com/archives/C04BM6YC7A6
.. _Getting Help: https://openedx.org/community/connect

****************************
The Open edX Code of Conduct
****************************

All community members are expected to follow the `Open edX Code of Conduct`_.

.. _Open edX Code of Conduct: https://openedx.org/code-of-conduct/

**************************
Reporting Security Issues
**************************

Please do not report security issues in public. Please email security@openedx.org.
