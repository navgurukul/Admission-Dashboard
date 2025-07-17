# Supabase में Google OAuth Setup करने का तरीका

## Error का मतलब
`"Unsupported provider: provider is not enabled"` का मतलब है कि आपके Supabase project में Google OAuth enable नहीं है।

## Step 1: Supabase Dashboard में जाएं

1. [Supabase Dashboard](https://supabase.com/dashboard) पर जाएं
2. अपना project select करें
3. Left sidebar में **"Authentication"** पर click करें
4. **"Providers"** tab पर जाएं

## Step 2: Google Provider को Enable करें

1. **"Google"** provider को ढूंढें (list में scroll करें)
2. Google के row में **"Edit"** button पर click करें
3. **"Enable"** toggle को ON करें
4. अब आपको Google OAuth credentials भरने होंगे

## Step 3: Google Cloud Console से Credentials लें

### Google Cloud Console में जाएं:
1. [Google Cloud Console](https://console.cloud.google.com/) पर जाएं
2. अपना project select करें या नया project बनाएं

### OAuth 2.0 Credentials बनाएं:
1. Left sidebar में **"APIs & Services"** > **"Credentials"** पर जाएं
2. **"Create Credentials"** पर click करें
3. **"OAuth 2.0 Client IDs"** select करें
4. **"Web application"** choose करें

### Authorized Redirect URIs add करें:
```
https://prqzcsajwpipfeqnqhlf.supabase.co/auth/v1/callback
```

**Note:** `prqzcsajwpipfeqnqhlf` को अपने Supabase project reference से replace करें।

### Credentials save करें:
- **Client ID** और **Client Secret** copy करें

## Step 4: Supabase में Credentials भरें

Supabase dashboard में वापस जाएं और Google provider में:

1. **Client ID**: अपना Google OAuth Client ID paste करें
2. **Client Secret**: अपना Google OAuth Client Secret paste करें
3. **Save** button पर click करें

## Step 5: Test करें

1. अपना app restart करें
2. Login page पर जाएं
3. **"Continue with Google"** button पर click करें
4. अब Google OAuth work करना चाहिए

## Troubleshooting

### अगर अभी भी error आ रहा है:

1. **Supabase project reference check करें:**
   - Supabase dashboard में जाएं
   - Project settings में जाएं
   - Project reference copy करें
   - Google Console में redirect URI update करें

2. **Google+ API enable करें:**
   - Google Cloud Console में जाएं
   - **"APIs & Services"** > **"Library"**
   - **"Google+ API"** search करें और enable करें

3. **Credentials verify करें:**
   - Client ID और Client Secret सही हैं या नहीं
   - Copy-paste में कोई extra space तो नहीं

4. **Redirect URI format:**
   ```
   https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
   ```

## Common Issues और Solutions

### Issue 1: "Invalid redirect URI"
**Solution:** Google Console में redirect URI exact match होना चाहिए

### Issue 2: "Client ID not found"
**Solution:** Google OAuth Client ID verify करें

### Issue 3: "API not enabled"
**Solution:** Google+ API enable करें

## Development के लिए Additional Setup

अगर आप local development कर रहे हैं:

1. **Google Console में additional redirect URI add करें:**
   ```
   http://localhost:3000/
   http://localhost:5173/
   ```

2. **Supabase में site URL update करें:**
   - Authentication > Settings में जाएं
   - Site URL को `http://localhost:3000` या `http://localhost:5173` करें

## Success Indicators

जब सब सही setup हो जाएगा तो:
- ✅ Google provider Supabase में enabled दिखेगा
- ✅ "Continue with Google" button पर click करने पर Google OAuth screen आएगा
- ✅ Login के बाद user का name और email sidebar में दिखेगा
- ✅ Console में कोई error नहीं आएगा

## Next Steps

Setup complete होने के बाद:
1. User roles और permissions configure करें
2. Additional OAuth providers add करें (GitHub, Microsoft, etc.)
3. User profile management features add करें 