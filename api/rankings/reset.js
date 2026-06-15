const MOCK_RANKINGS = [
  { grade: 3, classGroup: 1, name: "이데아", lineage: "idealism", playTime: 240, date: "2026-06-10" },
  { grade: 3, classGroup: 3, name: "베이컨", lineage: "empiricism", playTime: 285, date: "2026-06-11" },
  { grade: 2, classGroup: 5, name: "공자", lineage: "confucianism", playTime: 310, date: "2026-06-12" },
  { grade: 1, classGroup: 2, name: "장자", lineage: "taoism", playTime: 345, date: "2026-06-09" },
  { grade: 2, classGroup: 4, name: "원효", lineage: "buddhism", playTime: 390, date: "2026-06-12" }
];

export default async function handler(req, res) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ 
      error: "Vercel KV database is not linked. Please connect a KV database to this project in the Vercel dashboard." 
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Save mock rankings to Redis
    await fetch(`${url}/set/rankings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(MOCK_RANKINGS)
    });

    return res.status(200).json(MOCK_RANKINGS);
  } catch (e) {
    console.error("Serverless reset error:", e);
    return res.status(500).json({ error: e.message });
  }
}
