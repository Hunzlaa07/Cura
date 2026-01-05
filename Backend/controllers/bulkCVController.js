// ============================================
// controllers/bulkCVController.js
// ============================================

const bulkCVService = require('../services/bulkCVMatchingService');
const db = require("../src/config/database");
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text from CV file
 */
async function extractCVText(filePath, mimeType) {
  try {
    let text = '';
    console.log(`📖 Extracting text from ${filePath} (type: ${mimeType})`);
    
    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      text = pdfData.text || '';
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value || '';
    } else if (mimeType === 'text/plain') {
      text = fs.readFileSync(filePath, 'utf8') || '';
    }
    
    console.log(`✨ Extracted ${text.length} characters from ${path.basename(filePath)}`);
    if (text.length === 0) console.warn(`⚠️ WARNING: Extracted 0 characters from ${filePath}`);
    
    return text;
  } catch (err) {
    console.error(`❌ CV extraction error for ${filePath}:`, err.message);
    throw err;
  }
}

/**
 * Upload CVs from local files
 */
exports.uploadCVsLocal = async (req, res) => {
  try {
    const { jd } = req.body;
    const userId = req.user?.id;

    console.log('📤 Upload request received. User:', userId);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized - No user found" });
    }

    if (!jd || jd.trim().length < 50) {
      return res.status(400).json({ error: "Job description must be at least 50 characters" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    console.log(`📄 Files received: ${req.files.length}`);

    // Get recruiter ID
    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).json({ error: "Not authorized as recruiter" });
    }

    const recruiterId = recruiterRows[0].id;
    console.log('👤 Recruiter ID:', recruiterId);

    // Create bulk job
    const bulkJob = await bulkCVService.createBulkJob(recruiterId, jd);
    console.log('📋 Bulk job created:', bulkJob.bulk_job_id);

    // Update file count
    await db.query(
      `UPDATE bulk_cv_jobs SET total_files = ? WHERE id = ?`,
      [req.files.length, bulkJob.bulk_job_id]
    );

    // Extract text from all CVs
    const cvFiles = [];
    for (const file of req.files) {
      try {
        const uploadsDir = path.join(__dirname, '../uploads/bulk_cvs');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
        const filePath = path.join(uploadsDir, uniqueName);
        fs.writeFileSync(filePath, file.buffer);

        console.log(`📖 Extracting text from: ${file.originalname}`);
        const extractedText = await extractCVText(filePath, file.mimetype);

        cvFiles.push({
          name: file.originalname,
          text: extractedText,
          file_path: `/uploads/bulk_cvs/${uniqueName}`,
          size: file.size
        });

        console.log(`✅ Extracted: ${file.originalname} (${extractedText.length} chars)`);
      } catch (err) {
        console.error(`❌ Error processing ${file.originalname}:`, err);
      }
    }

    console.log(`🎯 Ready to process ${cvFiles.length} CVs`);

    // Process CVs in background (don't block response)
    setImmediate(async () => {
      try {
        console.log('🚀 Starting background CV processing...');
        const results = await bulkCVService.processBulkCVs(
          bulkJob.bulk_job_id,
          cvFiles,
          jd
        );
        console.log('✅ Background processing completed');
      } catch (err) {
        console.error('❌ Background processing error:', err);
        // Update bulk job with error status
        await db.query(
          `UPDATE bulk_cv_jobs SET status = 'error', error_message = ? WHERE id = ?`,
          [err.message, bulkJob.bulk_job_id]
        );
      }
    });

    res.status(202).json({
      success: true,
      message: "CVs uploaded and analysis started",
      bulk_job_id: bulkJob.bulk_job_id,
      files_uploaded: cvFiles.length,
      status: "processing"
    });

  } catch (err) {
    console.error('❌ Error uploading CVs:', err);
    res.status(500).json({ error: "Failed to upload CVs", details: err.message });
  }
};

/**
 * Upload CVs from a public link (MVP)
 */
exports.uploadCVsFromLink = async (req, res) => {
  try {
    const { jd, source_link } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!jd || jd.trim().length < 50) return res.status(400).json({ error: 'Job description must be at least 50 characters' });
    if (!source_link || typeof source_link !== 'string') return res.status(400).json({ error: 'source_link is required' });
    if (!/^https?:\/\//i.test(source_link)) return res.status(400).json({ error: 'Only http(s) links are supported' });

    console.log(`📥 Import from link requested by user ${userId}: ${source_link}`);

    const [recruiterRows] = await db.query('SELECT id FROM recruiter_profiles WHERE user_id = ?', [userId]);
    if (!recruiterRows || recruiterRows.length === 0) return res.status(403).json({ error: 'Not authorized as recruiter' });
    const recruiterId = recruiterRows[0].id;

    const bulkJob = await bulkCVService.createBulkJob(recruiterId, jd);
    console.log('📋 Bulk job created:', bulkJob.bulk_job_id);

    const normalizeLink = (url) => {
      const gfile = url.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+))/);
      if (gfile) return `https://drive.google.com/uc?export=download&id=${gfile[1]||gfile[2]}`;
      if (url.includes('dropbox.com')) {
        if (url.includes('?dl=0')) return url.replace('?dl=0', '?dl=1');
        if (url.includes('?dl=1')) return url;
        return url + '?dl=1';
      }
      return url;
    };

    const normalized = normalizeLink(source_link);

    const downloadToBuffer = (url, redirects = 0) => new Promise((resolve, reject) => {
      try {
        const client = url.startsWith('https') ? require('https') : require('http');
        const opts = { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' } };
        client.get(url, opts, (resp) => {
          const statusCode = resp.statusCode || 0;
          if (statusCode >= 300 && statusCode < 400 && resp.headers && resp.headers.location) {
            if (redirects >= 5) return reject(new Error('Too many redirects'));
            const location = resp.headers.location.startsWith('http') ? resp.headers.location : new URL(resp.headers.location, url).toString();
            return resolve(downloadToBuffer(location, redirects + 1));
          }
          if (statusCode >= 400) return reject(new Error(`Failed to download file: ${statusCode}`));
          const data = [];
          resp.on('data', (chunk) => data.push(chunk));
          resp.on('end', () => resolve({ buffer: Buffer.concat(data), contentType: (resp.headers['content-type'] || '').toLowerCase(), headers: resp.headers }));
        }).on('error', (err) => reject(err));
      } catch (err) { reject(err); }
    });

    const allowedExts = ['.pdf', '.docx', '.txt'];
    const uploadsDir = path.join(__dirname, '../uploads/bulk_cvs');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const tempFiles = [];
    const driveFolderMatch = source_link.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);

    if (driveFolderMatch) {
      console.log('📁 Detected Google Drive folder link. Fetching folder page to discover files...');
      const { buffer: pageBuffer } = await downloadToBuffer(normalized);
      const html = pageBuffer.toString('utf8');
      const ids = new Set();
      const patterns = [/\/file\/d\/([a-zA-Z0-9_-]{10,})/g, /open\?id=([a-zA-Z0-9_-]{10,})/g, /uc\?id=([a-zA-Z0-9_-]{10,})/g, /data-id="([a-zA-Z0-9_-]{10,})"/g];
      for (const re of patterns) {
        let m;
        while ((m = re.exec(html)) !== null) ids.add(m[1]);
      }

      if (ids.size === 0) {
        const errMsg = 'No files found in Drive folder. Make sure the folder is shared with "Anyone with the link" permission';
        await db.query(`UPDATE bulk_cv_jobs SET status = 'error', error_message = ? WHERE id = ?`, [errMsg, bulkJob.bulk_job_id]);
        return res.status(422).json({ error: errMsg });
      }

      const fileIds = Array.from(ids).slice(0, 200);
      console.log(`🔎 Found ${ids.size} files, will attempt to download ${fileIds.length}`);

      for (const id of fileIds) {
        try {
          let { buffer: fbuf, contentType: fct, headers } = await downloadToBuffer(`https://drive.google.com/uc?export=download&id=${id}`);

          const head = fbuf.slice(0, 512).toString('utf8').toLowerCase();
          const looksLikeHtml = fct.includes('html') || head.includes('<!doctype') || head.includes('<html') || head.includes('google');

          if (looksLikeHtml) {
            const htmlSnippet = fbuf.slice(0, 200).toString('utf8', 0, 200).replace(/\n/g, ' ').substring(0, 150);
            console.log(`🔁 File ${id} returned HTML (${fbuf.length} bytes), trying alternative methods... [${htmlSnippet}...]`);
            
            // Extract download URL from HTML if present (sometimes Google embeds it)
            const htmlStr = fbuf.toString('utf8');
            const downloadLinkMatch = htmlStr.match(/href="([^"]*download[^"]*)"/i) || htmlStr.match(/action="([^"]*download[^"]*)"/i);
            if (downloadLinkMatch) {
              console.log(`   → Found embedded download link, attempting...`);
              const embedUrl = downloadLinkMatch[1].startsWith('http') ? downloadLinkMatch[1] : `https://drive.google.com${downloadLinkMatch[1]}`;
              const resEmbed = await downloadToBuffer(embedUrl).catch(() => null);
              if (resEmbed && resEmbed.buffer && resEmbed.buffer.length > 500) {
                const embedHead = resEmbed.buffer.slice(0, 512).toString('utf8').toLowerCase();
                if (!embedHead.includes('<!doctype')) {
                  console.log(`   ✅ Got real file from embedded link`);
                  fbuf = resEmbed.buffer;
                  fct = resEmbed.contentType;
                  headers = resEmbed.headers || headers;
                  looksLikeHtml = false;
                }
              }
            }
            
            // Strategy 1: Try /export?format=pdf endpoint (works for some shared files)
            if (looksLikeHtml) {
              console.log(`   → Trying /export?format=pdf endpoint...`);
              const resExportPdf = await downloadToBuffer(`https://drive.google.com/file/d/${id}/export?format=pdf`).catch(() => null);
              if (resExportPdf && resExportPdf.buffer && resExportPdf.buffer.length > 500) {
                const pdfHead = resExportPdf.buffer.slice(0, 10).toString('utf8');
                if (pdfHead.includes('%PDF')) {
                  console.log(`   ✅ Got PDF via /export?format=pdf`);
                  fbuf = resExportPdf.buffer;
                  fct = 'application/pdf';
                  headers = resExportPdf.headers || headers;
                  looksLikeHtml = false;
                }
              }
            }
            
            // Strategy 2: Try different Drive endpoints (v3 API syntax)
            if (looksLikeHtml) {
              console.log(`   → Trying Drive API v3 endpoint...`);
              const resApi = await downloadToBuffer(`https://drive.google.com/file/d/${id}/view`).catch(() => null);
              if (resApi && resApi.buffer && resApi.buffer.length > 500) {
                const apiHead = resApi.buffer.slice(0, 512).toString('utf8').toLowerCase();
                if (!apiHead.includes('<!doctype')) {
                  console.log(`   ✅ Got content from API endpoint`);
                  fbuf = resApi.buffer;
                  fct = resApi.contentType;
                  headers = resApi.headers || headers;
                  looksLikeHtml = false;
                }
              }
            }
            
            // Strategy 3: Try exporting as Google Docs (DOCX then PDF)
            if (looksLikeHtml) {
              console.log(`   → Trying Google Docs export (DOCX)...`);
              const resDocx = await downloadToBuffer(`https://docs.google.com/document/d/${id}/export?format=docx`).catch(() => null);
              if (resDocx && resDocx.buffer && resDocx.buffer.length > 500) {
                const docxHeader = resDocx.buffer.slice(0, 4);
                if (docxHeader[0] === 0x50 && docxHeader[1] === 0x4b) { // PK magic bytes
                  console.log(`   ✅ Got DOCX from Docs export`);
                  fbuf = resDocx.buffer;
                  fct = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                  headers = resDocx.headers || headers;
                  looksLikeHtml = false;
                }
              }
              
              if (looksLikeHtml) {
                console.log(`   → Trying Google Docs export (PDF)...`);
                const resPdf = await downloadToBuffer(`https://docs.google.com/document/d/${id}/export?format=pdf`).catch(() => null);
                if (resPdf && resPdf.buffer && resPdf.buffer.length > 500) {
                  const pdfHead = resPdf.buffer.slice(0, 10).toString('utf8');
                  if (pdfHead.includes('%PDF')) {
                    console.log(`   ✅ Got PDF from Docs export`);
                    fbuf = resPdf.buffer;
                    fct = 'application/pdf';
                    headers = resPdf.headers || headers;
                    looksLikeHtml = false;
                  }
                }
              }
            }
            
            if (looksLikeHtml) {
              console.warn(`   ❌ Could not retrieve actual file (got ${fbuf.length} bytes of HTML), skipping ${id}`);
              continue;
            }
          }

          let filename = null;
          const cd = headers && (headers['content-disposition'] || headers['Content-Disposition']);
          if (cd) {
            const fnMatch = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/);
            if (fnMatch) filename = fnMatch[1].trim();
          }

          let ext = filename ? path.extname(filename).toLowerCase() : '';

          if (!ext) {
            if (fct.includes('pdf')) ext = '.pdf';
            else if (fct.includes('word')) ext = '.docx';
            else if (fct.includes('text/plain')) ext = '.txt';
            else {
              const headSnippet = fbuf.slice(0, 4096).toString('utf8').toLowerCase();
              if (/\%pdf-/.test(headSnippet)) ext = '.pdf';
              else if (fbuf[0] === 0x50 && fbuf[1] === 0x4b && fbuf[2] === 0x03 && fbuf[3] === 0x04) {
                ext = '.docx';
              } else {
                const sample = fbuf.slice(0, 1024);
                let printable = 0;
                for (let i = 0; i < sample.length; i++) {
                  const b = sample[i];
                  if (b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126)) printable++;
                }
                if (sample.length > 0 && (printable / sample.length) > 0.9) ext = '.txt';
              }
            }
          }

          if (!allowedExts.includes(ext)) {
            console.warn(`   ⚠️ Unsupported file type '${ext}' for ${id}, skipping`);
            continue;
          }

          const originalName = filename || `imported-${id}${ext}`;
          const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${originalName}`;
          const filePath = path.join(uploadsDir, uniqueName);
          fs.writeFileSync(filePath, fbuf);
          const mimetype = ext === '.pdf' ? 'application/pdf' : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain';
          
          let extractedText = '';
          try {
            extractedText = await extractCVText(filePath, mimetype);
          } catch (extractErr) {
            console.error(`   ❌ Failed to extract text from ${originalName}:`, extractErr.message);
            extractedText = '';
          }
          
          if (!extractedText || extractedText.trim().length === 0) {
            console.warn(`   ⚠️ No text extracted from ${originalName} (${fbuf.length} bytes), skipping`);
            continue;
          }
          
          tempFiles.push({ name: originalName, text: extractedText, file_path: `/uploads/bulk_cvs/${uniqueName}`, size: fs.statSync(filePath).size });
          console.log(`   ✅ Successfully processed: ${originalName} (${extractedText.length} chars)`);
        } catch (errInner) {
          console.error(`❌ Error downloading file ${id}:`, errInner.message);
        }
      }
    } else {
      // Single file (not folder)
      const { buffer, contentType, headers } = await downloadToBuffer(normalized);
      const isZip = contentType.includes('zip') || normalized.toLowerCase().endsWith('.zip');

      if (isZip) {
        const AdmZip = require('adm-zip');
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();
        for (const entry of entries) {
          if (entry.isDirectory) continue;
          const ext = path.extname(entry.entryName).toLowerCase();
          if (!allowedExts.includes(ext)) continue;
          const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${path.basename(entry.entryName)}`;
          const filePath = path.join(uploadsDir, uniqueName);
          fs.writeFileSync(filePath, entry.getData());
          const mimetype = ext === '.pdf' ? 'application/pdf' : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain';
          
          let extractedText = '';
          try {
            extractedText = await extractCVText(filePath, mimetype);
          } catch (extractErr) {
            console.error(`❌ Failed to extract text from ZIP entry ${entry.entryName}:`, extractErr.message);
            continue;
          }
          
          if (!extractedText || extractedText.trim().length === 0) {
            console.warn(`⚠️ No text extracted from ZIP entry ${entry.entryName}, skipping`);
            continue;
          }
          
          tempFiles.push({ name: path.basename(entry.entryName), text: extractedText, file_path: `/uploads/bulk_cvs/${uniqueName}`, size: fs.statSync(filePath).size });
        }
      } else {
        // Single non-zip file
        let ext = path.extname(normalized).split('?')[0] || '';
        ext = ext.toLowerCase();

        if (!ext) {
          if (contentType.includes('pdf')) ext = '.pdf';
          else if (contentType.includes('word')) ext = '.docx';
          else if (contentType.includes('text/plain')) ext = '.txt';
          else {
            const headSnippet = buffer.slice(0, 4096).toString('utf8').toLowerCase();
            if (/\%pdf-/.test(headSnippet)) ext = '.pdf';
            else if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
              const snippet = buffer.slice(0, 10000).toString('utf8');
              if (snippet.includes('[content_types].xml') || snippet.includes('[Content_Types].xml')) ext = '.docx';
            } else {
              const sample = buffer.slice(0, 1024);
              let printable = 0;
              for (let i = 0; i < sample.length; i++) {
                const b = sample[i];
                if (b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126)) printable++;
              }
              if (sample.length > 0 && (printable / sample.length) > 0.9) ext = '.txt';
            }
          }
        }

        if (!allowedExts.includes(ext)) {
          await db.query(`UPDATE bulk_cv_jobs SET status = 'error', error_message = ? WHERE id = ?`, ['No valid CV files found in link', bulkJob.bulk_job_id]);
          return res.status(422).json({ error: 'No valid CV files found in the provided link' });
        }

        let originalName = `imported${ext}`;
        const cd = headers && (headers['content-disposition'] || headers['Content-Disposition']);
        if (cd) {
          const fnMatch = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/);
          if (fnMatch) originalName = fnMatch[1].trim();
        }
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${originalName}`;
        const filePath = path.join(uploadsDir, uniqueName);
        fs.writeFileSync(filePath, buffer);
        const mimetype = ext === '.pdf' ? 'application/pdf' : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain';
        
        let extractedText = '';
        try {
          extractedText = await extractCVText(filePath, mimetype);
        } catch (extractErr) {
          console.error(`❌ Failed to extract text from ${originalName}:`, extractErr.message);
          extractedText = '';
        }
        
        if (!extractedText || extractedText.trim().length === 0) {
          await db.query(`UPDATE bulk_cv_jobs SET status = 'error', error_message = ? WHERE id = ?`, ['Failed to extract text from CV file', bulkJob.bulk_job_id]);
          return res.status(422).json({ error: 'Failed to extract text from CV file. Ensure the file is a valid PDF, DOCX, or TXT.' });
        }
        
        tempFiles.push({ name: originalName, text: extractedText, file_path: `/uploads/bulk_cvs/${uniqueName}`, size: fs.statSync(filePath).size });
      }
    }

    console.log(`🎯 Downloaded and extracted ${tempFiles.length} files from link`);

    if (tempFiles.length === 0) {
      const isFolderLink = driveFolderMatch ? true : false;
      const helpMsg = isFolderLink 
        ? 'No files could be downloaded from the folder. This usually means: 1) Individual files are not shared publicly, or 2) The folder only contains unsupported file types. Try: a) Right-click each CV file in Drive → Share → "Anyone with the link", or b) Create a ZIP file with your CVs and share the ZIP link instead.'
        : 'No valid CV files found in link. Make sure the link is publicly accessible and contains PDF, DOCX, or TXT files.';
      await db.query(`UPDATE bulk_cv_jobs SET status = 'error', error_message = ? WHERE id = ?`, [helpMsg, bulkJob.bulk_job_id]);
      return res.status(422).json({ error: helpMsg });
    }

    await db.query(`UPDATE bulk_cv_jobs SET total_files = ? WHERE id = ?`, [tempFiles.length, bulkJob.bulk_job_id]);

    setImmediate(async () => {
      try {
        console.log('🚀 Starting background CV processing from link...');
        await bulkCVService.processBulkCVs(bulkJob.bulk_job_id, tempFiles, jd);
        console.log('✅ Background processing completed');
      } catch (err) {
        console.error('❌ Background processing error:', err);
        await db.query(`UPDATE bulk_cv_jobs SET status = 'error', error_message = ? WHERE id = ?`, [err.message, bulkJob.bulk_job_id]);
      }
    });

    res.status(202).json({ success: true, bulk_job_id: bulkJob.bulk_job_id, files_detected: tempFiles.length, status: 'processing' });

  } catch (err) {
    console.error('❌ Error in upload-from-link:', err);
    res.status(500).json({ error: 'Failed to start import from link', details: err.message });
  }
};

/**
 * Get bulk job status & results
 */
exports.getBulkJobStatus = async (req, res) => {
  try {
    const { bulkJobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`📊 Status check for bulk job ${bulkJobId}`);

    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const recruiterId = recruiterRows[0].id;

    const results = await bulkCVService.getBulkJobResults(bulkJobId, recruiterId);

    res.json(results);

  } catch (err) {
    console.error('❌ Error fetching bulk job status:', err);
    res.status(500).json({ error: "Failed to fetch status", details: err.message });
  }
};

/**
 * Export results as CSV
 */
exports.exportResults = async (req, res) => {
  try {
    const { bulkJobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`📥 Export requested for bulk job ${bulkJobId}`);

    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const recruiterId = recruiterRows[0].id;
    const jobData = await bulkCVService.getBulkJobResults(bulkJobId, recruiterId);

    // Convert to CSV
    let csv = 'Rank,File Name,Match Score,Match Level,Recommendation,Summary\n';
    jobData.results.forEach((result, idx) => {
      const row = [
        idx + 1,
        `"${result.file_name}"`,
        result.match_score || 0,
        result.match_level || 'N/A',
        result.recommendation || 'Review Manually',
        `"${(result.summary || '').replace(/"/g, '""')}"`
      ];
      csv += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bulk-cv-results-${bulkJobId}.csv"`);
    res.send(csv);

    console.log('✅ CSV exported successfully');

  } catch (err) {
    console.error('❌ Error exporting results:', err);
    res.status(500).json({ error: "Failed to export results", details: err.message });
  }
};