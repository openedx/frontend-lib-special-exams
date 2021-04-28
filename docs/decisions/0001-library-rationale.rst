2. Ideas behind the Special Exams library
-----------------------------------------

Special Exams library provides set of components to enable users pass exams in the learning micro-fromtend application
(frontend-app-learning).

Main exported component is `SequenceExamWrapper` and it serves as a proxy for the learning app sequence renderer
with ability to take control over rendering process and show exam related content to users, e.g. exam instructions.

Usage example is

.. code-block:: javascript
    <LearningApp>  // Learning app store provider
      ...
      <SequenceExamWrapper>
        ...
      </SpecialExamLib>
      ...
    </LearningApp>
