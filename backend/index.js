require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');

// Import models
const User = require('./models/User');
const Game = require('./models/Game');
const ActivationCode = require('./models/ActivationCode');
const Permission = require('./models/Permission');

const app = express();
app.use(cors());
app.use(express.json());

// --- Define Associations ---
// User-ActivationCode Association (One-to-Many)
User.hasMany(ActivationCode, { foreignKey: 'usedByUserId', as: 'usedCodes' });
ActivationCode.belongsTo(User, { foreignKey: 'usedByUserId', as: 'usedByUser' });

// Game-ActivationCode Association (One-to-Many)
Game.hasMany(ActivationCode, { foreignKey: 'gameId', as: 'activationCodes' });
ActivationCode.belongsTo(Game, { foreignKey: 'gameId', as: 'game' });

// User-Game Association (Many-to-Many through Permission)
User.belongsToMany(Game, { through: Permission, foreignKey: 'userId', as: 'games' });
Game.belongsToMany(User, { through: Permission, foreignKey: 'gameId', as: 'users' });

// Direct associations for Permission table
Permission.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Permission.belongsTo(Game, { foreignKey: 'gameId', as: 'game' });


// --- Routes ---
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const gameRoutes = require('./routes/game');
const activationRoutes = require('./routes/activation');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/activation', activationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve static game files
app.use('/games', express.static(path.join(__dirname, '../public/games')));

app.get('/', (req, res) => {
  res.send('Welcome to the Game Website API!');
});


// --- Database Synchronization ---
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }) // Use { force: true } to drop and re-create tables
  .then(() => {
    console.log('Database & tables created!');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });