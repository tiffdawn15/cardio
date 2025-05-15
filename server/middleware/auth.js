// server/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT tokens
 * Verifies the token from Authorization header or cookies
 */
const authenticateToken = (req, res, next) => {
  // Get token from header or cookie
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  const tokenFromCookie = req.cookies && req.cookies.token;
  
  const token = tokenFromHeader || tokenFromCookie;
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId,
      username: decoded.username
    };
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(403).json({ message: 'Invalid token' });
  }
};

/**
 * Middleware to check if user has admin role on a board
 * Requires authenticateToken middleware to be used first
 */
const isBoardAdmin = async (req, res, next) => {
  const boardId = req.params.id || req.body.boardId;
  const userId = req.user.id;
  
  if (!boardId) {
    return res.status(400).json({ message: 'Board ID is required' });
  }
  
  try {
    const result = await req.db.query(
      `SELECT role FROM board_members 
       WHERE board_id = $1 AND user_id = $2`,
      [boardId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied: Not a board member' });
    }
    
    if (result.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin permission required' });
    }
    
    next();
  } catch (err) {
    console.error('Error checking board permissions:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Middleware to check if user has any level of access to a board
 * Requires authenticateToken middleware to be used first
 */
const isBoardMember = async (req, res, next) => {
  const boardId = req.params.boardId || req.body.boardId || req.params.id;
  const userId = req.user.id;
  
  if (!boardId) {
    return res.status(400).json({ message: 'Board ID is required' });
  }
  
  try {
    const result = await req.db.query(
      `SELECT * FROM board_members 
       WHERE board_id = $1 AND user_id = $2`,
      [boardId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied: Not a board member' });
    }
    
    // Add member role to request for potential use in later middleware
    req.boardMemberRole = result.rows[0].role;
    next();
  } catch (err) {
    console.error('Error checking board membership:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  authenticateToken,
  isboardAdmin: isboardAdmin,
  isBoardMember
};