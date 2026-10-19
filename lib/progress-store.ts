import type {StudyState} from '../app/study/core';
export type Query=(sql:string,params?:unknown[])=>Promise<Record<string,unknown>[]>;
export function postgresStore(query:Query){
 let initialized:Promise<unknown>|undefined;
 async function init(){if(!initialized)initialized=query('CREATE TABLE IF NOT EXISTS kotoba_progress (id TEXT PRIMARY KEY, state JSONB NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())').catch(e=>{initialized=undefined;throw e});await initialized;}
 return {
  async read(){await init();const rows=await query('SELECT state, revision FROM kotoba_progress WHERE id = $1',['owner']);return rows.length?{state:rows[0].state as StudyState,revision:Number(rows[0].revision)}:{state:null,revision:0};},
  async write(state:StudyState,revision:number){await init();const rows=revision===0?await query('INSERT INTO kotoba_progress (id,state,revision) VALUES ($1,$2::jsonb,1) ON CONFLICT (id) DO NOTHING RETURNING revision',['owner',JSON.stringify(state)]):await query('UPDATE kotoba_progress SET state=$1::jsonb, revision=revision+1, updated_at=NOW() WHERE id=$2 AND revision=$3 RETURNING revision',[JSON.stringify(state),'owner',revision]);return rows.length?Number(rows[0].revision):null;}
 };
}
