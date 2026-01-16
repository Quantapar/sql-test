import jwt from "jsonwebtoken";

export const validateToken = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, "admin", (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "UNAUTHORIZED",
      });
    }

    req.userId = decoded.userId;
    req.email = decoded.email;
    req.role = decoded.role;

    next();
  });
};
