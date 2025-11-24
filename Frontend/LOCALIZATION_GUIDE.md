# Arabic Localization Implementation Guide

## Overview
This guide explains how to use the i18next localization system in your React + TypeScript application.

## What Has Been Set Up

### 1. **Installed Packages**
- `i18next` - Core internationalization framework
- `react-i18next` - React bindings for i18next
- `i18next-browser-languagedetector` - Detects user's language preference
- `i18next-http-backend` - For loading translations from server (optional)

### 2. **Configuration Files**
- **`client/i18n.ts`** - Main configuration file with translation resources
- **`client/components/LanguageSwitcher.tsx`** - Language toggle component
- **`client/global.css`** - Updated with RTL support and Arabic fonts

### 3. **Example Implementation**
- **`client/components/Header.tsx`** - Demonstrates how to use translations

---

## How to Use Translations in Your Components

### Basic Usage

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button>{t('login')}</button>
    </div>
  );
}
```

### With Default Fallback

```tsx
// If translation key doesn't exist, it will show the fallback text
<button>{t('myKey', 'Default Text')}</button>
```

### With Variables (Interpolation)

```tsx
// In i18n.ts
const resources = {
  en: {
    translation: {
      greeting: "Hello, {{name}}!"
    }
  },
  ar: {
    translation: {
      greeting: "مرحبا، {{name}}!"
    }
  }
};

// In component
<p>{t('greeting', { name: 'Ahmed' })}</p>
```

---

## How to Add New Translations

### Step 1: Add Translation Keys to `client/i18n.ts`

```typescript
const resources = {
  en: {
    translation: {
      // Your existing translations...

      // Add new ones here
      myNewKey: "My English Text",
      anotherKey: "Another Text",
    }
  },
  ar: {
    translation: {
      // Your existing translations...

      // Add Arabic translations
      myNewKey: "النص العربي الخاص بي",
      anotherKey: "نص آخر",
    }
  }
};
```

### Step 2: Use in Your Component

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <div>{t('myNewKey')}</div>;
}
```

---

## How to Add Language Switcher to Pages

Simply import and add the `LanguageSwitcher` component:

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

function MyPage() {
  return (
    <div>
      <LanguageSwitcher />
      {/* Your page content */}
    </div>
  );
}
```

---

## Translation Organization Best Practices

### Organize by Feature/Page

```typescript
const resources = {
  en: {
    translation: {
      // Common/Shared
      common: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
      },

      // Login Page
      loginPage: {
        title: "Login to Your Account",
        email: "Email Address",
        password: "Password",
        forgotPassword: "Forgot Password?",
      },

      // Dashboard
      dashboard: {
        title: "Dashboard",
        stats: "Statistics",
        recentActivity: "Recent Activity",
      }
    }
  },
  ar: {
    translation: {
      // Common/Shared
      common: {
        save: "حفظ",
        cancel: "إلغاء",
        delete: "حذف",
      },

      // Login Page
      loginPage: {
        title: "تسجيل الدخول إلى حسابك",
        email: "عنوان البريد الإلكتروني",
        password: "كلمة المرور",
        forgotPassword: "هل نسيت كلمة المرور؟",
      },

      // Dashboard
      dashboard: {
        title: "لوحة التحكم",
        stats: "الإحصائيات",
        recentActivity: "النشاط الأخير",
      }
    }
  }
};
```

### Using Nested Translations

```tsx
// Accessing nested translations
<h1>{t('loginPage.title')}</h1>
<button>{t('common.save')}</button>
```

---

## Using Free Translation APIs (Optional)

If you need automated translations, you can use these free options:

### 1. **Google Translate API (Unofficial - Free)**

```bash
npm install @vitalets/google-translate-api
```

```typescript
import translate from '@vitalets/google-translate-api';

async function translateText(text: string, to: string = 'ar') {
  try {
    const result = await translate(text, { to });
    return result.text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// Usage
const arabicText = await translateText('Hello World', 'ar');
```

### 2. **LibreTranslate (Free & Open Source)**

```bash
npm install libretranslate
```

```typescript
import { translate } from 'libretranslate';

async function translateText(text: string) {
  const result = await translate({
    q: text,
    source: 'en',
    target: 'ar',
    api_url: 'https://libretranslate.de' // Free public instance
  });
  return result;
}
```

### 3. **MyMemory Translation API (Free - No API Key Required)**

```typescript
async function translateWithMyMemory(text: string, from: string = 'en', to: string = 'ar') {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.responseData.translatedText;
  } catch (error) {
    console.error('Translation failed:', error);
    return text;
  }
}

// Usage
const translated = await translateWithMyMemory('Hello World', 'en', 'ar');
```

---

## Backend Integration (Node.js + Express)

### Accepting Arabic Input

Your Express backend should already handle UTF-8 by default, but ensure:

```typescript
// server/index.ts
import express from 'express';

const app = express();

// Ensure UTF-8 encoding for JSON
app.use(express.json({
  type: 'application/json',
}));

app.use(express.urlencoded({
  extended: true,
  type: 'application/x-www-form-urlencoded'
}));

// Example endpoint accepting Arabic text
app.post('/api/data', (req, res) => {
  const { arabicText } = req.body;
  console.log('Received Arabic text:', arabicText);

  // Save to MySQL - will work automatically with UTF-8
  res.json({ success: true });
});
```

### MySQL Configuration

Ensure your MySQL database uses UTF-8:

```sql
-- Check current charset
SHOW VARIABLES LIKE 'character_set%';

-- Set database to UTF-8
ALTER DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- For existing tables
ALTER TABLE your_table_name CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- For new tables
CREATE TABLE example (
  id INT AUTO_INCREMENT PRIMARY KEY,
  arabic_text VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
);
```

---

## Testing the Implementation

### 1. Start your dev server:
```bash
npm run dev
```

### 2. Open your app in browser

### 3. Test Language Switching:
- Click the globe icon in the header
- Select "العربية" to switch to Arabic
- The text should change and layout should flip to RTL (right-to-left)

### 4. Check RTL Layout:
- Menu items should align to the right
- Text should flow from right to left
- Font should change to "Noto Sans Arabic"

---

## Next Steps

### For Each Page/Component:

1. **Identify all text strings** in the component
2. **Add translation keys** to `client/i18n.ts`
3. **Import useTranslation** in your component
4. **Replace hardcoded text** with `t('key')`

### Example Workflow:

```tsx
// BEFORE
function Login() {
  return (
    <div>
      <h1>Login</h1>
      <input placeholder="Email" />
      <button>Submit</button>
    </div>
  );
}

// AFTER
import { useTranslation } from 'react-i18next';

function Login() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('login')}</h1>
      <input placeholder={t('email')} />
      <button>{t('submit')}</button>
    </div>
  );
}
```

---

## Common Issues & Solutions

### Issue 1: Text not changing when switching language
**Solution:** Make sure you imported `./i18n` in `App.tsx`

### Issue 2: Layout not flipping to RTL
**Solution:** The LanguageSwitcher component sets `dir` attribute. Check browser inspector to ensure `<html dir="rtl">` is set.

### Issue 3: Arabic text showing as boxes/question marks
**Solution:** Ensure:
- Font "Noto Sans Arabic" is loaded in `global.css`
- Database/API uses UTF-8 encoding

### Issue 4: Translation key showing instead of text
**Solution:** Make sure the key exists in both `en` and `ar` objects in `resources`

---

## Quick Reference

### Import in component:
```tsx
import { useTranslation } from 'react-i18next';
```

### Get translation function:
```tsx
const { t, i18n } = useTranslation();
```

### Use translation:
```tsx
{t('key')}
{t('key', 'Default')}
{t('key', { variable: 'value' })}
```

### Get current language:
```tsx
const currentLang = i18n.language; // 'en' or 'ar'
```

### Change language programmatically:
```tsx
i18n.changeLanguage('ar');
```

---

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Arabic Typography Guidelines](https://www.w3.org/International/articles/arabic-typography/)
- [RTL Styling Guide](https://rtlstyling.com/)

---

## Support

If you need help with specific pages or components, share the component code and I'll help you add the translations!
