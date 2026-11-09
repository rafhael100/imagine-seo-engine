/**
 * SEO-F5 — Importa somente a tabela de CONSULTAS do CSV padrão
 * exportado manualmente pelo Google Search Console, em PT-BR ou EN.
 * Não usa OAuth, rede ou arquivo persistente e não imprime consultas brutas.
 */
const MAX_BYTES=10*1024*1024;
const MAX_ROWS=100000;
const MAX_CELL=1000;
const columns=Object.freeze({
  query:['top queries','queries','query','principais consultas','consultas','consulta'],
  clicks:['clicks','cliques'],
  impressions:['impressions','impressoes'],
  ctr:['ctr'],
  position:['position','posicao','posicao media','average position']
});
const clean=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .trim().toLocaleLowerCase('pt-BR').replace(/\s+/g,' ');
function readRows(text,separator){
  const rows=[];
  let row=[],cell='',inQuotes=false,wasClosed=false;
  const commitCell=()=>{
    if(cell.length>MAX_CELL)throw Error('GSC CSV: cell too long');
    row.push(cell);cell='';wasClosed=false;
  };
  const commitRow=()=>{
    commitCell();
    if(!(row.length===1&&row[0].trim()===''))rows.push(row);
    row=[];
    if(rows.length>MAX_ROWS+1)throw Error('GSC CSV: too many rows');
  };
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQuotes){
      if(c==='"'){
        if(text[i+1]==='"'){cell+='"';i++;}
        else {inQuotes=false;wasClosed=true;}
      } else if(c==='\r'&&text[i+1]==='\n'){cell+='\n';i++;}
      else cell+=c;
    }else if(c==='"'){
      if(cell!==''||wasClosed)throw Error('GSC CSV: invalid quote placement');
      inQuotes=true;
    }else if(c===separator){
      commitCell();
    }else if(c==='\n'||c==='\r'){
      if(c==='\r'&&text[i+1]==='\n')i++;
      commitRow();
    }else{
      if(wasClosed)throw Error('GSC CSV: text after closing quote');
      cell+=c;
    }
    if(cell.length>MAX_CELL)throw Error('GSC CSV: cell too long');
  }
  if(inQuotes)throw Error('GSC CSV: unclosed quote');
  if(row.length>0||cell!=='')commitRow();
  return rows;
}
function integer(raw,label,index){
  if(!/^\d+$/.test(raw.trim()))throw Error('GSC CSV: invalid '+label+' row '+index);
  const value=Number(raw.trim());
  if(!Number.isSafeInteger(value))throw Error('GSC CSV: invalid '+label+' row '+index);
  return value;
}
function decimal(raw,label,index){
  const value=raw.trim().replace(',','.');
  if(!/^\d+(?:\.\d+)?$/.test(value))throw Error('GSC CSV: invalid '+label+' row '+index);
  const n=Number(value);
  if(!Number.isFinite(n))throw Error('GSC CSV: invalid '+label+' row '+index);
  return n;
}
function ctrValue(raw,index){
  const value=raw.trim(),pct=value.endsWith('%');
  const n=decimal(pct?value.slice(0,-1).trim():value,'CTR',index);
  const ctr=pct?n/100:n;
  if(ctr<0||ctr>1)throw Error('GSC CSV: invalid CTR row '+index);
  return ctr;
}
export function importGscQueriesCsv(contents,{startDate,endDate}={}){
  if(typeof contents!=='string' || Buffer.byteLength(contents,'utf8')>MAX_BYTES){
    throw Error('GSC CSV: string file <= 10 MiB required');
  }
  if(typeof startDate!=='string'||typeof endDate!=='string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)){
    throw Error('GSC CSV: explicit startDate/endDate required');
  }
  const body=contents.replace(/^\uFEFF/,'');
  // CSV PT-BR pode usar ";" para permitir número decimal com vírgula.
  const first=body.split(/\r?\n/,1)[0];
  const separator=first.includes(';')?';':',';
  const records=readRows(body,separator);
  if(records.length<1)throw Error('GSC CSV: missing header');
  const headers=records[0].map(clean);
  if(headers.length!==5||new Set(headers).size!==5)throw Error('GSC CSV: expected five unique query metric columns');
  const map={};
  for(const [name,aliases] of Object.entries(columns)){
    const found=headers.map((h,i)=>aliases.includes(h)?i:-1).filter(i=>i>=0);
    if(found.length!==1)throw Error('GSC CSV: invalid or missing '+name+' header');
    map[name]=found[0];
  }
  const rows=[];
  for(const [i,record] of records.slice(1).entries()){
    const index=i+2;
    if(record.length!==5)throw Error('GSC CSV: wrong number of columns row '+index);
    const query=record[map.query];
    if(query.trim()===''||query.length>500)throw Error('GSC CSV: invalid query row '+index);
    const clicks=integer(record[map.clicks],'clicks',index);
    const impressions=integer(record[map.impressions],'impressions',index);
    const ctr=ctrValue(record[map.ctr],index);
    const position=decimal(record[map.position],'position',index);
    if(clicks>impressions||position<1||Math.abs((impressions?clicks/impressions:0)-ctr)>0.02){
      throw Error('GSC CSV: inconsistent metrics row '+index);
    }
    rows.push({keys:[query],clicks,impressions,ctr,position});
  }
  return {dimensions:['query'],startDate,endDate,rows};
}
