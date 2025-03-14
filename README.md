# Travefai - AI Travel Planner

## Overview

Travefai is a comprehensive travel planning application that helps users discover attractions, create personalized itineraries, and manage their trips. The application consists of a React TypeScript frontend and a FastAPI Python backend with Firebase integration.

## Frontend

### Key Features

- **Interactive Trip Planner**: Create and visualize day-by-day itineraries with an intuitive drag-and-drop interface
- **Points of Interest Discovery**: Explore attractions, restaurants, and cafes with filtering options
- **Map Integration**: Interactive maps showing saved locations and points of interest
- **Smart Scheduling**: Time-based visualization of daily activities
- **Rating & Reviews**: View ratings and reviews for attractions and restaurants
- **City Exploration**: Browse popular destinations and discover new travel spots
- **User Authentication**: Secure login and user profile management

### Technologies Used

- **React**: Frontend library for building user interfaces
- **TypeScript**: Type-safe JavaScript for improved developer experience
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Mapbox**: Interactive maps and location services
- **ShadCN/UI**: Component library for consistent design elements
- **React Router**: Client-side routing
- **FastAPI**: REST APIs

## Backend Services

- **Points of Interest (POI) Management**: Store, retrieve, and manage attractions, restaurants, hotels, and other places of interest.
- **User History**: Track and manage users' saved places and trips.
- **Location-Based Services**: Fetch nearby places and attractions using Geoapify and Google Places APIs.
- **Trip Generation**: Automatically generate optimized travel itineraries based on user preferences.
- **AI-Powered Recommendations**: Using Groq API for intelligent itinerary suggestions.
- **Authentication**: Secure Firebase-based authentication system.

### API Services

- **POI Service**: CRUD operations for points of interest
- **User History Service**: Save/unsave places, track trip history
- **Google Places Service**: Fetch place data from Google Places API
- **Trip Service**: Create, update, and manage trip itineraries
- **Trip Generation Service**: AI-powered trip planning
- **Groq Service**: AI conversation for travel recommendations

## Installation

### Prerequisites

- Node.js 16+
- Python 3.8+
- Firebase account with a project set up
- API keys for:
  - Google Places API
  - Groq API
  - Mapbox API

### Backend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd travefai
   ```

2. Create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables by creating a `.env` file in the backend directory:
   ```
   FIREBASE_TYPE=service_account
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="your-private-key"
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_CERT_URL=your-client-cert-url
   FIREBASE_UNIVERSE_DOMAIN=googleapis.com
   
   GEOAPIFY_API_KEY=your-geoapify-api-key
   GROQ_API_KEY=your-groq-api-key
   GOOGLE_PLACES_API_KEY=your-google-places-api-key
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-firebase-app-id
   VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-access-token
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The React application will be available at `http://localhost:5173`.

## API Endpoints

### POI Endpoints
- `POST /api/points/saved/details`: Get details for saved points
- `POST /api/points/CreateGetPOI`: Create or get a point of interest

### User History Endpoints
- `GET /api/user/history/saved-pois`: Get saved POIs
- `POST /api/user/history/saved-pois`: Save a POI
- `PUT /api/user/history/saved-pois/unsave`: Unsave POIs
- `POST /api/user/history/saved-trips/{trip_doc_id}`: Save a trip to history
- `GET /api/user/history/saved-trips`: Get all saved trips

### Trip Endpoints
- `POST /api/trip/create`: Create a new trip
- `GET /api/trip/details/{trip_doc_id}`: Get trip details
- `PUT /api/trip/update/{trip_doc_id}`: Update a trip
- `DELETE /api/trip/delete-with-history/{trip_doc_id}`: Delete a trip and its history

### Trip Generation Endpoints
- `POST /api/tripgeneration/generate`: Generate a trip itinerary

### Google Places Endpoints
- `GET /api/googleplaces/nearby`: Get nearby places
- `GET /api/googleplaces/details/{place_id}`: Get place details
- `POST /api/googleplaces/batch_details`: Get details for multiple places
- `GET /api/googleplaces/explore`: Get explore places
- `GET /api/googleplaces/textsearch`: Search for places by text

### Geoapify Endpoints
- `GET /api/geoapify/places`: Get places from Geoapify

### Chat Endpoints
- `POST /api/chat/completion`: Get AI-powered trip recommendations

## Dependencies

The main dependencies for this project are:
- FastAPI: Web framework
- Firebase Admin: Firebase integration
- Groq: AI model integration
- httpx: HTTP client for async requests
- Pydantic: Data validation
- uvicorn: ASGI server

For a complete list, see the requirements.txt file.

## Authentication

The API uses Firebase authentication. To access protected endpoints, include a valid Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Development

### Backend Development

To run the server in development mode with hot reloading:

```bash
uvicorn main:app --reload --port 8000
```

### Frontend Development

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The React development server will start at `http://localhost:5173`.
```

## Features

### Trip Itinerary Planner
The itinerary planner provides an intuitive calendar-like interface where users can:
- View a day-by-day timeline of their planned activities
- See time slots for attractions, restaurants, and cafes
- Get details including opening hours, ratings, and contact information
- Export their itinerary as a PDF
- Save and edit their travel plans

### Points of Interest Explorer
The POI explorer allows users to:
- Browse attractions, restaurants, and cafes on an interactive map
- Filter places by category, rating, and other criteria
- View detailed information about each place
- Save favorite places for later use in itineraries
- See user ratings and reviews

### AI-Powered Trip Generation
- Creates optimized itineraries based on user preferences
- Considers travel time between locations
- Balances different types of activities throughout the day
- Recommends local favorites and hidden gems
- Adapts plans based on available time and interests

## Notes
- Make sure to keep your API keys and Firebase credentials secure.
