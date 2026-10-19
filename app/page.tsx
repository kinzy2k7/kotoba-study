import {redirect} from 'next/navigation';
import {getStudyUser} from '../lib/auth';
import StudyApp from './study/StudyApp';
export const dynamic='force-dynamic';
export default async function Home(){if(!await getStudyUser())redirect('/login');return <StudyApp/>}
