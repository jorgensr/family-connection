import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../config/supabase';
import { storageService } from '../../services/storageService';
import { useDropzone } from 'react-dropzone';
import { XMarkIcon, PhotoIcon, CheckIcon } from '@heroicons/react/24/outline';

function AddMemoryForm({ onSubmit, familyMembers, onCancel, initialData, isEditing }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaFile: null,
    mediaPreview: null,
    selectedTags: [],
    taggedMembers: [],
    category: ''
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [error, setError] = useState(null);

  // Initialize form with data when editing
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        mediaFile: null,
        mediaPreview: initialData.media_url || null,
        selectedTags: initialData.selectedTags || [],
        taggedMembers: initialData.taggedMembers || [],
        category: initialData.category || ''
      });
    }
  }, [initialData, isEditing]);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
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
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            mediaFile: file,
            mediaPreview: reader.result
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setFormData(prev => ({
          ...prev,
          mediaFile: file,
          mediaPreview: null
        }));
      }
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/mp4': [],
      'application/pdf': []
    },
    maxFiles: 1
  });

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

  const handleTagChange = (tagId) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }));
  };

  const handleMemberTagChange = (memberId) => {
    setFormData(prev => ({
      ...prev,
      taggedMembers: prev.taggedMembers.includes(memberId)
        ? prev.taggedMembers.filter(id => id !== memberId)
        : [...prev.taggedMembers, memberId]
    }));
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
        mediaPreview: null,
        selectedTags: [],
        taggedMembers: [],
        category: ''
      });
      setCurrentStep(0);
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

  const steps = [
    {
      title: 'Basic Information',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      isComplete: () => formData.title && formData.category,
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Give your memory a title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Share the story behind this memory..."
              rows="4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              required
            >
              <option value="">Select a category</option>
              {Object.keys(tagsByCategory).map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )
    },
    {
      title: 'Media Upload',
      icon: <PhotoIcon className="w-6 h-6" />,
      isComplete: () => true, // Media is optional
      content: (
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-blue-500 bg-blue-50 scale-[0.99]' : 'border-gray-300 hover:border-gray-400'}`}
          >
            <input {...getInputProps()} />
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? "Drop your file here..."
                : "Drag and drop your file here, or click to select"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supported formats: JPEG, PNG, GIF, MP4, PDF (max 10MB)
            </p>
          </div>

          {formData.mediaPreview && (
            <div className="relative rounded-lg overflow-hidden shadow-md">
              <img
                src={formData.mediaPreview}
                alt="Preview"
                className="w-full h-auto max-h-64 object-cover"
              />
              <button
                onClick={() => setFormData(prev => ({ ...prev, mediaFile: null, mediaPreview: null }))}
                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          )}

          {formData.mediaFile && !formData.mediaPreview && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm text-gray-600">{formData.mediaFile.name}</span>
              <button
                onClick={() => setFormData(prev => ({ ...prev, mediaFile: null }))}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Tags & People',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      isComplete: () => true, // Tags are optional
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Tags</label>
            <div className="space-y-4">
              {Object.entries(tagsByCategory).map(([category, categoryTags]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryTags.map(tag => (
                      <label
                        key={tag.id}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all
                          ${formData.selectedTags.includes(tag.id)
                            ? 'bg-blue-500 text-white ring-2 ring-blue-300 ring-offset-2'
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
            <label className="block text-sm font-medium text-gray-700 mb-4">Tag Family Members</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {familyMembers?.map(member => (
                <label
                  key={member.id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all
                    ${formData.taggedMembers.includes(member.id)
                      ? 'bg-blue-500 text-white ring-2 ring-blue-300 ring-offset-2'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={formData.taggedMembers.includes(member.id)}
                    onChange={() => handleMemberTagChange(member.id)}
                  />
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white flex items-center justify-center">
                      <span className={`text-sm font-medium ${formData.taggedMembers.includes(member.id) ? 'text-blue-600' : 'text-gray-600'}`}>
                        {member.first_name[0]}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {member.first_name} {member.last_name}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = (e) => {
    e.preventDefault();
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = (e) => {
    e.preventDefault();
    setCurrentStep(prev => prev - 1);
  };

  const handleCancel = (e) => {
    e.preventDefault();
    // Reset form data
    setFormData({
      title: '',
      description: '',
      mediaFile: null,
      mediaPreview: null,
      selectedTags: [],
      taggedMembers: [],
      category: ''
    });
    setCurrentStep(0);
    setError(null);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex divide-x divide-gray-200">
          {steps.map((step, index) => {
            const isComplete = step.isComplete();
            const isCurrent = currentStep === index;
            
            return (
              <button
                key={step.title}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`flex-1 px-4 py-4 text-sm font-medium text-center relative
                  ${isCurrent
                    ? 'text-blue-600 bg-blue-50'
                    : isComplete
                      ? 'text-gray-900 hover:bg-gray-50'
                      : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className={`flex-shrink-0 w-6 h-6 ${isCurrent ? 'text-blue-600' : isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.icon}
                  </div>
                  <span>{step.title}</span>
                </div>
                {isComplete && !isCurrent && (
                  <div className="absolute top-2 right-2">
                    <CheckIcon className="w-4 h-4 text-green-500" />
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6">
        {steps[currentStep].content}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
          </div>
          
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!steps[currentStep].isComplete()}
              className="ml-auto inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.category}
              className="ml-auto inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isEditing ? 'Updating Memory...' : 'Adding Memory...'}
                </>
              ) : (
                <>
                  {isEditing ? 'Update Memory' : 'Add Memory'}
                  <CheckIcon className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export default AddMemoryForm;
