const MOCK_RANKINGS = [
  { grade: 3, classGroup: 1, name: "이데아", lineage: "idealism", playTime: 240, date: "2026-06-10" },
  { grade: 3, classGroup: 3, name: "베이컨", lineage: "empiricism", playTime: 285, date: "2026-06-11" },
  { grade: 2, classGroup: 5, name: "공자", lineage: "confucianism", playTime: 310, date: "2026-06-12" },
  { grade: 1, classGroup: 2, name: "장자", lineage: "taoism", playTime: 345, date: "2026-06-09" },
  { grade: 2, classGroup: 4, name: "원효", lineage: "buddhism", playTime: 390, date: "2026-06-12" }
];

export default async function handler(req, res) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

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
    const entryToDelete = req.body;
    if (!entryToDelete) {
      return res.status(400).json({ error: "Missing body" });
    }

    // Fetch current rankings
    const response = await fetch(`${url}/get/rankings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    
    let rankings = MOCK_RANKINGS;
    if (data.result) {
      try {
        rankings = JSON.parse(data.result);
      } catch (e) {
        console.error("Failed to parse rankings from Redis:", e);
      }
    }

    // Filter out the matching entry (only delete one matching instance)
    const updatedRankings = [];
    let deleted = false;
    for (const r of rankings) {
      if (!deleted &&
          r.grade === entryToDelete.grade &&
          r.classGroup === entryToDelete.classGroup &&
          r.name === entryToDelete.name &&
          r.playTime === entryToDelete.playTime &&
          r.lineage === entryToDelete.lineage &&
          r.date === entryToDelete.date) {
        deleted = true;
        continue;
      }
      updatedRankings.push(r);
    }

    // Save back to Redis
    await fetch(`${url}/set/rankings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(updatedRankings)
    });

    return res.status(200).json(updatedRankings);
  } catch (e) {
    console.error("Serverless delete error:", e);
    return res.status(500).json({ error: e.message });
  }
}
