import '@testing-library/jest-dom';

// Mock for IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor(callback: IntersectionObserverCallback) {
    // Store the callback for later use
    this.callback = callback;
  }
  
  private callback: IntersectionObserverCallback;
  
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  
  // Helper to simulate an intersection
  simulateIntersection(isIntersecting: boolean) {
    this.callback([{
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: {} as DOMRectReadOnly,
      isIntersecting,
      rootBounds: null,
      target: {} as Element,
      time: Date.now()
    }], this as unknown as IntersectionObserver);
  }
}

// Apply the mock
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock scrollTo
window.scrollTo = jest.fn(); 