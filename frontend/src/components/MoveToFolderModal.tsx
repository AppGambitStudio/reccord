import React, { useState } from 'react';
import { FolderInput, X } from 'lucide-react';
import api from '@/lib/api';

interface Folder {
    id: number;
    name: string;
}

interface MoveToFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMoved: () => void;
    recordingId: number | null;
    folders: Folder[];
}

export default function MoveToFolderModal({ isOpen, onClose, onMoved, recordingId, folders }: MoveToFolderModalProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen || !recordingId) return null;

    const handleMove = async (folderId: number | null) => {
        setLoading(true);
        try {
            await api.put(`/recordings/${recordingId}`, { folderId });
            onMoved();
            onClose();
        } catch (error) {
            console.error('Error moving recording:', error);
            alert('Failed to move recording');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FolderInput className="w-6 h-6 text-blue-600" />
                        Move to Folder
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                    <button
                        onClick={() => handleMove(null)}
                        disabled={loading}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all flex items-center gap-3"
                    >
                        <span className="text-gray-400 italic">No Folder (Home)</span>
                    </button>
                    {folders.map(folder => (
                        <button
                            key={folder.id}
                            onClick={() => handleMove(folder.id)}
                            disabled={loading}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 border border-gray-100 hover:border-blue-200 text-gray-700 font-medium transition-all"
                        >
                            {folder.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
