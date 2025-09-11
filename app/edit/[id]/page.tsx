'use client'

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ImprovedBoxForm from '@/components/ImprovedBoxForm';

import type { Box } from '@/types';

export default function EditBox() {
  const [box, setBox] = useState<Box | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    fetchBox();
  }, [id]);

  const fetchBox = async () => {
    try {
      const response = await fetch(`/api/boxes/${id}`);
      if (response.ok) {
        const boxData = await response.json();
        setBox(boxData);
      } else {
        console.error('Failed to fetch box');
      }
    } catch (error) {
      console.error('Error fetching box:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <div className="text-red-500 text-lg">Box nicht gefunden</div>
      </div>
    );
  }

  return <ImprovedBoxForm mode="edit" existingBox={box} />;
}