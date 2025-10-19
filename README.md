# 🍋 Lemonade Stand Business Simulation Game

A comprehensive business simulation game where players manage a lemonade stand empire. Make strategic decisions about recipes, pricing, locations, upgrades, and more to build a thriving business!

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Game](#running-the-game)
- [Game Overview](#game-overview)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## ✨ Features

- **Strategic Recipe Management**: Create lemonade batches with varying ingredient ratios
- **Container Reuse System**: Combine and reuse containers up to 3 times
- **Dynamic Pricing**: Adjust prices based on market conditions and customer demand
- **Multiple Locations**: Unlock and sell at different locations with unique characteristics
- **Weather System**: Adapt to changing weather conditions that affect sales
- **Random Events**: Navigate conventions, stadium events, downtown festivals, and heatwaves
- **Upgrade System**: Purchase permanent and temporary upgrades to boost your business
- **Tips Savings Account**: Earn 2.5% daily compound interest on saved tips
- **Inventory Management**: Track ingredients, containers, and lemonade batches
- **Multi-Game Slots**: Run up to 3 separate game saves simultaneously

## 🛠 Tech Stack

### Backend
- **Ruby on Rails 8.0** - API backend
- **PostgreSQL** - Database
- **BCrypt** - Password hashing

### Frontend
- **React** - UI framework
- **React Router** - Client-side routing
- **CSS3** - Custom styling with gradients and animations

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Ruby** 3.2.0 or higher
- **Rails** 8.0 or higher
- **Node.js** 16.x or higher
- **npm** 8.x or higher
- **PostgreSQL** 14.x or higher

### Check Your Versions

```bash
ruby -v
rails -v
node -v
npm -v
psql --version
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/lemonade-game.git
cd lemonade-game
```

### 2. Backend Setup

```bash
cd lemonade-backend

# Install Ruby dependencies
bundle install

# Configure database
# Edit config/database.yml with your PostgreSQL credentials

# Create and setup database
rails db:create
rails db:migrate

# Optional: Load seed data
rails db:seed
```

### 3. Frontend Setup

```bash
cd ../lemonade-frontend

# Install Node dependencies
npm install
```

## 🎮 Running the Game

You'll need to run both the backend and frontend servers simultaneously.

### Start the Backend Server

```bash
cd lemonade-backend
rails server
```

The Rails API will run on `http://localhost:3000`

### Start the Frontend Server

Open a new terminal window:

```bash
cd lemonade-frontend
npm start
```

The React app will run on `http://localhost:3001` and automatically open in your browser.

## 🎯 Game Overview

For detailed game mechanics, strategies, and flow diagrams, see [GAME_OVERVIEW.md](GAME_OVERVIEW.md).

### Quick Start

1. **Register** a new account with a unique username
2. **Select** a game slot (1, 2, or 3)
3. **Visit Kitchen** to create lemonade batches
4. **Go Shopping** for ingredients and upgrades
5. **Visit Locations** to sell your lemonade
6. **Manage Finances** in the Home Office
7. **Advance Days** to progress through the season

## 📁 Project Structure

```
lemonade-game/
├── lemonade-backend/          # Rails API
│   ├── app/
│   │   ├── controllers/       # API endpoints
│   │   │   └── api/          # Namespaced API controllers
│   │   ├── models/           # ActiveRecord models
│   │   └── ...
│   ├── config/
│   │   ├── routes.rb         # API routes
│   │   └── database.yml      # Database configuration
│   └── db/
│       ├── migrate/          # Database migrations
│       └── seeds.rb          # Seed data
│
└── lemonade-frontend/         # React App
    ├── public/               # Static files
    └── src/
        ├── components/       # React components
        │   ├── Auth/        # Login/Register
        │   └── Game/        # Game screens
        ├── constants/       # Game configuration
        ├── styles/          # CSS files
        └── utils/           # Helper functions
```

## 🗃 Database Schema

### Players Table
- `username` (primary key, unique)
- `password_digest` (hashed)
- `email` (optional)

### Games Table
- `player_username` (foreign key)
- `slot_number` (1, 2, or 3)
- `game_data` (JSONB - stores entire game state)

## 🔧 Configuration

### Backend Configuration

Edit `lemonade-backend/config/database.yml`:

```yaml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  username: your_postgres_username
  password: your_postgres_password
  host: localhost

development:
  <<: *default
  database: lemonade_backend_development
```

### Frontend Configuration

The frontend is configured to connect to `http://localhost:3000` by default. If your backend runs on a different port, update the API base URL in the frontend code.

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL if needed
sudo service postgresql start
```

### Port Conflicts

If port 3000 or 3001 is already in use:

```bash
# Backend: Specify a different port
rails server -p 3002

# Frontend: React will prompt you to use a different port
# Or set PORT environment variable
PORT=3003 npm start
```

### Migration Errors

```bash
# Reset database (WARNING: destroys all data)
rails db:drop db:create db:migrate
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🎮 Have Fun!

Enjoy building your lemonade empire! For questions or issues, please open an issue on GitHub.
