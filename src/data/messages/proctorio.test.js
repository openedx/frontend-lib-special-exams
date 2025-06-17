import { getConfig } from '@edx/frontend-platform';
import { checkAppStatus, notifyStartExam } from './proctorio';

jest.mock('@edx/frontend-platform', () => ({
  getConfig: jest.fn(),
}));

describe('proctorio', () => {
  let originalWindowTop;
  let postMessageMock;

  beforeEach(() => {
    // Save original window.top
    originalWindowTop = window.top;

    // Create a mock for window.top.postMessage
    postMessageMock = jest.fn();

    // Override window.top
    Object.defineProperty(window, 'top', {
      value: { postMessage: postMessageMock },
      writable: true,
      configurable: true, // Added trailing comma
    });

    // Mock addEventListener and removeEventListener
    jest.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'message') {
        // Immediately call the handler with the appropriate data
        setTimeout(() => {
          handler({
            origin: getConfig().EXAMS_BASE_URL,
            data: { active: true }, // Added trailing comma
          });
        }, 0);
      }
    });

    jest.spyOn(window, 'removeEventListener').mockImplementation();

    getConfig.mockReturnValue({
      EXAMS_BASE_URL: 'https://example.com',
    });
  });

  afterEach(() => {
    // Restore window.top
    Object.defineProperty(window, 'top', {
      value: originalWindowTop,
      writable: true,
      configurable: true, // Added trailing comma
    });

    // Restore all mocks
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('checkAppStatus', () => {
    it('should resolve when event.data.active is true', async () => {
      // Override the default implementation for this test
      window.addEventListener.mockImplementationOnce((event, handler) => {
        if (event === 'message') {
          setTimeout(() => {
            handler({
              origin: 'https://example.com',
              data: { active: true },
            });
          }, 0);
        }
      });

      await expect(checkAppStatus()).resolves.toBeUndefined();
      expect(window.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(postMessageMock).toHaveBeenCalledWith(['proctorio_status'], '*');
    });

    it('should reject when event.data.active is false', async () => {
      // Override the default implementation for this test
      window.addEventListener.mockImplementationOnce((event, handler) => {
        if (event === 'message') {
          setTimeout(() => {
            handler({
              origin: 'https://example.com',
              data: { active: false },
            });
          }, 0);
        }
      });

      await expect(checkAppStatus()).rejects.toBeUndefined();
      expect(window.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(postMessageMock).toHaveBeenCalledWith(['proctorio_status'], '*');
    });

    it('should reject when event.data is undefined', async () => {
      // Override the default implementation for this test
      window.addEventListener.mockImplementationOnce((event, handler) => {
        if (event === 'message') {
          setTimeout(() => {
            handler({
              origin: 'https://example.com',
              data: undefined,
            });
          }, 0);
        }
      });

      await expect(checkAppStatus()).rejects.toBeUndefined();
      expect(window.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(postMessageMock).toHaveBeenCalledWith(['proctorio_status'], '*');
    });

    it('should not respond to events from other origins', async () => {
      let messageHandler;

      // Override the default implementation for this test
      window.addEventListener.mockImplementationOnce((event, handler) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      });

      const promise = checkAppStatus();

      // Simulate a message event from a different origin
      messageHandler({
        origin: 'https://different-origin.com',
        data: { active: true },
      });

      // The promise should not be resolved or rejected yet
      expect(window.removeEventListener).not.toHaveBeenCalled();

      // Now simulate a message from the correct origin
      messageHandler({
        origin: 'https://example.com',
        data: { active: true },
      });

      await expect(promise).resolves.toBeUndefined();
      expect(window.removeEventListener).toHaveBeenCalledWith('message', messageHandler);
    });
  });

  describe('notifyStartExam', () => {
    it('should post a message to the top window', () => {
      notifyStartExam();
      expect(postMessageMock).toHaveBeenCalledWith(
        ['exam_state_change', 'exam_take'],
        '*', // Added trailing comma
      );
    });
  });
});
