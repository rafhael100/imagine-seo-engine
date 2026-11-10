import {safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import { auditStaticSite } from '../src/audit-static.mjs';

const target = process.argv[2] || 'dist';
const siteUrl = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'https://imaginecomunicacao.com.br/';
const strict = process.argv.includes('--fail-on-warnings');
try {
  const result = await auditStaticSite(target, { siteUrl });
  console.log(JSON.stringify(result, null, 2));
  if (result.summary.errors > 0 || (strict && result.summary.warnings > 0)) process.exitCode = 1;
} catch (error) {
  console.error('SEO audit failed:', safeCliDiagnostic(error));
  process.exitCode = 1;
}
