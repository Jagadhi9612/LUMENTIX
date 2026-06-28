import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Camera, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface AttendanceRecord {
  memberId: string;
  memberName: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'checked-in' | 'checked-out';
}

export function QRAttendanceTracker() {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [memberId, setMemberId] = useState('');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [lastScanned, setLastScanned] = useState<AttendanceRecord | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera for QR scanning
  useEffect(() => {
    if (mode === 'scan') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode]);

  // Scan QR codes
  useEffect(() => {
    if (mode !== 'scan' || !videoRef.current || !canvasRef.current) return;

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, canvas.width, canvas.height);

        if (qrCode) {
          handleQRScan(qrCode.data);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [mode]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      showMessage('error', 'Failed to access camera. Please check permissions.');
      console.error('Camera error:', error);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }

  async function handleQRScan(data: string) {
    // QR code contains member ID
    await processAttendance(data.trim());
  }

  async function handleManualEntry() {
    if (!memberId.trim()) {
      showMessage('error', 'Please enter a member ID');
      return;
    }
    await processAttendance(memberId);
    setMemberId('');
  }

  async function processAttendance(id: string) {
    try {
      const response = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          memberId: id,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        showMessage('error', 'Member not found or invalid ID');
        return;
      }

      const record: AttendanceRecord = await response.json();
      setAttendance((prev) => [record, ...prev]);
      setLastScanned(record);
      showMessage('success', `${record.memberName} checked ${record.status === 'checked-in' ? 'in' : 'out'}`);

      // Play success sound
      playSuccessSound();
    } catch (error) {
      showMessage('error', 'Failed to process attendance');
      console.error('Error:', error);
    }
  }

  function playSuccessSound() {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function generateMemberQRCode() {
    const canvas = document.getElementById('member-qr-canvas') as HTMLCanvasElement;
    if (canvas && memberId) {
      await QRCode.toCanvas(canvas, memberId, { width: 200 });
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Attendance Tracking</h1>

      {/* Mode Selector */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setMode('scan')}
          className={`px-6 py-2 rounded flex items-center gap-2 ${
            mode === 'scan'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          <Camera className="w-5 h-5" />
          Scan QR
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`px-6 py-2 rounded ${
            mode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Manual Entry
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Last Scanned */}
      {lastScanned && (
        <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-200">
          <div className="flex items-center gap-3 text-blue-900">
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">{lastScanned.memberName}</p>
              <p className="text-sm text-blue-700">
                {lastScanned.status === 'checked-in' ? 'Checked In' : 'Checked Out'} at{' '}
                {new Date(lastScanned.checkInTime).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Section */}
        <div>
          {mode === 'scan' ? (
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-square object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <p className="p-4 text-center text-gray-600 text-sm">
                Position QR code in the center of the frame
              </p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Enter Member ID
              </label>
              <input
                type="text"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
                placeholder="e.g., ELT-2024-0001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleManualEntry}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Check In/Out
              </button>
            </div>
          )}
        </div>

        {/* Attendance List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Attendance
          </h2>
          <div className="max-h-96 overflow-y-auto">
            {attendance.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No attendance records yet</p>
            ) : (
              <div className="space-y-3">
                {attendance.map((record, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-gray-900">{record.memberName}</p>
                      <p className="text-sm text-gray-500">{record.memberId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(record.checkInTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className={`text-xs ${
                        record.status === 'checked-in' ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {record.status === 'checked-in' ? 'In' : 'Out'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generate QR Code Helper */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Generate Member QR Code</h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter Member ID"
            onChange={(e) => setMemberId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={generateMemberQRCode}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Generate QR
          </button>
        </div>
        <canvas id="member-qr-canvas" className="mt-4 mx-auto" />
      </div>
    </div>
  );
}
