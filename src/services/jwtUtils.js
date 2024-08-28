const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user?.role,
    permissions: user.permissions,
    restaurantId: user.restaurantId
  };

  const options = {
    expiresIn: '1d',
  };

  return jwt.sign(payload, jwtSecret, options);
}

function generateRefreshToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user?.role,
    permissions: user.permissions,
    restaurantId: user.restaurantId
  };

  const options = {
    expiresIn: '2d',
  };

  return jwt.sign(payload, jwtSecret, options);
}


function getSecretKey(){
  return jwtSecret;
}

module.exports = {
  generateToken,
  getSecretKey,
  generateRefreshToken
};
