const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { permissionBasedAuthorization } = require('../config');

async function authenticate(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized - Missing token' });
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized - Invalid Authorization header format' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    // Add user and permissions to the request for later use
    req.user = decoded;
    req.permissions = decoded.permissions;
    // Optional: Check if specific permissions are required for this route
    if (req.requiredPermissions && permissionBasedAuthorization) {
      const hasPermissions = req.requiredPermissions.every(permission =>
        req.permissions.includes(permission)
      );

      if (!hasPermissions) {
        return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      } 
    }

    next();
  } catch (error) {
    
    return res.status(401).json({ error: error.message });
  }
}

module.exports = authenticate;
