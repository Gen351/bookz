async function loadConfig() {
  const { url, key } = await fetch('/api/config').then(r => r.json());
  return supabase.createClient(url, key);
}

loadConfig().then(client => {
  window.supabase = client;
});
