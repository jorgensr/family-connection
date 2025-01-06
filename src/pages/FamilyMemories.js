import React, { useState, useEffect, useCallback } from 'react';
import { familyService } from '../services/familyService';
import { useAuth } from '../context/AuthContext';
import AddMemoryForm from '../components/memories/AddMemoryForm';
import { supabase } from '../config/supabase';
import { 
  Squares2X2Icon,
  ViewColumnsIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTransition, animated } from '@react-spring/web';

function FamilyMemories() {
  const [memories, setMemories] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [currentFamily, setCurrentFamily] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMemoryForView, setSelectedMemoryForView] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [memoryToEdit, setMemoryToEdit] = useState(null);

  // Animation for form transition
  const formTransition = useTransition(showAddForm, {
    from: { opacity: 0, transform: 'translateY(-20px)' },
    enter: { opacity: 1, transform: 'translateY(0)' },
    leave: { opacity: 0, transform: 'translateY(-20px)' },
  });

  const loadMemories = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // First check if user has a claimed profile
      const { data: claimedProfiles } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('user_id', user.id)
        .eq('is_claimed', true);

      if (!claimedProfiles?.length) {
        // If no claimed profile, try to create a new family
        const family = await familyService.getOrCreateFamily(`${user.email}'s Family`);
        setCurrentFamily(family);
        
        // Then get all family members
        const { data: members } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', family.id);

        setFamilyMembers(members || []);
      } else {
        // Use the first claimed profile's family
        const currentMember = claimedProfiles[0];
        const family = currentMember.families;
        setCurrentFamily(family);

        // Get all family members
        const { data: members } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', family.id);

        setFamilyMembers(members || []);
      }

      // Get memories with related data
      const { data: memoriesData, error: memoriesError } = await supabase
        .from('family_memories')
        .select(`
          *,
          memory_tags:memory_tag_assignments(
            tag:memory_tags(*)
          ),
          tagged_members:memory_member_tags(
            member:family_members(*)
          ),
          comments:memory_comments(
            *,
            commenter:family_members(*)
          )
        `)
        .eq('family_id', claimedProfiles?.[0]?.family_id)
        .order('created_at', { ascending: false });

      if (memoriesError) throw memoriesError;
      setMemories(memoriesData || []);
    } catch (err) {
      console.error('Error loading memories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleAddMemory = async (memoryData) => {
    if (!user || !currentFamily) return;

    try {
      setError(null);
      
      // Get the current member
      const { data: member } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', currentFamily.id)
        .eq('user_id', user.id)
        .single();

      if (!member) {
        throw new Error('Member not found');
      }

      // Add the memory
      const { data: newMemory, error: memoryError } = await supabase
        .from('family_memories')
        .insert([{
          family_id: currentFamily.id,
          family_member_id: member.id,
          title: memoryData.title,
          description: memoryData.description,
          media_url: memoryData.mediaUrl,
          created_by: user.id,
          category: memoryData.category
        }])
        .select()
        .single();

      if (memoryError) throw memoryError;

      // Add tags
      if (memoryData.selectedTags?.length > 0) {
        const { error: tagError } = await supabase
          .from('memory_tag_assignments')
          .insert(
            memoryData.selectedTags.map(tagId => ({
              memory_id: newMemory.id,
              tag_id: tagId
            }))
          );
        if (tagError) throw tagError;
      }

      // Add member tags
      if (memoryData.taggedMembers?.length > 0) {
        const { error: memberTagError } = await supabase
          .from('memory_member_tags')
          .insert(
            memoryData.taggedMembers.map(memberId => ({
              memory_id: newMemory.id,
              family_member_id: memberId
            }))
          );
        if (memberTagError) throw memberTagError;
      }

      // Reload memories
      await loadMemories();
    } catch (err) {
      console.error('Error adding memory:', err);
      setError(err.message);
    }
  };

  const handleEditMemory = async (memoryData) => {
    if (!user || !currentFamily || !memoryToEdit) return;

    try {
      setError(null);
      
      // Update the memory
      const { error: memoryError } = await supabase
        .from('family_memories')
        .update({
          title: memoryData.title,
          description: memoryData.description,
          media_url: memoryData.mediaUrl,
          category: memoryData.category
        })
        .eq('id', memoryToEdit.id);

      if (memoryError) throw memoryError;

      // Delete existing tags
      await supabase
        .from('memory_tag_assignments')
        .delete()
        .eq('memory_id', memoryToEdit.id);

      // Add new tags
      if (memoryData.selectedTags?.length > 0) {
        const { error: tagError } = await supabase
          .from('memory_tag_assignments')
          .insert(
            memoryData.selectedTags.map(tagId => ({
              memory_id: memoryToEdit.id,
              tag_id: tagId
            }))
          );
        if (tagError) throw tagError;
      }

      // Delete existing member tags
      await supabase
        .from('memory_member_tags')
        .delete()
        .eq('memory_id', memoryToEdit.id);

      // Add new member tags
      if (memoryData.taggedMembers?.length > 0) {
        const { error: memberTagError } = await supabase
          .from('memory_member_tags')
          .insert(
            memoryData.taggedMembers.map(memberId => ({
              memory_id: memoryToEdit.id,
              family_member_id: memberId
            }))
          );
        if (memberTagError) throw memberTagError;
      }

      // Reload memories
      await loadMemories();
      setIsEditing(false);
      setMemoryToEdit(null);
      setShowAddForm(false);
    } catch (err) {
      console.error('Error updating memory:', err);
      setError(err.message);
    }
  };

  const startEditing = (memory) => {
    const selectedTags = memory.memory_tags?.map(({ tag }) => tag.id) || [];
    const taggedMembers = memory.tagged_members?.map(({ member }) => member.id) || [];
    
    setMemoryToEdit({
      ...memory,
      selectedTags,
      taggedMembers
    });
    setIsEditing(true);
    setShowAddForm(true);
  };

  const handleDeleteMemory = async (memoryId) => {
    if (!user || !currentFamily) return;

    try {
      setError(null);
      
      // Delete memory tags
      await supabase
        .from('memory_tag_assignments')
        .delete()
        .eq('memory_id', memoryId);

      // Delete member tags
      await supabase
        .from('memory_member_tags')
        .delete()
        .eq('memory_id', memoryId);

      // Delete comments
      await supabase
        .from('memory_comments')
        .delete()
        .eq('memory_id', memoryId);

      // Delete the memory
      const { error: deleteError } = await supabase
        .from('family_memories')
        .delete()
        .eq('id', memoryId);

      if (deleteError) throw deleteError;

      // Reload memories
      await loadMemories();
      setShowDeleteConfirm(false);
      setSelectedMemory(null);
    } catch (err) {
      console.error('Error deleting memory:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const filteredMemories = memories
    .filter(memory => {
      if (filterCategory === 'all') return true;
      return memory.category === filterCategory;
    })
    .filter(memory => {
      if (!searchQuery) return true;
      return (
        memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const categories = ['all', ...new Set(memories.map(m => m.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg border border-red-100">
        <div className="flex items-center">
          <XMarkIcon className="h-5 w-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Family Memories</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transform transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Memory
        </button>
      </div>

      {formTransition((style, item) =>
        item && (
          <animated.div style={style} className="mb-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="relative">
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setIsEditing(false);
                      setMemoryToEdit(null);
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <AddMemoryForm 
                  onSubmit={async (data) => {
                    if (isEditing) {
                      await handleEditMemory(data);
                    } else {
                      await handleAddMemory(data);
                    }
                    setShowAddForm(false);
                  }}
                  onCancel={() => {
                    setShowAddForm(false);
                    setIsEditing(false);
                    setMemoryToEdit(null);
                  }}
                  familyMembers={familyMembers}
                  initialData={memoryToEdit}
                  isEditing={isEditing}
                />
              </div>
            </div>
          </animated.div>
        )
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search memories..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className={`p-2 rounded-lg border ${showAdvancedSearch ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
              >
                <FunnelIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50"
              >
                {viewMode === 'grid' ? (
                  <Squares2X2Icon className="h-5 w-5" />
                ) : (
                  <ViewColumnsIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {showAdvancedSearch && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="date">Latest First</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
          {filteredMemories.map(memory => (
            <div 
              key={memory.id} 
              className={`group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all
                ${viewMode === 'grid' ? '' : 'flex gap-4'}`}
            >
              <div 
                className="flex-1 cursor-pointer relative flex flex-col"
                onClick={() => setSelectedMemoryForView(memory)}
              >
                {memory.media_url && (
                  <div className={viewMode === 'grid' ? 'aspect-w-16 aspect-h-9 group-hover:opacity-90 transition-opacity' : 'flex-shrink-0 w-48'}>
                    <img
                      src={memory.media_url}
                      alt={memory.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {memory.title}
                    </h2>
                    <span className="text-sm text-gray-500">
                      {new Date(memory.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 line-clamp-3 mb-3">{memory.description}</p>
                  <div className="mt-auto">
                    {memory.memory_tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {memory.memory_tags.map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {memory.tagged_members?.length > 0 && (
                      <div className="flex -space-x-2">
                        {memory.tagged_members.map(({ member }) => (
                          <div
                            key={member.id}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 border-2 border-white"
                          >
                            <span className="text-xs font-medium text-gray-600">
                              {member.first_name[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(memory);
                    }}
                    className="p-1.5 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
                    title="Edit memory"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMemory(memory);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-1.5 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors text-red-500 hover:text-red-700"
                    title="Delete memory"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredMemories.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <PlusIcon className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No memories</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new memory.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Memory
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Memory View Modal */}
      {selectedMemoryForView && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{selectedMemoryForView.title}</h3>
              <button
                onClick={() => setSelectedMemoryForView(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {selectedMemoryForView.media_url && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img
                    src={selectedMemoryForView.media_url}
                    alt={selectedMemoryForView.title}
                    className="w-full h-auto"
                  />
                </div>
              )}
              <div className="space-y-4">
                <p className="text-gray-600">{selectedMemoryForView.description}</p>
                
                {selectedMemoryForView.memory_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedMemoryForView.memory_tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {selectedMemoryForView.tagged_members?.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tagged People</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMemoryForView.tagged_members.map(({ member }) => (
                        <div
                          key={member.id}
                          className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100"
                        >
                          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <span className="text-xs font-medium text-gray-600">
                              {member.first_name[0]}
                            </span>
                          </div>
                          <span className="text-sm text-gray-700">
                            {member.first_name} {member.last_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created on {new Date(selectedMemoryForView.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          startEditing(selectedMemoryForView);
                          setSelectedMemoryForView(null);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                        title="Edit memory"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMemory(selectedMemoryForView);
                          setSelectedMemoryForView(null);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-red-500 hover:text-red-700"
                        title="Delete memory"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedMemory && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900">Delete Memory</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete "{selectedMemory.title}"? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedMemory(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMemory(selectedMemory.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FamilyMemories;
