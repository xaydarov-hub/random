import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { readFile,mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),port=Number(process.env.PORT??3000),dbPort=Number(process.env.DEMO_DB_PORT??55432);
await mkdir(path.join(root,'.local-demo'),{recursive:true});
const db=await PGlite.create(path.join(root,'.local-demo','postgres'),{extensions:{pgcrypto}});
const initialized=await db.query("select exists(select 1 from pg_tables where schemaname='public' and tablename='giveaways') as present");
if(!initialized.rows[0].present){
  await db.exec("create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to authenticated,anon;");
  await db.exec(await readFile(path.join(root,'supabase/migrations/202609140001_randompick.sql'),'utf8'));
  const userId='10000000-0000-4000-8000-000000000001';
  await db.query('insert into auth.users(id) values($1)',[userId]);
  const result=await db.query("insert into participant_lists(user_id,name,type,total_rows,valid_rows) values($1,'Demo — 30 sinov ishtirokchisi','participants',30,30) returning id",[userId]);
  const followers=await db.query("insert into participant_lists(user_id,name,type,total_rows,valid_rows) values($1,'Demo — 15 obunachi','followers',15,15) returning id",[userId]);
  for(let i=1;i<=30;i++){const username='demo_user_'+String(i).padStart(2,'0');await db.query('insert into participant_list_entries(user_id,list_id,username_original,username_normalized,ordinal) values($1,$2,$3,$3,$4)',[userId,result.rows[0].id,username,i]);if(i<=15)await db.query('insert into participant_list_entries(user_id,list_id,username_original,username_normalized,ordinal) values($1,$2,$3,$3,$4)',[userId,followers.rows[0].id,username,i]);}
}
const server=new PGLiteSocketServer({db,host:'127.0.0.1',port:dbPort});await server.start();
const child=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'dev','--webpack','-H','127.0.0.1','-p',String(port)],{cwd:root,stdio:'inherit',windowsHide:true,env:{...process.env,NODE_ENV:'development',NEXT_PUBLIC_DEMO_MODE:'true',NEXT_PUBLIC_APP_URL:`http://localhost:${port}`,DATABASE_URL:`postgresql://postgres:postgres@127.0.0.1:${dbPort}/postgres`,DATABASE_SSL:'false',DEMO_SESSION_SECRET:randomBytes(32).toString('hex')}});
console.log(`Demo: http://localhost:${port}/demo (development only)`);
let closing=false;async function close(){if(closing)return;closing=true;child.kill();await server.stop();await db.close();}
process.on('SIGINT',()=>close().then(()=>process.exit(0)));process.on('SIGTERM',()=>close().then(()=>process.exit(0)));child.on('exit',code=>close().then(()=>process.exit(code??0)));
