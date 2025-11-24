const db = require("../src/config/database"); 
const cloudinary = require("../src/config/cloudinary");
const pdf = require('pdf-parse'); 
const mammoth = require('mammoth'); 
const path = require("path");
const fs = require("fs");
const translationService = require('../services/translationService');

async function ensureApplicantArabicFields(data) {
  const fields = ['title', 'bio'];
  
  for (const field of fields) {
    const arField = `${field}_ar`;
    
    if (!data[arField] && data[field]) {
      console.log(`🔄 Translating ${field} to Arabic...`);
      data[arField] = await translationService.translateToArabic(data[field]);
    }
  }
  
  return data;
}

// Update applicant profile 
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let {
      title,
      title_ar,
      bio,
      bio_ar,
      location,
      preferred_language,
      years_of_experience,
      availability,
    } = req.body;

    // 🔥 Ensure Arabic fields exist
    const profileData = await ensureApplicantArabicFields({
      title, title_ar, bio, bio_ar
    });

    const [result] = await db.query(
      `UPDATE applicant_profiles 
       SET title = ?, title_ar = ?, bio = ?, bio_ar = ?, location = ?, 
           preferred_language = ?, years_of_experience = ?, availability = ?, 
           updated_at = NOW()
       WHERE user_id = ?`,
      [
        profileData.title,
        profileData.title_ar,
        profileData.bio,
        profileData.bio_ar,
        location,
        preferred_language,
        years_of_experience,
        availability,
        userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Applicant profile not found" });
    }

    res.json({ message: "Profile updated successfully in both languages!" });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get applicant profile 
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const lang = req.language || 'en';

    const [rows] = await db.query(
      `SELECT 
          u.id AS user_id,
          u.full_name,
          u.email,
          u.profile_picture,
          u.user_type,
          u.preferred_language,
          ${lang === 'ar' ? 'COALESCE(a.title_ar, a.title)' : 'a.title'} as title,
          ${lang === 'ar' ? 'COALESCE(a.bio_ar, a.bio)' : 'a.bio'} as bio,
          a.location,
          a.preferred_language,
          a.years_of_experience,
          a.availability,
          a.cv_file_path,     
          a.cv_uploaded_at, 
          a.updated_at
       FROM users u
       JOIN applicant_profiles a ON u.id = a.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({ profile: rows[0], language: lang });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Upload to Cloudinary
    const uploadToCloudinary = (fileBuffer) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "applicant_profiles" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(fileBuffer);
      });

    const result = await uploadToCloudinary(req.file.buffer);
    const profilePicUrl = result.secure_url;

    // Update database
    await db.query("UPDATE users SET profile_picture = ? WHERE id = ?", [
      profilePicUrl,
      userId,
    ]);

    res.json({ message: "Profile picture updated", profile_picture: profilePicUrl });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Server error" });
  }

};

// Upload CV
exports.uploadCV = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Save file locally
    const uploadsDir = path.join(__dirname, "../uploads/cvs");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const uniqueName = Date.now() + "-" + req.file.originalname;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, req.file.buffer);

    // Extract text based on file type
    let extractedText = '';
    const mimeType = req.file.mimetype;

    try {
      if (mimeType === 'application/pdf') {
        // Extract from PDF
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(dataBuffer);
        extractedText = pdfData.text;
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Extract from DOCX
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value;
      } else if (mimeType === 'text/plain') {
        // Plain text file
        extractedText = fs.readFileSync(filePath, 'utf8');
      } else {
        extractedText = 'Unsupported file format for text extraction';
      }
    } catch (extractErr) {
      console.error('Text extraction error:', extractErr);
      extractedText = 'Error extracting text from file';
    }

    // Get applicant ID
    const [applicantRows] = await db.query(
      'SELECT id FROM applicant_profiles WHERE user_id = ?',
      [userId]
    );

    if (applicantRows.length === 0) {
      return res.status(404).json({ error: 'Applicant profile not found' });
    }

    const applicantId = applicantRows[0].id;

    // Save relative path
    const relativePath = `/uploads/cvs/${uniqueName}`;
    
    // Update applicant_profiles
    await db.query(
      "UPDATE applicant_profiles SET cv_file_path = ?, cv_uploaded_at = NOW() WHERE user_id = ?",
      [relativePath, userId]
    );

    // Insert into cv_documents with parsed text
    await db.query(
      `INSERT INTO cv_documents
        (applicant_id, file_name, file_path, file_size, mime_type, language, parsed_text, is_active, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        applicantId,
        req.file.originalname,
        relativePath,
        req.file.size,
        req.file.mimetype,
        req.body.language || "en",
        extractedText
      ]
    );

    res.json({ 
      message: "CV uploaded and parsed successfully", 
      filePath: relativePath,
      textExtracted: extractedText.length > 0
    });
  } catch (err) {
    console.error("Error uploading CV:", err);
    res.status(500).json({ error: "Failed to upload CV" });
  }
};

// Re-parse existing CVs 
exports.reParseCV = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get applicant ID
    const [applicantRows] = await db.query(
      'SELECT id FROM applicant_profiles WHERE user_id = ?',
      [userId]
    );

    if (applicantRows.length === 0) {
      return res.status(404).json({ error: 'Applicant profile not found' });
    }

    const applicantId = applicantRows[0].id;

    // Get all CVs with empty parsed_text
    const [cvDocs] = await db.query(
      `SELECT id, file_path, mime_type 
       FROM cv_documents 
       WHERE applicant_id = ? AND (parsed_text IS NULL OR parsed_text = '')`,
      [applicantId]
    );

    if (cvDocs.length === 0) {
      return res.json({ message: 'No CVs need re-parsing', parsed: 0 });
    }

    let parsedCount = 0;

    for (const doc of cvDocs) {
      try {
        const fullPath = path.join(__dirname, '..', doc.file_path);
        
        if (!fs.existsSync(fullPath)) {
          console.log(`File not found: ${fullPath}`);
          continue;
        }

        let extractedText = '';

        if (doc.mime_type === 'application/pdf') {
          const dataBuffer = fs.readFileSync(fullPath);
          const pdfData = await pdf(dataBuffer);
          extractedText = pdfData.text;
        } else if (doc.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const result = await mammoth.extractRawText({ path: fullPath });
          extractedText = result.value;
        } else if (doc.mime_type === 'text/plain') {
          extractedText = fs.readFileSync(fullPath, 'utf8');
        }

        if (extractedText) {
          await db.query(
            'UPDATE cv_documents SET parsed_text = ? WHERE id = ?',
            [extractedText, doc.id]
          );
          parsedCount++;
        }
      } catch (err) {
        console.error(`Error parsing CV ${doc.id}:`, err);
      }
    }

    res.json({ 
      message: `Successfully re-parsed ${parsedCount} CV(s)`,
      parsed: parsedCount,
      total: cvDocs.length
    });

  } catch (err) {
    console.error('Error re-parsing CVs:', err);
    res.status(500).json({ error: 'Failed to re-parse CVs' });
  }
};

// Update applicant skills 
exports.updateSkills = async (req, res) => {
  const userId = req.user.id;
  const { skills } = req.body; 
  // Expecting array like:
  // [{ skill_id: 1, proficiency_level: "advanced", years_of_experience: 2.5 }, ...]

  if (!Array.isArray(skills)) {
    return res.status(400).json({ error: "Invalid skills format" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get applicant ID
    const [applicantRows] = await conn.query(
      "SELECT id FROM applicant_profiles WHERE user_id = ?",
      [userId]
    );
    if (applicantRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Applicant profile not found" });
    }
    const applicantId = applicantRows[0].id;

    // Clear old skills
    await conn.query("DELETE FROM applicant_skills WHERE applicant_id = ?", [applicantId]);

    // Insert new ones
    if (skills.length > 0) {
      const values = skills.map((s) => [
        applicantId,
        s.skill_id,
        s.proficiency_level || "beginner",
        s.years_of_experience || 0,
      ]);

      await conn.query(
        `INSERT INTO applicant_skills 
          (applicant_id, skill_id, proficiency_level, years_of_experience) 
          VALUES ?`,
        [values]
      );
    }

    await conn.commit();
    res.json({ message: "Skills updated successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("Error updating applicant skills:", err);
    res.status(500).json({ error: "Failed to update applicant skills" });
  } finally {
    conn.release();
  }
};

// Get applicant skills 
exports.getSkills = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT s.id AS skill_id, s.name, s.category, 
              aks.proficiency_level, aks.years_of_experience
       FROM applicant_skills aks
       JOIN applicant_profiles ap ON ap.id = aks.applicant_id
       JOIN skills s ON s.id = aks.skill_id
       WHERE ap.user_id = ?`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching applicant skills:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all skills 
exports.getAllSkills = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, category FROM skills ORDER BY category, name"
    );
    if (!rows.length) {
      return res.status(404).json({ error: "No skills found" });
    }
    res.json(rows);
  } catch (err) {
    console.error("Error fetching all skills:", err);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
};