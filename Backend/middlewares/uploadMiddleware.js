const multer = require("multer");
const path = require("path");

// Destination folder for CV uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/cvs/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Accept PDF, DOCX only
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only PDF or DOCX files are allowed"));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
