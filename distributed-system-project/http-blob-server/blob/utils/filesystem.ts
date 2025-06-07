import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { config } from "../../config.ts";

export async function dirSize(dir: string): Promise<number> {
  const files = await readdir(dir, { withFileTypes: true });

  const paths = files.map(async (file) => {
    const path = join(dir, file.name);

    if (file.isDirectory()) return await dirSize(path);

    if (file.isFile()) {
      const { size } = await stat(path);
      return size;
    }

    return 0;
  });

  return (await Promise.all(paths))
    .flat(Infinity)
    .reduce((i, size) => i + size, 0);
}

export async function countFiles(
  directoryPath: string,
): Promise<number | null> {
  try {
    const files = await readdir(directoryPath);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        return {
          name: file,
          isFile: (await stat(join(directoryPath, file))).isFile(),
        };
      }),
    );
    const fileCount = fileStats.filter((file) => file.isFile).length;
    return fileCount;
  } catch (error) {
    if ((error as { code: "ENOENT" }).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export function getFullFileDir(basePath: string, fileName: string): string {
  const hash = createHash("md5").update(fileName).digest("hex");
  let dirName = `${basePath}/${hash.slice(0, 2)}`;

  return dirName;
}
