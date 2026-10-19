import {redirect} from 'next/navigation';
import {getStudyUser} from '../../lib/auth';
import Login from './Login';
export const dynamic='force-dynamic';
export default async function Page(){if(await getStudyUser())redirect('/');return <Login/>}
