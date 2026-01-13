# GigFlow - Freelance Marketplace Platform

A modern full-stack freelance marketplace built with Node.js, Express, MongoDB, and React.

## Features

- **User Authentication**: JWT-based authentication for clients and freelancers
- **Gig Management**: Create, browse, and manage freelance projects
- **Bidding System**: Freelancers can submit bids on projects
- **Secure Hiring**: MongoDB transactions ensure race-condition-free hiring
- **Advanced Search**: Filter gigs by category, budget, skills, and more
- **Responsive Design**: Modern UI built with React and Tailwind CSS

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Express Validator** for input validation
- **Rate Limiting** for API protection

### Frontend
- **React** with React Router
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Context API** for state management

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gigflow
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env if needed (default API URL is http://localhost:5000)
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gigflow
JWT_SECRET=your_super_secure_jwt_secret_key
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Gigs
- `GET /api/gigs` - Get all gigs with search/filter
- `GET /api/gigs/:id` - Get single gig
- `POST /api/gigs` - Create new gig (Client only)
- `PUT /api/gigs/:id` - Update gig (Owner only)
- `DELETE /api/gigs/:id` - Delete gig (Owner only)
- `GET /api/gigs/my/posted` - Get user's posted gigs

### Bids
- `GET /api/bids` - Get all bids
- `POST /api/bids` - Submit new bid (Freelancer only)
- `GET /api/bids/my/submitted` - Get user's submitted bids
- `PUT /api/bids/:bidId/hire` - Hire freelancer (Client only)

## Search & Filtering

The gig search supports multiple parameters:

```javascript
// Example search request
GET /api/gigs?search=react&category=web-development&minBudget=500&maxBudget=2000&skills=react,javascript&sortBy=createdAt&sortOrder=desc&page=1&limit=10
```

**Available Filters:**
- `search` - Text search in title and description
- `category` - Filter by category
- `minBudget` / `maxBudget` - Budget range filter
- `skills` - Comma-separated skills filter
- `sortBy` - Sort field (createdAt, budget.min, budget.max, deadline, title)
- `sortOrder` - Sort direction (asc, desc)
- `page` / `limit` - Pagination

## User Roles

### Client
- Post gigs
- Review and hire freelancers
- Manage posted projects

### Freelancer
- Browse available gigs
- Submit bids on projects
- Manage submitted proposals

## Security Features

- **JWT Authentication** with secure token handling
- **Input Validation** using Express Validator
- **Rate Limiting** to prevent abuse
- **MongoDB Transactions** for data consistency
- **Race Condition Protection** in hiring process
- **CORS** configuration for cross-origin requests

## Project Structure

```
gigflow/
├── backend/
│   ├── config/          # Database configuration
│   ├── constants/       # Application constants
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── frontend/
│   ├── public/          # Static assets
│   └── src/
│       ├── components/  # Reusable components
│       ├── constants/   # Frontend constants
│       ├── context/     # React context
│       ├── pages/       # Page components
│       ├── services/    # API client
│       └── main.jsx     # Entry point
└── README.md
```

## Testing

The project includes comprehensive tests for validating concurrent transaction functionality:

```bash
# Setup test data
cd backend
node tests/setup-test-data.js

# Test race condition protection
node tests/concurrency-test.js

# Run load testing
node tests/load-test.js
```

**Key Testing Features:**
- **Concurrent request simulation** - validates race condition protection
- **Load testing** - ensures system stability under pressure  
- **MongoDB transaction validation** - verifies ACID compliance
- **Automated test data setup** - creates users, gigs, and bids

See `backend/tests/README.md` for detailed testing documentation.

## Development

### Running in Development Mode

**Backend:**
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

**Frontend:**
```bash
cd frontend
npm run dev  # Uses Vite dev server
```

### Code Quality

The project follows these conventions:
- **ESLint** for code linting
- **Prettier** for code formatting
- **JSDoc** comments for functions
- **Consistent naming** conventions
- **Error handling** patterns

## Deployment

### Backend Deployment
1. Set production environment variables
2. Use PM2 or similar process manager
3. Configure reverse proxy (nginx)
4. Enable HTTPS

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Update API URL in environment variables

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check MongoDB connection string
- Verify all environment variables are set
- Ensure port 5000 is available

**Frontend can't connect to API:**
- Verify VITE_API_URL in .env
- Check if backend is running
- Verify CORS configuration

**Authentication issues:**
- Check JWT secret configuration
- Verify token storage in localStorage
- Check token expiration

### Database Issues

**Connection errors:**
- Verify MongoDB Atlas IP whitelist
- Check username/password in connection string
- Ensure database name is correct

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.