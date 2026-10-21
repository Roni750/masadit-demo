import { execSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'cypress';
import ExcelJS from 'exceljs';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8100',
    setupNodeEvents(on, config) {
      const downloads = config.downloadsFolder;

      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
        // Resets the database the dev API uses to the demo seed (see api/db/seed.sql)
        seedDatabase() {
          execSync('npm run db:seed -w api', { cwd: '..', stdio: 'ignore' });
          return null;
        },
        clearDownloads() {
          rmSync(downloads, { recursive: true, force: true });
          return null;
        },
        // Summarizes the first .xlsx in the downloads folder so a test can assert on its contents
        async readDownloadedWorkbook() {
          const file = readdirSync(downloads).find((name) => name.endsWith('.xlsx'));
          if (!file) return null;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.readFile(join(downloads, file));
          const sheet = workbook.worksheets[0];
          const rows: unknown[][] = [];
          sheet.eachRow((row) => rows.push((row.values as unknown[]).slice(1)));
          return {
            file,
            rightToLeft: sheet.views[0]?.rightToLeft ?? false,
            rows: JSON.parse(JSON.stringify(rows)),
          };
        },
      });
    },
  },
});
