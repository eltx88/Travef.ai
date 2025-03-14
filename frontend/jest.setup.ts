import '@testing-library/jest-dom'

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      // Add other matchers as needed
    }
  }
}

// Remove global mocks from here - they should be in each test file
