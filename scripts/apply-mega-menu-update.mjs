import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { cleanMegaMenuContent } from './verify-mega-menu-data.mjs';

async function main() {
  console.log('1. Updating apps/storefront/src/lib/cms-defaults.ts...');
  const cmsDefaultsPath = path.resolve('apps/storefront/src/lib/cms-defaults.ts');
  let cmsDefaults = fs.readFileSync(cmsDefaultsPath, 'utf8');

  // Locate header_mega_menu start and end in cmsDefaults
  const startMarker = '  header_mega_menu: {';
  const endMarker = '  home_newsletter: {';

  const startIndex = cmsDefaults.indexOf(startMarker);
  const endIndex = cmsDefaults.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not find header_mega_menu boundaries in cms-defaults.ts');
  }

  // Format cleanMegaMenuContent into TypeScript object string
  const menuContentFormatted = JSON.stringify(cleanMegaMenuContent, null, 2)
    .split('\n')
    .map((line, idx) => (idx === 0 ? line : '    ' + line))
    .join('\n');

  const newMegaMenuSection = `  header_mega_menu: {
    isEnabled: true,
    sectionName: "Desktop & Mobile Mega Menu Navigation",
    content: ${menuContentFormatted},
  },
`;

  cmsDefaults = cmsDefaults.slice(0, startIndex) + newMegaMenuSection + cmsDefaults.slice(endIndex);
  fs.writeFileSync(cmsDefaultsPath, cmsDefaults, 'utf8');
  console.log('   cms-defaults.ts updated successfully.');

  console.log('2. Updating apps/backend/src/modules/content/default-sections.mjs...');
  const backendSectionsPath = path.resolve('apps/backend/src/modules/content/default-sections.mjs');
  let backendSections = fs.readFileSync(backendSectionsPath, 'utf8');

  const backendStartMarker = '  {\n    id: "sec_header_mega_menu",';
  const backendEndMarker = '  {\n    id: "sec_home_hero",';

  const bStartIndex = backendSections.indexOf(backendStartMarker);
  const bEndIndex = backendSections.indexOf(backendEndMarker);

  if (bStartIndex === -1 || bEndIndex === -1) {
    throw new Error('Could not find sec_header_mega_menu boundaries in default-sections.mjs');
  }

  const newBackendMegaMenu = `  {
    id: "sec_header_mega_menu",
    page_key: "header",
    section_key: "header_mega_menu",
    section_name: "Desktop & Mobile Mega Menu Navigation",
    is_enabled: 1,
    sort_order: 3,
    content_json: JSON.stringify(${JSON.stringify(cleanMegaMenuContent, null, 2)}),
  },
`;

  backendSections = backendSections.slice(0, bStartIndex) + newBackendMegaMenu + backendSections.slice(bEndIndex);
  fs.writeFileSync(backendSectionsPath, backendSections, 'utf8');
  console.log('   default-sections.mjs updated successfully.');

  console.log('3. Updating MySQL local database (site_page_sections)...');
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    database: 'san_furniture',
  });

  const jsonStr = JSON.stringify(cleanMegaMenuContent);
  const [result] = await conn.query(
    "UPDATE site_page_sections SET content_json = ?, updated_at = NOW() WHERE section_key = 'header_mega_menu'",
    [jsonStr]
  );
  console.log('   MySQL updated:', result.affectedRows, 'row(s) affected.');

  await conn.end();
  console.log('All updates applied successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
