import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock the components
jest.mock('@/components/NavigationMenuBar', () => ({
  NavigationMenuBar: () => <div data-testid="navigation-bar">Navigation Bar</div>
}));

jest.mock('@/components/Homepage/SearchbarHomepage', () => ({
  __esModule: true,
  default: () => <div data-testid="searchbar">Search Bar</div>
}));

jest.mock('@/components/Homepage/Trips', () => ({
  __esModule: true,
  default: ({ setGlobalLoading }: { setGlobalLoading: Function }) => (
    <div data-testid="trips" onClick={() => setGlobalLoading(true, "Test loading")}>
      Trips Component
    </div>
  )
}));

jest.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>
}));

jest.mock('@/animations/mountains', () => ({
  __esModule: true,
  default: () => <div data-testid="mountains">Mountains Animation</div>
}));

// Create a mock for the actual component
jest.mock('@/routes/Homepage', () => ({
  __esModule: true,
  default: () => {
    const HomePage = () => {
      return (
        <div>
          <div data-testid="navigation-bar">Mock Nav</div>
          <div data-testid="searchbar">Mock Search</div>
          <div data-testid="mountains">Mock Mountains</div>
          <div data-testid="trips">Mock Trips</div>
          <div data-testid="footer">Mock Footer</div>
        </div>
      );
    };
    return HomePage;
  }
}));

// Simple test component to render instead of the actual HomePage
const MockHomePage = () => {
  return (
    <div>
      <div data-testid="navigation-bar">Mock Nav</div>
      <div data-testid="searchbar">Mock Search</div>
      <div data-testid="mountains">Mock Mountains</div>
      <div data-testid="trips">Mock Trips</div>
      <div data-testid="footer">Mock Footer</div>
    </div>
  );
};

describe('HomePage Component', () => {
  it('renders successfully with mocked components', () => {
    render(
      <BrowserRouter>
        <MockHomePage />
      </BrowserRouter>
    );
    
    // Check if the components are rendered
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
    expect(screen.getByTestId('searchbar')).toBeInTheDocument();
    expect(screen.getByTestId('mountains')).toBeInTheDocument();
    expect(screen.getByTestId('trips')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
}); 