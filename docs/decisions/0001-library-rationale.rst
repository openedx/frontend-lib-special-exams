1. Ideas behind the Special Exams library
-----------------------------------------

Special Exams library provides a set of components to enable users to pass exams in the learning micro-frontend application
`frontend-app-learning https://github.com/edx/frontend-app-learning`_.

The main exported component is `SequenceExamWrapper` and it serves as a proxy for the learning app sequence renderer
with the ability to take control over the rendering process and show exam-related content to users, e.g. exam instructions.

Usage example is

.. code-block:: javascript

    <LearningApp>  // Learning app
      ...
      <SequenceExamWrapper>
        ...
      </SpecialExamLib>
      ...
    </LearningApp>
