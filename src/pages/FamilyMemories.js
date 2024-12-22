import React, { useState, useEffect, useCallback } from 'react';
import { familyService } from '../services/familyService';
import { useAuth } from '../context/AuthContext';
import AddMemoryForm from '../components/memories/AddMemoryForm';
import { supabase } from '../config/supabase';

function FamilyMemories() {
  const [memories, setMemories] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const loadMemories = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // First get the user's family
      const family = await familyService.getOrCreateFamily(`${user.email}'s Family`);
      
      // Then get all family members
      const { data: members } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', family.id);

      setFamilyMembers(members || []);

      // Get the user's member record
      const currentMember = members?.find(m => m.user_id === user.id);

      if (!currentMember) {
        throw new Error('Member not found');
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
        .eq('family_id', family.id)
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

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const handleAddMemory = async (memoryData) => {
    if (!user) return;

    try {
      setError(null);
      // Get the family and member info
      const family = await familyService.getOrCreateFamily(`${user.email}'s Family`);
      const { data: member } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', family.id)
        .eq('user_id', user.id)
        .single();

      if (!member) {
        throw new Error('Member not found');
      }

      // Add the memory
      const { data: newMemory, error: memoryError } = await supabase
        .from('family_memories')
        .insert([{
          family_id: family.id,
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
      if (memoryData.selectedTags.length > 0) {
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
      if (memoryData.taggedMembers.length > 0) {
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

  const handleAddComment = async (memoryId, content) => {
    if (!user) return;

    try {
      const { data: member } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!member) {
        throw new Error('Member not found');
      }

      const { error: commentError } = await supabase
        .from('memory_comments')
        .insert([{
          memory_id: memoryId,
          family_member_id: member.id,
          content
        }]);

      if (commentError) throw commentError;

      // Reload memories
      await loadMemories();
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Family Memories</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Memory</h2>
        <AddMemoryForm onSubmit={handleAddMemory} familyMembers={familyMembers} />
      </div>

      <div className="space-y-6">
        {memories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-600">
            No memories shared yet. Be the first to add one!
          </div>
        ) : (
          memories.map(memory => (
            <div key={memory.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{memory.title}</h3>
                {memory.description && (
                  <p className="text-gray-700 mb-4">{memory.description}</p>
                )}
                {memory.media_url && (
                  <div className="mb-4">
                    {memory.media_url.endsWith('.mp4') ? (
                      <video 
                        controls 
                        className="w-full rounded-lg"
                        src={memory.media_url}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : memory.media_url.endsWith('.pdf') ? (
                      <a 
                        href={memory.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:underline"
                      >
                        View PDF Document
                      </a>
                    ) : (
                      <img 
                        src={memory.media_url} 
                        alt={memory.title}
                        className="w-full h-auto rounded-lg"
                      />
                    )}
                  </div>
                )}

                {/* Tags */}
                {memory.memory_tags && memory.memory_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
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

                {/* Tagged Members */}
                {memory.tagged_members && memory.tagged_members.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Tagged People:</h4>
                    <div className="flex flex-wrap gap-2">
                      {memory.tagged_members.map(({ member }) => (
                        <span
                          key={member.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {member.first_name} {member.last_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500 mb-4">
                  Shared on {new Date(memory.created_at).toLocaleDateString()}
                </div>

                {/* Comments */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-lg font-medium mb-4">Comments</h4>
                  <div className="space-y-4">
                    {memory.comments?.map(comment => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="flex-1 bg-gray-50 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {comment.commenter.first_name} {comment.commenter.last_name}
                          </div>
                          <div className="text-sm text-gray-700">{comment.content}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(comment.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const content = e.target.comment.value.trim();
                        if (content) {
                          handleAddComment(memory.id, content);
                          e.target.comment.value = '';
                        }
                      }}
                      className="mt-4"
                    >
                      <textarea
                        name="comment"
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add a comment..."
                      ></textarea>
                      <button
                        type="submit"
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Add Comment
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FamilyMemories;
