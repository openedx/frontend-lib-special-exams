2. Library for emitting events
-------------------------------

Context
-------

During the investigation phase of the `JS messaging functionality https://github.com/edx/edx-proctoring/blob/master/docs/system-overview.rst#javascript-message-interface`_
we clearly see the need to implement Event Emitter pattern within the special exams library
in order for certain providers to be able to handle exam events in some way.

Additionaly, timer functionality is a good candidate to be event-driven component to reduce the amount of callbacks
passed to it to react on. Also, different exam types can have their own handlers to handle timer events.

Decision
--------

After considering the following options:

- custom event emitter implementation
- use existing event emitter library

the decision was made to use `eventemitter3 https://github.com/primus/eventemitter3`_ library.

Pros:

- this library is claimed as the fastest EventEmitter available for Node.js and browsers
- supports wide range of desktop and mobile browsers
- simple to use syntax and API
- ability to create custom events

Cons:

- can not be used with native js listeners

Consequences
------------

We are able to apply event-driven development practices now and in future development process.
