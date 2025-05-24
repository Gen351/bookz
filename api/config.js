export default function handler(req, res) {
  // Allow cross‐origin if you need, e.g. res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')
  res.status(200).json({
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY
  })
}
