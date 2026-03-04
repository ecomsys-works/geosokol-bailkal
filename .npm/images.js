import sharp from "sharp";
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import chalk from "chalk";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");

const inputDir = path.join(rootDir, "src/images/source");
const outputWebp = path.join(rootDir, "src/images/webp");
const outputAvif = path.join(rootDir, "src/images/avif");

await fs.ensureDir(outputWebp);
await fs.ensureDir(outputAvif);

const files = await glob(
  path.join(inputDir, "**/*.{jpg,jpeg,png,JPG,JPEG,PNG}").replace(/\\/g, "/")
);

if (!files.length) {
  console.log(chalk.red("Нет изображений в папке source"));
  process.exit();
}

// формируем список файлов, которые реально нужно обновить
const filesToUpdate = [];

for (const file of files) {
  const relative = path.relative(inputDir, file);
  const name = path.basename(file, path.extname(file));

  const webpPath = path.join(outputWebp, relative).replace(path.extname(relative), ".webp");
  const avifPath = path.join(outputAvif, relative).replace(path.extname(relative), ".avif");

  const webpExists = await fs.pathExists(webpPath);
  const avifExists = await fs.pathExists(avifPath);

  if (!webpExists || !avifExists) {
    filesToUpdate.push({ file, relative, webpPath, avifPath, webpExists, avifExists });
  }
}

if (!filesToUpdate.length) {
  console.log(chalk.yellow("Конвертировать нечего — все файлы уже в актуальном формате!"));
  process.exit();
}

console.log(chalk.cyan(`Нужно конвертировать ${filesToUpdate.length} файлов:\n`));

await Promise.all(
  filesToUpdate.map(async ({ file, relative, webpPath, avifPath, webpExists, avifExists }) => {
    await fs.ensureDir(path.dirname(webpPath));
    await fs.ensureDir(path.dirname(avifPath));

    try {
      if (!webpExists) {
        await sharp(file)
          .webp({ quality: 82, effort: 6 })
          .toFile(webpPath);
        console.log(chalk.green("WEBP "), relative);
      }

      if (!avifExists) {
        await sharp(file)
          .avif({ quality: 55, effort: 6 })
          .toFile(avifPath);
        console.log(chalk.magenta("AVIF "), relative);
      }
    } catch (e) {
      console.log(chalk.red("Ошибка:"), relative, e.message);
    }
  })
);

console.log(chalk.cyan("\nГотово. Пайплайн как у студии"));