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

      // First check if user has a claimed profile
      const { data: claimedProfiles } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('user_id', user.id)
        .eq('is_claimed', true);

      if (!claimedProfiles?.length) {
        // If no claimed profile, try to create a new family
        const family = await familyService.getOrCreateFamily(`${user.email}'s Family`);
        
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

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Family Memories</h1>
      
      <AddMemoryForm 
        onMemoryAdded={loadMemories}
        familyMembers={familyMembers}
      />

      <div className="space-y-4">
        {memories.map(memory => (
          <div key={memory.id} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{memory.title}</h2>
            <p className="text-gray-600">{memory.description}</p>
            <div className="mt-2 text-sm text-gray-500">
              {new Date(memory.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FamilyMemories;
