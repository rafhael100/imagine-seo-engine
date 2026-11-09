import { auditStaticSite } from '../src/audit-static.mjs';

const target = process.argv[2] || 'dist';
const siteUrl = process.argv[3] || 'https://imaginecomunicacao.com.br/';
try {
  const result = await auditStaticSite(target, { siteUrl });
  console.log(JSON.stringify(result, null, 2));
  if (result.summary.errors > 0) process.exitCode = 1;
} catch (error) {
  console.error('SEO audit failed:', error.message);
  process.exitCode = 1;
}
