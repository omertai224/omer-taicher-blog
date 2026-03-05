# עומר טייכר — בלוג

בלוג סטטי עם פאנל ניהול. Hosting: Vercel. כתובת: `blog.omer.tips`.

## מבנה קבצים

```
/
├── index.html          ← דף ראשי (רשימת פוסטים)
├── post.html           ← תבנית דף פוסט בודד
├── posts.json          ← כל הפוסטים
├── admin/
│   ├── index.html      ← פאנל ניהול
│   ├── admin-core.js   ← GitHub API, storage, utilities
│   ├── admin-posts.js  ← יצירה/עריכה/מחיקת פוסטים
│   ├── admin-style.css ← עיצוב הפאנל
│   └── backups/        ← גיבויים אוטומטיים (עד 10)
└── assets/
    └── images/         ← תמונות פוסטים
```

## הגדרה ראשונית

1. **Vercel** — חבר את ה-repo ל-Vercel. פרסום אוטומטי בכל push.
2. **פאנל ניהול** — פתח `/admin/`, עבור להגדרות, הזן:
   - GitHub Owner (שם משתמש)
   - Repository Name
   - Personal Access Token (scope: `contents`)

## הוספת פוסט

דרך הפאנל: `/admin/` → "פוסט חדש" → מלא שדות → "פרסם פוסט".

הפוסט נכתב ישירות ל-`posts.json` דרך GitHub API. Vercel מפרסם אוטומטית תוך ~30 שניות.

## מבנה פוסט ב-posts.json

```json
{
  "id": "slug-url-friendly",
  "title": "כותרת",
  "excerpt": "תקציר קצר",
  "body": "<p>HTML...</p>",
  "date": "2025-01-01",
  "emoji": "🤖",
  "image": "assets/images/file.webp",
  "seo_title": "כותרת SEO | עומר טייכר",
  "seo_desc": "תיאור SEO"
}
```

## עיצוב

- גופן: Rubik
- כחול: `#0d1f35` / `#142030`
- כתום: `#e8854a` / `#c96a2a`
- RTL עברית
