import InteractiveMap from '@/components/InteractiveMap';

export const metadata = {
  title: 'Wohnungsplan - Box Tracker',
  description: 'Interaktiver Wohnungsplan mit Wegfindung zu allen Räumen',
};

export default function MapPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InteractiveMap />
      </div>
    </div>
  );
}