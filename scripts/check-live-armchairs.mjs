import https from 'node:https';

https.get('https://sanfurniture.com/armchairs', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const canonicalMatch = data.match(/rel="canonical"\s+href="([^"]+)"/i) || data.match(/href="([^"]+)"\s+rel="canonical"/i);
    console.log('Canonical:', canonicalMatch ? canonicalMatch[1] : 'None');
    const h1Match = data.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    console.log('H1:', h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : 'None');
    const titleMatch = data.match(/<title>([\s\S]*?)<\/title>/i);
    console.log('Title:', titleMatch ? titleMatch[1].trim() : 'None');
    const breadcrumbMatch = data.match(/Living Room|Armchairs/gi);
    console.log('Matches:', breadcrumbMatch?.slice(0, 5));
  });
});
