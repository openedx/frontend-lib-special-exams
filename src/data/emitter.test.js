import Emitter from './emitter';

describe('Emitter', () => {
  it('registers an event listener with on method', () => {
    const mockFn = jest.fn();
    Emitter.on('test-event', mockFn);

    Emitter.emit('test-event', { data: 'test' });

    expect(mockFn).toHaveBeenCalledWith({ data: 'test' });
  });

  it('registers a one-time event listener with once method', () => {
    const mockFn = jest.fn();
    Emitter.once('test-event-once', mockFn);

    Emitter.emit('test-event-once', { data: 'test1' });
    Emitter.emit('test-event-once', { data: 'test2' });

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith({ data: 'test1' });
  });

  it('removes an event listener with off method', () => {
    const mockFn = jest.fn();
    Emitter.on('test-event-off', mockFn);

    // First emission should trigger the listener
    Emitter.emit('test-event-off', { data: 'test1' });
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Remove the listener
    Emitter.off('test-event-off', mockFn);

    // Second emission should not trigger the listener
    Emitter.emit('test-event-off', { data: 'test2' });
    expect(mockFn).toHaveBeenCalledTimes(1); // Still only called once
  });

  it('emits events with data using emit method', () => {
    const mockFn = jest.fn();
    Emitter.on('test-event-emit', mockFn);

    Emitter.emit('test-event-emit', { data: 'test-emit' });

    expect(mockFn).toHaveBeenCalledWith({ data: 'test-emit' });
  });
});
