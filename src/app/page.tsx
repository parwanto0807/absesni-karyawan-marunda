import LandingPage from '@/components/LandingPage';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLandingSettings, getLandingActivities, getLandingServices } from '@/actions/landing';

export default async function Home({ searchParams }: { searchParams: Promise<{ landing?: string }> }) {
  const params = await searchParams;
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  }

  const [settings, activities, services] = await Promise.all([
    getLandingSettings(),
    getLandingActivities(),
    getLandingServices()
  ]);

  const isBypass = params.landing === 'true';

  if (settings['landing_default_page'] === 'login' && !isBypass) {
    redirect('/login');
  }

  return <LandingPage settings={settings} activities={activities} services={services} />;
}
