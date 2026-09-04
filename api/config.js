module.exports = function handler(_request, response) {
  const url = process.env.SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return response.status(503).json({
      error: "Production authentication is not configured.",
    });
  }

  response.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  return response.status(200).json({ url, publishableKey });
};