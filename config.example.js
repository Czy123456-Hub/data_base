window.APP_CONFIG = {
  provider: "cloudbase",
  cloudbase: {
    envId: "database200713-d7gpx3anl9853af10",
    region: "ap-shanghai"
  },
  supabase: {
    url: "https://YOUR-PROJECT-REF.supabase.co",
    anonKey: "YOUR_PUBLIC_SUPABASE_ANON_KEY"
  }
};

window.CLOUDBASE_CONFIG = window.APP_CONFIG.cloudbase;
window.SUPABASE_CONFIG = window.APP_CONFIG.supabase;
