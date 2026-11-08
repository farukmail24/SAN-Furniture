async function testAllCategories() {
  const categories = ['living-room', 'sofas', 'dining', 'bedroom', 'kids', 'office', 'bathroom', 'sale'];
  console.log('Auditing all 8 category routes on https://sanfurniture.com:\n');

  for (const cat of categories) {
    const res = await fetch('https://sanfurniture.com/' + cat);
    const html = await res.text();
    const stripped = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Look for product links /products/[handle]
    const prodLinks = [...stripped.matchAll(/href="\/products\/([a-z0-9-]+)"/g)];
    const uniqueHandles = [...new Set(prodLinks.map(m => m[1]))];

    console.log(`[${res.status}] /${cat} -> ${uniqueHandles.length} unique products rendered in visible HTML`);
    if (uniqueHandles.length > 0) {
      console.log('   Sample handles:', uniqueHandles.slice(0, 3).join(', '));
    }
  }
}

testAllCategories().catch(console.error);
