import fs from 'fs';
import { FURNITURE_SUBTYPES, productMatchesSubType, getCategorySubTypes } from '../packages/types/dist/taxonomy.js';

const data = JSON.parse(fs.readFileSync('./apps/storefront/src/lib/products-seed-data.json', 'utf8'));
const prods = Array.isArray(data) ? data : data.products;

const categories = ['cat_living', 'cat_sofas', 'cat_dining', 'cat_beds', 'cat_kids', 'cat_office', 'cat_bathroom'];

for (const catId of categories) {
  const catProds = prods.filter(p => p.category_id === catId);
  const subTypes = getCategorySubTypes(catId);
  console.log(`\n=================== ${catId} (${catProds.length} products) ===================`);
  console.log('Registered Sub-types:', subTypes.map(s => `${s.id} (${s.label})`));
  
  for (const st of subTypes) {
    const matched = catProds.filter(p => productMatchesSubType(p, st));
    console.log(`  -> [${st.id}] "${st.label}": ${matched.length} items`);
    if (matched.length > 0) {
      console.log(`      e.g. ${matched.slice(0, 2).map(p => p.title).join(' | ')}`);
    }
  }

  const unclassified = catProds.filter(p => !subTypes.some(st => productMatchesSubType(p, st)));
  if (unclassified.length > 0) {
    console.log(`  ⚠️ UNCLASSIFIED (${unclassified.length} items):`, unclassified.map(p => p.title));
  }
}
