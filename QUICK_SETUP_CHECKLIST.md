# Google OAuth Setup - Quick Checklist

## ✅ Supabase Dashboard Setup

- [ ] Supabase dashboard में जाएं
- [ ] Authentication > Providers पर जाएं
- [ ] Google provider को ढूंढें
- [ ] Google provider को Enable करें
- [ ] Client ID और Client Secret भरें
- [ ] Save करें

## ✅ Google Cloud Console Setup

- [ ] Google Cloud Console में जाएं
- [ ] Project select करें या नया बनाएं
- [ ] APIs & Services > Credentials पर जाएं
- [ ] OAuth 2.0 Client ID बनाएं
- [ ] Web application select करें
- [ ] Authorized redirect URIs में add करें:
  ```
  https://prqzcsajwpipfeqnqhlf.supabase.co/auth/v1/callback
  ```
- [ ] Client ID और Client Secret copy करें

## ✅ API Enable करें

- [ ] Google Cloud Console में जाएं
- [ ] APIs & Services > Library पर जाएं
- [ ] "Google+ API" search करें
- [ ] Enable करें

## ✅ Test करें

- [ ] App restart करें
- [ ] Login page पर जाएं
- [ ] "Continue with Google" पर click करें
- [ ] Google OAuth screen आना चाहिए
- [ ] Login के बाद user info दिखना चाहिए

## 🔧 अगर Error आ रहा है

### Error: "Unsupported provider: provider is not enabled"
**Solution:** Supabase में Google provider enable करें

### Error: "Invalid redirect URI"
**Solution:** Google Console में redirect URI exact match करें

### Error: "Client ID not found"
**Solution:** Google OAuth credentials verify करें

## 📞 Help के लिए

अगर अभी भी problem है तो:
1. Browser console में error check करें
2. Supabase logs check करें
3. Google Cloud Console में OAuth consent screen configure करें 