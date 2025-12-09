'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Video, Plus, Play, Calendar, Clock, Trash2, Edit2, Check, X, Download, Timer, Image as ImageIcon } from 'lucide-react';
import WatermarkManager from '@/components/WatermarkManager';
import Header from '@/components/Header';

interface Recording {
  id: number;
  title: string;
  filename: string;
  thumbnailFilename?: string;
  duration?: number;
  createdAt: string;
  Watermark?: {
    filename: string;
    position: string;
  };
}

export default function Dashboard() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showWatermarks, setShowWatermarks] = useState(false);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const res = await api.get('/recordings');
        setRecordings(res.data);
      } catch (err) {
        console.error("Failed to fetch recordings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecordings();
  }, []);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/recordings/${deleteId}`);
      setRecordings(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  }

  const startEditing = (rec: Recording) => {
    setEditingId(rec.id);
    setEditTitle(rec.title);
  }

  const saveTitle = async (id: number) => {
    try {
      await api.put(`/recordings/${id}`, { title: editTitle });
      setRecordings(prev => prev.map(r => r.id === id ? { ...r, title: editTitle } : r));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update title");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <Header>
          <Link
            href="/record"
            className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-2 font-medium shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
          >
            <Plus className="w-5 h-5" />
            New Recording
          </Link>
          <button
            onClick={() => setShowWatermarks(true)}
            className="px-4 py-3 rounded-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
          >
            <ImageIcon className="w-5 h-5" />
            Watermarks
          </button>
        </Header>

        <WatermarkManager isOpen={showWatermarks} onClose={() => setShowWatermarks(false)} />

        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading recordings...</div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed shadow-sm">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No recordings yet</h3>
            <p className="text-gray-500 mb-6">Start recording your screen and camera today.</p>
            <Link
              href="/record"
              className="px-6 py-2 rounded-full bg-white hover:bg-gray-50 border border-gray-200 transition-all inline-flex items-center gap-2 text-gray-700 font-medium shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Record First Video
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recordings.map((rec) => (
              <div key={rec.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-300 transition-all hover:shadow-xl hover:shadow-blue-500/10">
                <div className="aspect-video bg-gray-100 relative">
                  {rec.thumbnailFilename ? (
                    <img
                      src={`http://localhost:5005/recordings/${rec.thumbnailFilename}`}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      alt={rec.title}
                    />
                  ) : (
                    <video
                      src={`http://localhost:5005/recordings/${rec.filename}`}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  )}



                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <a
                      href={`http://localhost:5005/recordings/${rec.filename}`}
                      target="_blank"
                      className="p-4 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                    >
                      <Play className="w-8 h-8 text-white fill-current" />
                    </a>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {editingId === rec.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                        <button onClick={() => saveTitle(rec.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors text-gray-900 flex-1" title={rec.title}>
                          {rec.title}
                        </h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditing(rec)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Rename">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <a
                            href={`http://localhost:5005/api/recordings/${rec.id}/export`}
                            target="_blank"
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            title="Export to MP4"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button onClick={() => setDeleteId(rec.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {rec.duration && (
                      <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                        <Timer className="w-4 h-4" />
                        {new Date(rec.duration * 1000).toISOString().substr(11, 8)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Recording</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete this recording? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors shadow-lg shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
