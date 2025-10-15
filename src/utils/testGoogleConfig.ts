// Test script to check Google API configuration
// Run this in browser console to test your setup

export const testGoogleConfig = () => {
  console.log("🔍 Testing Google API Configuration...\n");

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  console.log("📋 Configuration Check:");
  console.log("─────────────────────────");

  // Check Client ID
  if (clientId) {
    console.log("✅ Client ID: Configured");
    console.log(`   Value: ${clientId.substring(0, 20)}...`);
  } else {
    console.log("❌ Client ID: Missing");
  }

  // Check API Key
  if (apiKey && apiKey !== "" && apiKey !== "YOUR_API_KEY_HERE") {
    console.log("✅ API Key: Configured");
    console.log(`   Value: ${apiKey.substring(0, 10)}...`);
  } else if (apiKey === "YOUR_API_KEY_HERE" || apiKey === "") {
    console.log("❌ API Key: Not configured (placeholder value)");
    console.log("   📝 Action: Add your actual API key to .env file");
  } else {
    console.log("❌ API Key: Missing");
    console.log("   📝 Action: Add VITE_GOOGLE_API_KEY to .env file");
  }

  console.log("\n📍 Current Environment:");
  console.log(`   Mode: ${import.meta.env.MODE}`);
  console.log(`   URL: ${window.location.origin}`);

  console.log("\n💡 Next Steps:");
  if (!apiKey || apiKey === "" || apiKey === "YOUR_API_KEY_HERE") {
    console.log("1. Go to: https://console.cloud.google.com/");
    console.log("2. Enable Google Calendar API");
    console.log("3. Create API Key in Credentials");
    console.log("4. Add key to .env file as VITE_GOOGLE_API_KEY");
    console.log("5. Restart dev server (npm run dev)");
  } else {
    console.log("✅ Configuration looks good!");
    console.log("   Try booking a slot now.");
  }

  console.log("\n📚 For detailed instructions, see:");
  console.log("   - QUICK_FIX.md");
  console.log("   - GOOGLE_CALENDAR_SETUP.md");
};

// Auto-run on import in development
if (import.meta.env.DEV) {
  console.log("\n🚀 Google Calendar API Setup Helper");
  console.log("════════════════════════════════════");
  testGoogleConfig();
}
