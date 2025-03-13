import '@testing-library/jest-dom';

describe('Basic Jest Setup', () => {
  it('should pass a basic test', () => {
    expect(2 + 2).toBe(4);
  });

  it('has jest-dom extensions working', () => {
    document.body.innerHTML = '<div data-testid="test-div">Test Content</div>';
    
    const element = document.querySelector('[data-testid="test-div"]');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Test Content');
  });
}); 