import {safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import { auditStaticSite } from '../src/audit-static.mjs';
import {parseStaticAuditCliArgs} from '../src/audit-cli-args.mjs';

try {
  const {target,siteUrl,strict,strictPublicHead}=parseStaticAuditCliArgs(process.argv.slice(2));
  const result = await auditStaticSite(target, { siteUrl, strictPublicHead });
  console.log(JSON.stringify(result, null, 2));
  if (result.summary.errors > 0 || (strict && result.summary.warnings > 0)) process.exitCode = 1;
} catch (error) {
  console.error('SEO audit failed:', safeCliDiagnostic(error));
  process.exitCode = 1;
}
