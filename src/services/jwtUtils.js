const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    roleId: user.roleId,
    permissions: user.permissions
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
    roleId: user.roleId,
    permissions: user.permissions
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
