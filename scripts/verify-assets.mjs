async function checkAssets(targetUrl = 'http://localhost:3000') {
  console.log(`Checking page: ${targetUrl}`);
  const r = await fetch(targetUrl);
  console.log(`Page status: ${r.status}`);
  const text = await r.text();
  
  const regex = /(?:src|href)=["'](\/_next\/[^"']+)["']/g;
  let match;
  const urls = new Set();
  while ((match = regex.exec(text)) !== null) {
    urls.add(match[1]);
  }
  
  console.log(`Found ${urls.size} Next.js assets on ${targetUrl}`);
  let errors = 0;
  for (const url of urls) {
    try {
      const res = await fetch(`http://localhost:3000${url}`);
      if (!res.ok) {
        console.error(`❌ HTTP ${res.status}: ${url}`);
        errors++;
      } else {
        const ct = res.headers.get('content-type') || '';
        console.log(`✅ [${res.status}] ${url.split('?')[0]} (${ct})`);
      }
    } catch (e) {
      console.error(`❌ Fetch error for ${url}:`, e.message);
      errors++;
    }
  }
  
  if (errors === 0) {
    console.log(`🎉 ALL NEXT.JS STATIC CHUNKS & STYLESHEETS ON ${targetUrl} LOAD (HTTP 200)!`);
  } else {
    console.error(`💥 ${errors} assets failed!`);
    process.exit(1);
  }
}

const target = process.argv[2] || 'http://localhost:3000';
checkAssets(target);
