import { useState } from "react";
import { Upload, Sparkles, CheckCircle, Loader } from "lucide-react";
import DateTimePicker from '@/components/DateTimePicker';

export function UploadJDTab({ onExtract, i18n, onSaveJob }) {
  const [uploadMethod, setUploadMethod] = useState('file');
  const [selectedFile, setSelectedFile] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [enhancedData, setEnhancedData] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    employment_type: 'full-time',
    experience_level: 'Mid Level (3-5 years)',
    key_responsibilities: '',
    description: '',
    application_deadline: '',
    min_experience_years: '',
    max_experience_years: '',
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPastedContent('');
    }
  };

  const extractFromFile = async () => {
    if (!selectedFile) return;

    setExtracting(true);
    try {
      const formDataFile = new FormData();
      formDataFile.append('file', selectedFile);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/extract-jd`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataFile
      });

      if (!res.ok) throw new Error('Failed to extract');

      const data = await res.json();
      setExtractedData(data);
      setPastedContent(data.extracted_text || '');
      
      setFormData(prev => ({
        ...prev,
        title: data.job_title || prev.title,
        location: data.location || prev.location,
        department: data.department || prev.department,
        description: data.description || prev.description,
        key_responsibilities: data.key_responsibilities || prev.key_responsibilities,
      }));
    } catch (err) {
      console.error('Extract error:', err);
    } finally {
      setExtracting(false);
    }
  };

  const extractFromURL = async () => {
    if (!urlInput.trim()) return;

    setExtracting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/scrape-jd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ url: urlInput })
      });

      if (!res.ok) throw new Error('Failed to scrape');

      const data = await res.json();
      setExtractedData(data);
      setPastedContent(data.extracted_text || '');
      
      setFormData(prev => ({
        ...prev,
        title: data.job_title || prev.title,
        location: data.location || prev.location,
        department: data.department || prev.department,
        description: data.description || prev.description,
        key_responsibilities: data.key_responsibilities || prev.key_responsibilities,
      }));
    } catch (err) {
      console.error('Scrape error:', err);
    } finally {
      setExtracting(false);
    }
  };

  const enhanceJobDescription = async () => {
    if (!pastedContent.trim()) return;

    setEnhancing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          jobDescription: pastedContent,
          language: i18n.language
        })
      });

      if (!res.ok) throw new Error('Failed to enhance');

      const data = await res.json();
      setEnhancedData(data);
      
      setFormData(prev => ({
        ...prev,
        description: data.description || '',
        key_responsibilities: data.key_responsibilities || '',
      }));
    } catch (err) {
      console.error('Enhancement error:', err);
    } finally {
      setEnhancing(false);
    }
  };

  const handleSaveJob = async () => {
    if (!formData.title.trim()) {
      alert(i18n.language === 'ar' ? 'يرجى إدخال عنوان الوظيفة' : 'Please enter job title');
      return;
    }

    if (!formData.application_deadline) {
      alert(i18n.language === 'ar' ? 'يرجى تحديد موعد نهائي للتقديم' : 'Please set application deadline');
      return;
    }

    setSaving(true);
    try {
      await onSaveJob(formData);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-[#1a1a1a] mb-3">
        {i18n.language === 'ar' ? 'تحميل وصف وظيفة' : 'Upload Job Description'}
      </h2>

      {/* Upload Method Selector */}
      <div className="flex gap-3 mb-4">
        <label className="flex-1 flex items-center gap-2 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          style={{backgroundColor: uploadMethod === 'file' ? '#C8F55A20' : 'transparent'}}>
          <input
            type="radio"
            checked={uploadMethod === 'file'}
            onChange={() => setUploadMethod('file')}
            className="accent-[#C8F55A]"
          />
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">
            {i18n.language === 'ar' ? 'ملف' : 'File'}
          </span>
        </label>
        <label className="flex-1 flex items-center gap-2 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          style={{backgroundColor: uploadMethod === 'url' ? '#C8F55A20' : 'transparent'}}>
          <input
            type="radio"
            checked={uploadMethod === 'url'}
            onChange={() => setUploadMethod('url')}
            className="accent-[#C8F55A]"
          />
          <span className="text-lg">🔗</span>
          <span className="text-sm font-medium">
            {i18n.language === 'ar' ? 'رابط' : 'URL'}
          </span>
        </label>
      </div>

      {/* File Upload */}
      {uploadMethod === 'file' && (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#C8F55A] transition">
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              id="jd-file"
            />
            <label htmlFor="jd-file" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">
                {i18n.language === 'ar' ? 'اسحب الملف هنا أو انقر' : 'Drag file here or click'}
              </p>
              <p className="text-xs text-gray-500">
                PDF, DOC, DOCX, TXT
              </p>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-xs text-green-800 truncate">{selectedFile.name}</span>
            </div>
          )}

          <button
            onClick={extractFromFile}
            disabled={!selectedFile || extracting}
            className="w-full bg-[#C8F55A] text-[#1a1a1a] hover:bg-[#b8e54a] h-10 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition"
          >
            {extracting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {i18n.language === 'ar' ? 'استخراج...' : 'Extracting...'}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {i18n.language === 'ar' ? 'استخراج' : 'Extract'}
              </>
            )}
          </button>
        </div>
      )}

      {/* URL Input */}
      {uploadMethod === 'url' && (
        <div className="space-y-3">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/job"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
          />
          <button
            onClick={extractFromURL}
            disabled={!urlInput.trim() || extracting}
            className="w-full bg-[#C8F55A] text-[#1a1a1a] hover:bg-[#b8e54a] h-10 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition"
          >
            {extracting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {i18n.language === 'ar' ? 'استخراج...' : 'Scraping...'}
              </>
            ) : (
              <>
                <span className="text-lg">🔗</span>
                {i18n.language === 'ar' ? 'استخراج' : 'Extract'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Enhance Section - Only show after extraction */}
      {pastedContent && !enhancedData && (
        <button
          onClick={enhanceJobDescription}
          disabled={enhancing || !pastedContent.trim()}
          className="w-full bg-[#C8F55A] text-[#1a1a1a] hover:bg-[#b8e54a] h-10 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition"
        >
          {enhancing ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              {i18n.language === 'ar' ? 'تحسين...' : 'Enhancing...'}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {i18n.language === 'ar' ? 'تحسين' : 'Enhance'}
            </>
          )}
        </button>
      )}

      {/* Form Fields - Show ONLY after enhancement */}
      {enhancedData && (
        <div className="space-y-3 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
              {i18n.language === 'ar' ? 'عنوان الوظيفة' : 'Job Title'}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                {i18n.language === 'ar' ? 'القسم' : 'Department'}
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                {i18n.language === 'ar' ? 'الموقع' : 'Location'}
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
              >
                <option value="">Select Location</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <optgroup label="South Asia">
                  <option value="Karachi, Pakistan">Karachi, Pakistan</option>
                  <option value="Lahore, Pakistan">Lahore, Pakistan</option>
                  <option value="Islamabad, Pakistan">Islamabad, Pakistan</option>
                  <option value="Rawalpindi, Pakistan">Rawalpindi, Pakistan</option>
                  <option value="Dhaka, Bangladesh">Dhaka, Bangladesh</option>
                  <option value="Colombo, Sri Lanka">Colombo, Sri Lanka</option>
                </optgroup>
                <optgroup label="North America">
                  <option value="New York, NY, USA">New York, NY, USA</option>
                  <option value="San Francisco, CA, USA">San Francisco, CA, USA</option>
                  <option value="Los Angeles, CA, USA">Los Angeles, CA, USA</option>
                  <option value="Chicago, IL, USA">Chicago, IL, USA</option>
                  <option value="Austin, TX, USA">Austin, TX, USA</option>
                  <option value="Toronto, ON, Canada">Toronto, ON, Canada</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="London, UK">London, UK</option>
                  <option value="Berlin, Germany">Berlin, Germany</option>
                  <option value="Paris, France">Paris, France</option>
                  <option value="Amsterdam, Netherlands">Amsterdam, Netherlands</option>
                  <option value="Dublin, Ireland">Dublin, Ireland</option>
                </optgroup>
                <optgroup label="Asia">
                  <option value="Tokyo, Japan">Tokyo, Japan</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Hong Kong">Hong Kong</option>
                  <option value="Bangalore, India">Bangalore, India</option>
                  <option value="Dubai, UAE">Dubai, UAE</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                {i18n.language === 'ar' ? 'نوع التوظيف' : 'Employment Type'}
              </label>
              <select
                value={formData.employment_type}
                onChange={(e) => setFormData(prev => ({ ...prev, employment_type: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
              >
                <option value="full-time">{i18n.language === 'ar' ? 'دوام كامل' : 'Full-time'}</option>
                <option value="part-time">{i18n.language === 'ar' ? 'دوام جزئي' : 'Part-time'}</option>
                <option value="contract">{i18n.language === 'ar' ? 'عقد' : 'Contract'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                {i18n.language === 'ar' ? 'مستوى الخبرة' : 'Experience Level'}
              </label>
              <select
                value={formData.experience_level}
                onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
              >
                <option value="Entry Level (0-2 years)">Entry (0-2)</option>
                <option value="Mid Level (3-5 years)">Mid (3-5)</option>
                <option value="Senior (6-9 years)">Senior (6-9)</option>
                <option value="Lead (10+ years)">Lead (10+)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                {i18n.language === 'ar' ? 'الحد الأدنى (سنوات)' : 'Min Years'}
              </label>
              <input
                type="number"
                value={formData.min_experience_years}
                onChange={(e) => setFormData(prev => ({ ...prev, min_experience_years: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                {i18n.language === 'ar' ? 'الحد الأقصى (سنوات)' : 'Max Years'}
              </label>
              <input
                type="number"
                value={formData.max_experience_years}
                onChange={(e) => setFormData(prev => ({ ...prev, max_experience_years: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#C8F55A] focus:border-transparent"
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
              {i18n.language === 'ar' ? 'الموعد النهائي' : 'Application Deadline'}
              <span className="text-red-500">*</span>
            </label>
            <DateTimePicker
              value={formData.application_deadline}
              onChange={(value) => setFormData(prev => ({ ...prev, application_deadline: value }))}
            />
          </div>

          <button
            onClick={handleSaveJob}
            disabled={saving || !formData.title || !formData.application_deadline}
            className="w-full bg-[#C8F55A] text-[#1a1a1a] hover:bg-[#b8e54a] h-10 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition relative overflow-hidden"
          >
            {saving ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="opacity-0">
                  {i18n.language === 'ar' ? 'حفظ...' : 'Saving...'}
                </span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {i18n.language === 'ar' ? 'حفظ الوظيفة' : 'Save Job'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}