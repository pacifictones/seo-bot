import fs from "fs";
import fetch from "node-fetch";
import { parse } from "csv-parse/sync";

// 1. Read your keywords from keywords.csv
const keywords = parse(fs.readFileSync("keywords.csv"), { columns: false })
  .flat()
  .filter(Boolean);

// 2. Setup your SerpApi details
const apiKey = process.env.SERPAPI_KEY;
const base = "https://serpapi.com/search.json";

// 3. Prepare an array to collect results
const rows = [];

// 4. Loop through each keyword
for (const kw of keywords) {
  // A) Fetch the top-10 organic results
  const res = await fetch(
    `${base}?engine=google&q=${encodeURIComponent(kw)}&api_key=${apiKey}`
  );
  const json = await res.json();
  json.organic_results?.slice(0, 10).forEach((r) => {
    rows.push({
      keyword: kw,
      type: "organic",
      position: r.position,
      title: r.title,
      url: r.link,
    });
  });

  //Add timestamp to file name

  // B) Fetch autocomplete suggestions
  const auto = await fetch(
    `${base}?engine=google_autocomplete&q=${encodeURIComponent(
      kw
    )}&api_key=${apiKey}`
  );
  const aJson = await auto.json();
  aJson.suggestions?.forEach((s) => {
    rows.push({
      keyword: kw,
      type: "autocomplete",
      position: "",
      title: s.value,
      url: "",
    });
  });
}

// 5. Write everything out as CSV
const header = "keyword,type,position,title,url\n";

// ➜ NEW line: stamp today’s date (YYYY-MM-DD)
const dateTag = new Date().toISOString().slice(0, 10); // e.g. 2025-05-12

fs.writeFileSync(
  `serp_output_${dateTag}.csv`, // ← filename now includes the date
  header +
    rows
      .map(
        (r) =>
          `"${r.keyword}","${r.type}","${r.position}","${r.title.replace(
            /"/g,
            '""'
          )}","${r.url}"`
      )
      .join("\n")
);

console.log("✅  Done! Check serp_output.csv");
