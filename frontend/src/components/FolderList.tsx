import React, { useState } from 'react';
import { Folder, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import api from '@/lib/api';

interface FolderData {
    id: number;
    name: string;
}

interface FolderListProps {
    folders: FolderData[];
    onFolderClick: (id: number) => void;
    onUpdate: () => void;
}

export default function FolderList({ folders, onFolderClick, onUpdate }: FolderListProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    const handleRename = async (id: number) => {
        try {
            await api.put(`/folders/${id}`, { name: editName });
            setEditingId(null);
            onUpdate();
        } catch (error) {
            console.error('Error renaming folder:', error);
            alert('Failed to rename folder');
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this folder?')) return;
        try {
            await api.delete(`/folders/${id}`);
            onUpdate();
        } catch (error) {
            console.error('Error deleting folder:', error);
            alert('Failed to delete folder');
        }
    };

    const startEditing = (folder: FolderData, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(folder.id);
        setEditName(folder.name);
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {folders.map(folder => (
                <div
                    key={folder.id}
                    onClick={() => {
                        if (editingId !== folder.id) onFolderClick(folder.id);
                    }}
                    className="group bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer flex flex-col items-center text-center relative"
                >
                    <Folder className="w-12 h-12 text-blue-100 fill-blue-500 mb-3 group-hover:scale-110 transition-transform" />

                    {editingId === folder.id ? (
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => handleRename(folder.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(folder.id)}
                            className="w-full text-sm text-center border-b border-blue-500 focus:outline-none"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <h4 className="font-medium text-gray-700 w-full truncate px-2" title={folder.name}>
                            {folder.name}
                        </h4>
                    )}

                    {!editingId && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                                onClick={(e) => startEditing(folder, e)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                            >
                                <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => handleDelete(folder.id, e)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
