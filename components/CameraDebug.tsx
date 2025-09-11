'use client'

import { useEffect, useState } from 'react';

export default function CameraDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkCameraSupport = async () => {
      const info: any = {
        userAgent: navigator.userAgent,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
        isSecureContext: window.isSecureContext,
      };

      // Check available cameras
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          info.videoInputs = devices.filter(device => device.kind === 'videoinput').length;
          info.devices = devices.map(device => ({
            kind: device.kind,
            label: device.label || 'Unknown',
            deviceId: device.deviceId.slice(0, 20) + '...'
          }));
        } catch (err) {
          info.deviceError = (err as Error).message;
        }
      }

      // Test basic camera access
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          info.cameraAccessible = true;
          info.cameraError = null;
          // Clean up
          stream.getTracks().forEach(track => track.stop());
        } catch (err: any) {
          info.cameraAccessible = false;
          info.cameraError = {
            name: err.name,
            message: err.message
          };
        }
      }

      setDebugInfo(info);
    };

    checkCameraSupport();
  }, []);

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
      <h3 className="font-bold mb-4">Camera Debug Information</h3>
      <pre className="text-xs overflow-auto bg-white dark:bg-gray-900 p-2 rounded">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
}