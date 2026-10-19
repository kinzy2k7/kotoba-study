import 'server-only';
import {neon} from '@neondatabase/serverless';
import {postgresStore} from './progress-store';
let store:ReturnType<typeof postgresStore>|undefined;
export function databaseConfigured(){return !!(process.env.DATABASE_URL||process.env.POSTGRES_URL);}
export function getProgressStore(){
 const connection=process.env.DATABASE_URL||process.env.POSTGRES_URL;if(!connection)throw Error('DATABASE_NOT_CONFIGURED');
 if(!store){const sql=neon(connection);store=postgresStore(async(query,params=[])=>await sql.query(query,params) as Record<string,unknown>[]);}
 return store;
}
