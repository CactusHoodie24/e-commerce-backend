import jwt from 'jsonwebtoken'

const authenticateuser = (req, res, next) => {
 const token = req.cookies.token; // read HttpOnly cookie

  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
};

export default authenticateuser