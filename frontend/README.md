# Hotel Management UI

A modern hotel management dashboard and chatbot interface built with React and Tailwind CSS.

## Features

- **Admin Room Dashboard:** View, edit, and manage hotel rooms, including reservation dates, status, and notes.
- **Chat Assistant:** Ask questions about the hotel or rooms via an AI-powered chatbot (with fallback to demo mode if backend is unavailable).
- **Dark Mode:** Toggle between light and dark themes.
- **Responsive Design:** Works well on desktop and mobile devices.
- **Demo Mode:** If the backend is unreachable, the app displays and updates dummy data for a seamless demo experience.

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- npm

### Installation

```sh
npm install
```

### Running the App

```sh
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

```sh
npm test
```

### Building for Production

```sh
npm run build
```

## Project Structure

- `src/` — React components and logic
- `public/` — Static assets and HTML template
- `tailwind.config.js` — Tailwind CSS configuration

## Customization

- **API Endpoint:** Change `API_BASE_URL` in `src/apiService.js` to match your backend.
- **Dummy Data:** The app uses fallback dummy data if the backend is unavailable.

## License

This project is for demonstration and educational purposes.