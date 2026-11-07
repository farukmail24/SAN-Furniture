import fs from "fs";

const file = "apps/backend/src/modules/content/default-sections.mjs";
let content = fs.readFileSync(file, "utf8");
content = content.replaceAll('href: "/categories/', 'href: "/');
fs.writeFileSync(file, content, "utf8");
console.log("default-sections.mjs updated successfully");
