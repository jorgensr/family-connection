import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { storageService } from '../../services/storageService';

function AddMemoryForm({ onSubmit, familyMembers }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaFile: null,
    selectedTags: [],
    taggedMembers: [],
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [error, setError] = useState(null);

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const { data, error } = await supabase
          .from('memory_tags')
          .select('*')
          .order('category', { ascending: true });

        if (error) throw error;
        setTags(data);
      } catch (err) {
        console.error('Error loading tags:', err);
        setError('Failed to load tags');
      }
    };

    loadTags();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload an image, video, or PDF.');
        return;
      }
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10MB.');
        return;
      }
      setFormData({ ...formData, mediaFile: file });
      setError(null);
    }
  };

  const handleTagChange = (tagId) => {
    const newTags = formData.selectedTags.includes(tagId)
      ? formData.selectedTags.filter(id => id !== tagId)
      : [...formData.selectedTags, tagId];
    setFormData({ ...formData, selectedTags: newTags });
  };

  const handleMemberTagChange = (memberId) => {
    const newTaggedMembers = formData.taggedMembers.includes(memberId)
      ? formData.taggedMembers.filter(id => id !== memberId)
      : [...formData.taggedMembers, memberId];
    setFormData({ ...formData, taggedMembers: newTaggedMembers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let mediaUrl = null;
      if (formData.mediaFile) {
        mediaUrl = await storageService.uploadFile(
          formData.mediaFile,
          'memories',
          `${Date.now()}_${formData.mediaFile.name}`
        );
      }

      await onSubmit({
        title: formData.title,
        description: formData.description,
        mediaUrl,
        selectedTags: formData.selectedTags,
        taggedMembers: formData.taggedMembers,
        category: formData.category
      });

      setFormData({
        title: '',
        description: '',
        mediaFile: null,
        selectedTags: [],
        taggedMembers: [],
        category: ''
      });
    } catch (err) {
      console.error('Error adding memory:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group tags by category
  const tagsByCategory = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows="4"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
        >
          <option value="">Select a category</option>
          {Object.keys(tagsByCategory).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <div className="space-y-4">
          {Object.entries(tagsByCategory).map(([category, categoryTags]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {categoryTags.map(tag => (
                  <label
                    key={tag.id}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm cursor-pointer transition-colors
                      ${formData.selectedTags.includes(tag.id)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData.selectedTags.includes(tag.id)}
                      onChange={() => handleTagChange(tag.id)}
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tag Family Members</label>
        <div className="flex flex-wrap gap-2">
          {familyMembers?.map(member => (
            <label
              key={member.id}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm cursor-pointer transition-colors
                ${formData.taggedMembers.includes(member.id)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={formData.taggedMembers.includes(member.id)}
                onChange={() => handleMemberTagChange(member.id)}
              />
              {member.first_name} {member.last_name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Media (Images, Videos, or Documents)
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*,video/mp4,application/pdf"
          className="w-full"
        />
        <p className="mt-1 text-sm text-gray-500">
          Supported formats: JPEG, PNG, GIF, MP4, PDF (max 10MB)
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Adding Memory...' : 'Add Memory'}
      </button>
    </form>
  );
}

export default AddMemoryForm;
