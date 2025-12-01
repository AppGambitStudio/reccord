import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';

interface Watermark {
    id: number;
    name: string;
    filename: string;
    position: string;
}

interface WatermarkManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const POSITIONS = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-middle', label: 'Top Middle' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'middle-left', label: 'Middle Left' },
    { id: 'middle-middle', label: 'Center' },
    { id: 'middle-right', label: 'Middle Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-middle', label: 'Bottom Middle' },
    { id: 'bottom-right', label: 'Bottom Right' },
];

const WatermarkManager: React.FC<WatermarkManagerProps> = ({ isOpen, onClose }) => {
    const [watermarks, setWatermarks] = useState<Watermark[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [position, setPosition] = useState('top-right');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchWatermarks();
        }
    }, [isOpen]);

    const fetchWatermarks = async () => {
        try {
            const res = await api.get('/watermarks');
            setWatermarks(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('name', name);
        formData.append('position', position);

        try {
            await api.post('/watermarks', formData);
            // Reset form
            setName('');
            setFile(null);
            setPreview(null);
            setPosition('top-right');
            fetchWatermarks();
        } catch (err) {
            console.error(err);
            alert('Failed to upload watermark');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/watermarks/${id}`);
            setWatermarks(prev => prev.filter(w => w.id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Watermark Templates</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 flex gap-8">
                    {/* Left: Upload Form */}
                    <div className="w-1/3 space-y-6">
                        <h3 className="font-semibold text-gray-700">Add New Template</h3>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g., Company Logo"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        required
                                    />
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded" />
                                    ) : (
                                        <div className="py-4">
                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <span className="text-sm text-gray-500">Click to upload image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                <select
                                    value={position}
                                    onChange={e => setPosition(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {POSITIONS.map(p => (
                                        <option key={p.id} value={p.id}>{p.label}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {uploading ? 'Uploading...' : 'Save Template'}
                            </button>
                        </form>
                    </div>

                    {/* Right: List */}
                    <div className="flex-1 border-l border-gray-100 pl-8">
                        <h3 className="font-semibold text-gray-700 mb-4">Existing Templates</h3>
                        {loading ? (
                            <div className="text-center py-10 text-gray-500">Loading...</div>
                        ) : watermarks.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No templates yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {watermarks.map(w => (
                                    <div key={w.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white relative group">
                                        <div className="aspect-video bg-gray-100 rounded mb-2 relative overflow-hidden flex items-center justify-center">
                                            <div className="absolute inset-0 border border-gray-200 m-1 rounded border-dashed opacity-50"></div>
                                            {/* Mock positioning */}
                                            <img
                                                src={`http://localhost:5005/uploads/watermarks/${w.filename}`}
                                                className={`absolute max-w-[40%] max-h-[40%] object-contain
                                                    ${w.position.includes('top') ? 'top-2' : ''}
                                                    ${w.position.includes('bottom') ? 'bottom-2' : ''}
                                                    ${w.position.includes('left') ? 'left-2' : ''}
                                                    ${w.position.includes('right') ? 'right-2' : ''}
                                                    ${w.position === 'middle-middle' ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' : ''}
                                                    ${w.position === 'top-middle' ? 'top-2 left-1/2 transform -translate-x-1/2' : ''}
                                                    ${w.position === 'bottom-middle' ? 'bottom-2 left-1/2 transform -translate-x-1/2' : ''}
                                                    ${w.position === 'middle-left' ? 'top-1/2 left-2 transform -translate-y-1/2' : ''}
                                                    ${w.position === 'middle-right' ? 'top-1/2 right-2 transform -translate-y-1/2' : ''}
                                                `}
                                                alt={w.name}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{w.name}</p>
                                                <p className="text-xs text-gray-500 capitalize">{w.position.replace('-', ' ')}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(w.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WatermarkManager;
