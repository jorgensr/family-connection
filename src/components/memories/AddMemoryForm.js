import React, { useState } from 'react';

function AddMemoryForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaFile: null
  });
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFormData({ ...formData, mediaFile: e.target.files[0] || null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // For now, skip uploading the image due to previous issues
      // Just submit without mediaUrl or use null
      await onSubmit({
        title: formData.title,
        description: formData.description,
        mediaUrl: null
      });

      setFormData({
        title: '',
        description: '',
        mediaFile: null
      });
    } catch (err) {
      console.error('Error adding memory:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          className="border w-full p-2 rounded"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          className="border w-full p-2 rounded"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Media (optional)</label>
        <input type="file" onChange={handleFileChange} accept="image/*" />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Memory'}
      </button>
    </form>
  );
}

export default AddMemoryForm;
