import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Searchbar from '../components/Homepage/SearchbarHomepage';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock the CitySearch component
jest.mock('../components/CitySearchBar', () => ({
  __esModule: true,
  default: ({ onSubmit }: { onSubmit: Function }) => (
    <div data-testid="city-search">
      <input 
        data-testid="city-input" 
        placeholder="Search for a city" 
      />
      <button 
        data-testid="submit-city" 
        onClick={() => onSubmit({ 
          name: 'Barcelona', 
          country: 'Spain', 
          lat: '41.3851', 
          lng: '2.1734' 
        })}
      >
        Submit City
      </button>
    </div>
  )
}));

// Mock the motion component from framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: React.PropsWithChildren<any>) => (
      <div className={className} data-testid="motion-div" {...props}>{children}</div>
    )
  }
}));

// Mock the carousel animation hook
jest.mock('@/animations/cards', () => ({
  useCarouselAnimation: jest.fn().mockReturnValue({}),
  cardVariants: {
    hidden: {},
    visible: {},
    hover: {}
  }
}));

// Mock the cities animation data
jest.mock('@/data/cities.json', () => ({
  cities: [
    {
      city: 'Paris',
      image_link: 'paris.jpg',
      lat: 48.8566,
      lng: 2.3522,
      country: 'France'
    }
  ]
}));

describe('Searchbar Component', () => {
  // Add a simple implementation of the component for testing
  it('renders basic elements without errors', () => {
    const { container } = render(
      <BrowserRouter>
        <Searchbar />
      </BrowserRouter>
    );
    
    // The test passes if no errors are thrown during rendering
    expect(container).toBeInTheDocument();
  });

  it('has a city search component', () => {
    render(
      <BrowserRouter>
        <Searchbar />
      </BrowserRouter>
    );
    
    // Check if the city search component is rendered
    expect(screen.getByTestId('city-search')).toBeInTheDocument();
  });

  it('navigates to POI page when a city is submitted', () => {
    render(
      <BrowserRouter>
        <Searchbar />
      </BrowserRouter>
    );
    
    // Simulate selecting and submitting a city
    fireEvent.click(screen.getByTestId('submit-city'));
    
    // Check if navigate was called with correct parameters
    expect(mockNavigate).toHaveBeenCalledWith('/poi', {
      state: {
        city: 'Barcelona',
        country: 'Spain',
        lat: '41.3851',
        lng: '2.1734'
      }
    });
  });
});
