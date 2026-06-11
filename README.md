Climb

Climb is a full-stack web application designed to help users discover, explore, and save hiking trails. Users can browse routes, filter them by different criteria, view detailed information, leave reviews, and manage their favorite trails through a personal account.

Features

* Browse a collection of hiking trails
* Search trails by keywords
* Filter trails by difficulty level
* Filter trails by distance
* View detailed trail information
* Explore trail photos
* Leave ratings and reviews
* User registration and login
* Save and manage favorite trails
* Change account password
* Responsive and modern user interface

Tech Stack

Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS
* Shadcn/UI
* Axios
* MapLibre GL
* Sonner

Backend

* NestJS 11
* TypeScript
* Express
* Class Validator
* Class Transformer
* UUID

DevOps

* Docker
* Docker Compose

Project Structure

```
climb/
├── frontend/     # Next.js frontend
├── backend/      # NestJS API
└── docker-compose.yml
```

Getting Started

Requirements

* Node.js 20+
* npm
* Docker (optional)

Installation

Clone the repository:

```bash
git clone https://github.com/stasp4187/climb.git
cd climb
```

Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at:

```
http://localhost:3000
```

Backend Setup

```bash
cd backend
npm install
npm run start:dev
```

Backend API will be available at:

```
http://localhost:3001
```

Docker

Run the entire application using Docker Compose:

```bash
docker-compose up --build
```

API Endpoints

Authentication

* POST `/api/auth/login`
* POST `/api/auth/register`
* POST `/api/auth/check-email`
* POST `/api/auth/toggle-save`
* POST `/api/auth/change-password`

Trails

* GET `/api/trails`
* GET `/api/trails/:idOrSlug`
* GET `/api/trails/:idOrSlug/photos`
* POST `/api/trails/:idOrSlug/reviews`

Future Improvements

* JWT authentication
* Database integration
* User profile editing
* Trail creation by users
* Interactive maps with route tracking
* Image uploads
* Admin panel

## Author

Created by Stas Popovych.

GitHub: https://github.com/stasp4187
