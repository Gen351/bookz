export default function handler(req, res) {
  res.json({
    url:   process.env.SUPABASE_URL,
    key:   process.env.SUPABASE_ANON_KEY
  });
}
