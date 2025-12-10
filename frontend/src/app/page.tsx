'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Video, Plus, Play, Calendar, Clock, Trash2, Edit2, Check, X, Download, Timer, Image as ImageIcon, FolderPlus, FolderOpen, ArrowLeft, FolderInput } from 'lucide-react';
import WatermarkManager from '@/components/WatermarkManager';
import Header from '@/components/Header';
import FolderList from '@/components/FolderList';
import CreateFolderModal from '@/components/CreateFolderModal';
import MoveToFolderModal from '@/components/MoveToFolderModal';

interface Recording {
  id: number;
  title: string;
  filename: string;
  thumbnailFilename?: string;
  duration?: number;
  createdAt: string;
  folderId?: number;
  Watermark?: {
    filename: string;
    position: string;
  };
}

interface Folder {
  id: number;
  name: string;
}

export default function Dashboard() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showWatermarks, setShowWatermarks] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [moveModalRecordingId, setMoveModalRecordingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const foldersRes = await api.get('/folders');
      setFolders(foldersRes.data);

      const recordingsRes = await api.get('/recordings', {
        params: { folderId: currentFolderId || 'null' }
      });
      setRecordings(recordingsRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentFolderId]);

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

  const getCurrentFolderName = () => {
    if (!currentFolderId) return null;
    return folders.find(f => f.id === currentFolderId)?.name;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <Header>
          <div className="flex items-center gap-3">
            <Link
              href="/record"
              className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-2 font-medium shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Video
            </Link>
            {!currentFolderId && (
              <button
                onClick={() => setShowCreateFolder(true)}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all flex items-center gap-2 font-medium shadow-sm hover:shadow-md text-sm"
              >
                <FolderPlus className="w-4 h-4" />
                New Folder
              </button>
            )}
            <button
              onClick={() => setShowWatermarks(true)}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-all flex items-center gap-2 font-medium shadow-sm hover:shadow-md text-sm"
            >
              <ImageIcon className="w-4 h-4" />
              Watermarks
            </button>
          </div>
        </Header>

        <WatermarkManager isOpen={showWatermarks} onClose={() => setShowWatermarks(false)} />
        <CreateFolderModal
          isOpen={showCreateFolder}
          onClose={() => setShowCreateFolder(false)}
          onCreated={fetchData}
        />
        <MoveToFolderModal
          isOpen={!!moveModalRecordingId}
          onClose={() => setMoveModalRecordingId(null)}
          onMoved={fetchData}
          recordingId={moveModalRecordingId}
          folders={folders}
        />

        {/* Breadcrumbs / Navigation */}
        {currentFolderId && (
          <div className="mb-6 flex items-center gap-2 text-lg font-medium text-gray-600">
            <button
              onClick={() => setCurrentFolderId(null)}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-500" />
              {getCurrentFolderName()}
            </span>
          </div>
        )}

        {/* Folders List (Only on Home) */}
        {!currentFolderId && (
          <FolderList
            folders={folders}
            onFolderClick={setCurrentFolderId}
            onUpdate={fetchData}
          />
        )}

        {/* Recordings Grid */}
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed shadow-sm">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No recordings found</h3>
            <p className="text-gray-500 mb-6">
              {currentFolderId ? "This folder is empty." : "Start recording your screen and camera today."}
            </p>
            {!currentFolderId && (
              <Link
                href="/record"
                className="px-6 py-2 rounded-full bg-white hover:bg-gray-50 border border-gray-200 transition-all inline-flex items-center gap-2 text-gray-700 font-medium shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                Record First Video
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recordings.map((rec) => (
              <div key={rec.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-300 transition-all hover:shadow-xl hover:shadow-blue-500/10 flex flex-col">
                <div className="aspect-video bg-gray-100 relative">
                  {rec.thumbnailFilename ? (
                    <img
                      src={`/recordings/${rec.thumbnailFilename}`}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      alt={rec.title}
                    />
                  ) : (
                    <video
                      src={`/recordings/${rec.filename}`}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  )}

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <a
                      href={`/recordings/${rec.filename}`}
                      target="_blank"
                      className="p-4 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                    >
                      <Play className="w-8 h-8 text-white fill-current" />
                    </a>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
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
                          <button onClick={() => setMoveModalRecordingId(rec.id)} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors" title="Move to Folder">
                            <FolderInput className="w-4 h-4" />
                          </button>
                          <a
                            href={`/api/recordings/${rec.id}/export`}
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

                  <div className="mt-auto flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </div>
                      {rec.duration && (
                        <div className="flex items-center gap-1.5 text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded text-xs">
                          <Timer className="w-3 h-3" />
                          {new Date(rec.duration * 1000).toISOString().substr(11, 8)}
                        </div>
                      )}
                    </div>
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
