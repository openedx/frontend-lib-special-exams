3. Handling of API errors
-------------------------

Context
-------
During the development of the library we realized that sometimes the backend API could fail
for some reason and we have to properly notify the user about it and show the error message,
so they could contact support to get it fixed.

Decision
--------
The decision was made to keep a separate field in our redux store for error messages. Each time
the API fails to respond with success status, the action is dispatched to populate the
field with an appropriate message which in turn gets rendered in the separate component
(located in src/exam/ExamAPIError.jsx).

Keeping the message in redux store allows for simple usage, all you need to do
is to add a catch block with error handler in it to the API call in your thunk function
and it will take care of rendering the error in case there is one.

The handler is located in src/data/thunks.js and looks as follows

.. code-block:: javascript

    function handleAPIError(error, dispatch) {
      const { message, detail } = error;
      dispatch(setApiError({ errorMsg: message || detail }));
    }
..

For example, to render an error which comes from the API directly you would do:

.. code-block:: javascript

    try {
      const data = await fetchExamReviewPolicy(exam.id);
    } catch (error) {
      handleAPIError(error, dispatch);
    }
..

if you want to render custom message:

.. code-block:: javascript

    try {
      const data = await fetchExamReviewPolicy(exam.id);
    } catch (error) {
      handleAPIError({ message: 'Your custom error message' }, dispatch);
    }
..