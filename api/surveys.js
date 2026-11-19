import { neon } from '@neondatabase/serverless';
function db(){if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL no está configurada'); return neon(process.env.DATABASE_URL)}
let initialized=false;
async function init(sql){if(initialized)return; await sql`CREATE TABLE IF NOT EXISTS catalog_surveys (
 id BIGSERIAL PRIMARY KEY, fecha DATE NOT NULL, nomina TEXT NOT NULL, numero_socio TEXT NOT NULL,
 tienda TEXT NOT NULL, area TEXT NOT NULL, p1 TEXT NOT NULL, frecuencia TEXT DEFAULT '', p2 TEXT DEFAULT '',
 p3 TEXT DEFAULT '', p4 TEXT DEFAULT '', p5a TEXT DEFAULT '', p5b TEXT DEFAULT '', p5br TEXT DEFAULT '',
 p6 TEXT DEFAULT '', p6d TEXT DEFAULT '', p2clasificacion TEXT DEFAULT '', p5clasificacion TEXT DEFAULT '', p5detalleprecio TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW()
)`; await sql`ALTER TABLE catalog_surveys ADD COLUMN IF NOT EXISTS p2clasificacion TEXT DEFAULT ''`; await sql`ALTER TABLE catalog_surveys ADD COLUMN IF NOT EXISTS p5clasificacion TEXT DEFAULT ''`; await sql`ALTER TABLE catalog_surveys ADD COLUMN IF NOT EXISTS p5detalleprecio TEXT DEFAULT ''`; await sql`CREATE INDEX IF NOT EXISTS idx_catalog_surveys_tienda_fecha ON catalog_surveys(tienda,fecha DESC)`; await sql`CREATE INDEX IF NOT EXISTS idx_catalog_surveys_fecha ON catalog_surveys(fecha DESC)`; initialized=true}
function stores(req){const raw=String(req.query?.stores||'').trim(); return raw?raw.split(',').map(x=>decodeURIComponent(x).trim().toUpperCase()).filter(Boolean):[]}
function isoDate(v){v=String(v||'').trim();return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:''}
export default async function handler(req,res){try{const sql=db(); await init(sql); res.setHeader('Cache-Control','no-store');
 if(req.method==='POST'){const r=req.body||{}; const required=['nomina','numeroSocio','tienda','area','p1']; if(required.some(k=>!String(r[k]??'').trim())) return res.status(400).json({error:'Faltan datos obligatorios'}); const tienda=String(r.tienda).trim().toUpperCase(); const out=await sql`INSERT INTO catalog_surveys(fecha,nomina,numero_socio,tienda,area,p1,frecuencia,p2,p3,p4,p5a,p5b,p5br,p6,p6d,p2clasificacion,p5clasificacion,p5detalleprecio) VALUES((NOW() AT TIME ZONE 'America/Mexico_City')::date,${String(r.nomina)},${String(r.numeroSocio)},${tienda},${r.area},${r.p1},${r.frecuencia||''},${r.p2||''},${r.p3||''},${r.p4||''},${r.p5a||''},${r.p5b||''},${r.p5br||''},${r.p6||''},${r.p6d||''},${r.p2clasificacion||''},${r.p5clasificacion||''},${r.p5detalleprecio||''}) RETURNING id`; return res.status(200).json({ok:true,id:String(out[0].id)})}
 if(req.method==='GET'){const mode=String(req.query?.mode||'dashboard'), ss=stores(req), from=isoDate(req.query?.from), to=isoDate(req.query?.to);
  if(mode==='stats'){
   const hoy=(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
   const [agg,b]=await Promise.all([
    sql`SELECT COUNT(*)::int AS total, COUNT(DISTINCT NULLIF(TRIM(numero_socio),''))::int AS socios, COUNT(DISTINCT NULLIF(TRIM(tienda),''))::int AS tiendas, COUNT(*) FILTER (WHERE fecha=${hoy}::date)::int AS hoy FROM catalog_surveys WHERE (${ss.length===0} OR UPPER(TRIM(tienda))=ANY(${ss})) AND (${from==='' } OR fecha>=${from||'0001-01-01'}::date) AND (${to==='' } OR fecha<=${to||'9999-12-31'}::date)`,
    sql`SELECT pg_total_relation_size('catalog_surveys')::bigint bytes`
   ]);
   return res.status(200).json({...agg[0],bytes:String(b[0]?.bytes||0)});
  }
  if(mode==='detail' || mode==='dashboard'){
   // Cursor pagination: bounded responses reduce peak memory and avoid oversized API payloads.
   // Dashboard still retrieves every matching row in pages because its detailed breakdowns
   // and unique-member age segmentation require the original interview-level evidence.
   const limit=Math.min(500,Math.max(50,Number.parseInt(req.query?.limit||'300',10)||300));
   const cursorDate=isoDate(req.query?.cursorDate), cursorId=Math.max(0,Number.parseInt(req.query?.cursorId||'0',10)||0);
   const rows=mode==='detail'
    ? await sql`SELECT id,fecha::text,nomina,numero_socio AS "numeroSocio",tienda,area,p1,frecuencia,p2,p3,p4,p5a,p5b,p5br,p6,p6d,p2clasificacion,p5clasificacion,p5detalleprecio,created_at::text AS creado FROM catalog_surveys WHERE (${ss.length===0} OR UPPER(TRIM(tienda))=ANY(${ss})) AND (${from==='' } OR fecha>=${from||'0001-01-01'}::date) AND (${to==='' } OR fecha<=${to||'9999-12-31'}::date) AND (${!cursorDate || !cursorId} OR (fecha,id)<(${cursorDate||'9999-12-31'}::date,${cursorId||0}::bigint)) ORDER BY fecha DESC,id DESC LIMIT ${limit}`
    : await sql`SELECT id,fecha::text,nomina,numero_socio AS "numeroSocio",tienda,area,p1,frecuencia,p2,p3,p4,p5a,p5b,p5br,p6,p6d,p2clasificacion,p5clasificacion,p5detalleprecio FROM catalog_surveys WHERE (${ss.length===0} OR UPPER(TRIM(tienda))=ANY(${ss})) AND (${from==='' } OR fecha>=${from||'0001-01-01'}::date) AND (${to==='' } OR fecha<=${to||'9999-12-31'}::date) AND (${!cursorDate || !cursorId} OR (fecha,id)<(${cursorDate||'9999-12-31'}::date,${cursorId||0}::bigint)) ORDER BY fecha DESC,id DESC LIMIT ${limit}`;
   res.setHeader('Cache-Control','private, max-age=15, stale-while-revalidate=30');
   return res.status(200).json({rows,nextCursor:rows.length===limit?{date:rows[rows.length-1].fecha,id:rows[rows.length-1].id}:null,hasMore:rows.length===limit});
  }
 }
 res.setHeader('Allow','GET, POST'); return res.status(405).json({error:'Método no permitido'});
}catch(e){console.error(e); return res.status(500).json({error:e.message||'Error interno'})}}
