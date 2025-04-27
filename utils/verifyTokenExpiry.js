const TokenExpiry = (req, res) => {
  const jwt = require("jsonwebtoken");

  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
  const JWT_SECRET = process.env.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // will throw if expired or invalid
    return {statusCode: 200, email: decoded.email, userId: decoded.userId, message: "Token is valid" };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.log("Token has expired");
      return { statusCode: 401, error: "our token has been expired" };
    } else {
      console.log("Invalid token");
      return{statusCode: 401, error: "Your token is Invalid" };
    }
  }
};

module.exports = { TokenExpiry };
