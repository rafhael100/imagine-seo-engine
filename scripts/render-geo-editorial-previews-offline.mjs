/**
 * SEO F112: local-only, private, non-indexable HTML editorial previews.
 * No HTTP server, deployment, browser automation or public route.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {prepareLocalMunicipalEditorialPreviews}
  from '../src/geo-editorial-html-previews.mjs';

const [draftFile,inventoryFile,referenceFile,outputDir,...extra]=process.argv.slice(2);
if(!draftFile||!inventoryFile||!referenceFile||!outputDir||
   extra.length || new Set([draftFile,inventoryFile,referenceFile,outputDir]).size!==4){
  console.error('Usage: node scripts/render-geo-editorial-previews-offline.mjs <drafts.json> <inventory.json> <reference.json> <new-directory>');
  process.exitCode=2;
}else try{
  const drafts=parseSafeJson(await readBoundedLocalText(draftFile,{
    maxBytes:512*1024
  }));
  const inventory=parseSafeJson(await readBoundedLocalText(inventoryFile,{
    maxBytes:10*1024*1024
  }));
  const reference=parseSafeJson(await readBoundedLocalText(referenceFile,{
    maxBytes:2*1024*1024
  }));
  const result=prepareLocalMunicipalEditorialPreviews({
    screenInput:{draftBatchInput:drafts,inventoryInput:inventory},
    municipalityReference:reference
  });
  if(result.documents.length>0){
    // Exclusive new directory; parent is a trusted local development path.
    // Never write into an existing site/dist/build/public directory.
    await mkdir(outputDir,{mode:0o700});
    for(const document of result.documents){
      // File names are generated from bounded integer indices only.
      await writeFile(join(outputDir,document.fileName),document.html,{
        flag:'wx',mode:0o600
      });
    }
  }
  console.log(JSON.stringify({
    reviewedDrafts:result.summary.reviewedDrafts,
    localPreviewFilesCreated:result.documents.length,
    blockedDrafts:result.summary.blockedDrafts,
    ibgeSourceAuthenticated:false,
    humanPublicationApproved:false,
    outputDirectoryCreated:result.documents.length>0,
    releaseStatus:'HOLD_INTERNAL_EDITORIAL_REVIEW_ONLY'
  }));
}catch(error){
  console.error('SEO private preview refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
