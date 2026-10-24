import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

console.log("> Preparing SAN Furniture cPanel Production Deployment Archive...");

const rootDir = process.cwd();
const tarOutputFile = path.resolve(rootDir, "san-furniture-production.tar.gz");
const zipOutputFile = path.resolve(rootDir, "san-furniture-production.zip");

if (fs.existsSync(tarOutputFile)) fs.unlinkSync(tarOutputFile);
if (fs.existsSync(zipOutputFile)) fs.unlinkSync(zipOutputFile);

const excludes = [
  "--exclude=.git",
  "--exclude=node_modules",
  "--exclude=apps/storefront/.next/cache",
  "--exclude=scratch",
  "--exclude=*.tar.gz",
  "--exclude=*.zip",
  "--exclude=.env",
];

const targets = [
  "apps",
  "packages",
  "server.js",
  ".htaccess",
  "next.config.js",
  "package.json",
  "package-lock.json",
  ".env.example",
  "README.md",
  "CPANEL_DEPLOYMENT_GUIDE.md",
  "database",
  "san_furniture.sql",
  "update_compliance_latest.sql",
];

const excludeArgs = excludes.join(" ");
const targetArgs = targets.join(" ");

console.log("> Creating san-furniture-production.tar.gz...");
const tarCmd = `tar -czf "san-furniture-production.tar.gz" ${excludeArgs} ${targetArgs}`;
execSync(tarCmd, { stdio: "inherit", cwd: rootDir });

console.log("> Creating san-furniture-production.zip...");
const zipCmd = `tar -a -cf "san-furniture-production.zip" ${excludeArgs} ${targetArgs}`;
execSync(zipCmd, { stdio: "inherit", cwd: rootDir });

const tarSizeMB = (fs.statSync(tarOutputFile).size / 1024 / 1024).toFixed(2);
const zipSizeMB = (fs.statSync(zipOutputFile).size / 1024 / 1024).toFixed(2);

console.log(`> SUCCESS! Created:`);
console.log(`  - san-furniture-production.tar.gz (${tarSizeMB} MB)`);
console.log(`  - san-furniture-production.zip (${zipSizeMB} MB)`);
