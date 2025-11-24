const db = require("../src/config/database");
const jwt = require("jsonwebtoken");

exports.getFeedbacks = async (req, res) => {
  try {
    // ✅ 1. Get token from Authorization header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token missing" });

    // ✅ 2. Verify token and decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded JWT:", decoded); 

    const applicantId = decoded.id; 
    if (!applicantId) return res.status(400).json({ error: "Applicant ID missing in token" });

    // ✅ 3. Query feedbacks for this applicant
    const [rows] = await db.execute(
      "SELECT id, title, submitted_time, score, rating, status FROM feedbacks WHERE applicant_id = ?",
      [applicantId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error in getFeedbacks:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
