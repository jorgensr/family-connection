// src/services/familyService.js
import { supabase } from '../config/supabase';

const familyService = {
  async getOrCreateFamily(name) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // First try to get the user's family
      let { data: families, error } = await supabase
        .from('families')
        .select('*')
        .eq('created_by', user.id)
        .limit(1);

      if (error) throw error;

      // If family exists, return it
      if (families && families.length > 0) {
        return families[0];
      }

      // If no family exists, create one
      const { data: newFamily, error: createError } = await supabase
        .from('families')
        .insert([{ 
          name,
          created_by: user.id 
        }])
        .select()
        .single();

      if (createError) throw createError;

      return newFamily;
    } catch (error) {
      console.error('Error in getOrCreateFamily:', error);
      throw error;
    }
  },

  async addFirstFamilyMember(familyId, memberData) {
    try {
      // First check if a self-member already exists
      const { data: existingMembers, error: checkError } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .eq('user_id', memberData.userId);

      if (checkError) throw checkError;

      // If member already exists, return it
      if (existingMembers && existingMembers.length > 0) {
        return existingMembers[0];
      }

      // First add the member
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .insert([{
          family_id: familyId,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          birth_date: memberData.birthDate || null,
          bio: memberData.bio || null,
          user_id: memberData.userId
        }])
        .select()
        .single();

      if (memberError) throw memberError;

      if (!member) {
        throw new Error('Member creation failed');
      }

      // Then create a self-relationship
      const { error: relationshipError } = await supabase
        .from('family_relationships')
        .insert([{
          family_id: familyId,
          member1_id: member.id,
          member2_id: member.id,
          relationship_type: 'self'
        }]);

      if (relationshipError) throw relationshipError;

      return member;
    } catch (error) {
      console.error('Error in addFirstFamilyMember:', error);
      throw error;
    }
  },

  async addFamilyMember(familyId, memberData) {
    try {
      console.log('Adding family member:', memberData);
      
      // First add the member
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .insert([{
          family_id: familyId,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          birth_date: memberData.birthDate || null,
          bio: memberData.bio || null,
          user_id: memberData.userId || null,
          parent_member_id: memberData.parentMemberId || null
        }])
        .select()
        .single();

      if (memberError) throw memberError;
      console.log('Member added:', member);

      // Add relationship
      const { data: relationship, error: relationshipError } = await supabase
        .from('family_relationships')
        .insert([{
          family_id: familyId,
          member1_id: memberData.parentMemberId,
          member2_id: member.id,
          relationship_type: memberData.relationship.toLowerCase()
        }])
        .select();

      if (relationshipError) {
        console.error('Error creating relationship:', relationshipError);
        // If relationship creation fails, delete the member and throw error
        await supabase
          .from('family_members')
          .delete()
          .eq('id', member.id);
        throw relationshipError;
      }
      console.log('Relationship added:', relationship);

      // For spouse relationships, create a reciprocal relationship
      if (memberData.relationship.toLowerCase() === 'spouse') {
        console.log('Creating reciprocal spouse relationship');
        const { data: reciprocal, error: reciprocalError } = await supabase
          .from('family_relationships')
          .insert([{
            family_id: familyId,
            member1_id: member.id,
            member2_id: memberData.parentMemberId,
            relationship_type: 'spouse'
          }])
          .select();

        if (reciprocalError) {
          console.error('Error creating reciprocal relationship:', reciprocalError);
          // If reciprocal relationship creation fails, clean up
          await supabase
            .from('family_relationships')
            .delete()
            .eq('member2_id', member.id);
          await supabase
            .from('family_members')
            .delete()
            .eq('id', member.id);
          throw reciprocalError;
        }
        console.log('Reciprocal relationship added:', reciprocal);
      }

      return member;
    } catch (error) {
      console.error('Error in addFamilyMember:', error);
      throw error;
    }
  },

  async getFamilyMember(memberId) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          id,
          first_name,
          last_name,
          birth_date,
          bio,
          profile_picture_url,
          family_id,
          user_id
        `)
        .eq('id', memberId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getFamilyMember:', error);
      throw error;
    }
  },

  async getMemberRelationships(memberId) {
    try {
      const { data, error } = await supabase
        .from('family_relationships')
        .select(`
          *,
          member1:member1_id(id, first_name, last_name, profile_picture_url),
          member2:member2_id(id, first_name, last_name, profile_picture_url)
        `)
        .or(`member1_id.eq.${memberId},member2_id.eq.${memberId}`);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getMemberRelationships:', error);
      throw error;
    }
  },

  async getFamilyMembersWithRelationships(familyId, currentMemberId) {
    try {
      console.log('Getting members for family:', familyId, 'current member:', currentMemberId);
      
      // Get all family members
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId);

      if (membersError) throw membersError;
      console.log('Retrieved members:', members);

      // Get all relationships for the family
      const { data: relationships, error: relError } = await supabase
        .from('family_relationships')
        .select('*')
        .eq('family_id', familyId);

      if (relError) throw relError;
      console.log('Retrieved relationships:', relationships);

      // Map relationships to members
      const membersWithRelationships = members.map(member => {
        // Check if this is the self member by user_id
        if (member.user_id === currentMemberId) {
          console.log('Found self member:', member);
          return { ...member, relationship: 'Self' };
        }

        // Find any relationship where this member is involved with the current member
        const relationship = relationships.find(r => 
          (r.member1_id === currentMemberId && r.member2_id === member.id) ||
          (r.member2_id === currentMemberId && r.member1_id === member.id)
        );

        console.log('Found relationship for member:', member.id, relationship);

        if (!relationship) {
          return { ...member, relationship: 'Extended Family' };
        }

        // Determine the relationship type based on who is member1 (the source of the relationship)
        let relationshipType = relationship.relationship_type;
        
        // If the current member is member1, use the relationship type as is
        // If the current member is member2, we need to invert the relationship
        if (relationship.member2_id === currentMemberId) {
          switch (relationshipType.toLowerCase()) {
            case 'child':
              relationshipType = 'parent';
              break;
            case 'parent':
              relationshipType = 'child';
              break;
            case 'spouse':
              relationshipType = 'spouse';
              break;
            case 'sibling':
              relationshipType = 'sibling';
              break;
            default:
              relationshipType = 'Extended Family';
              break;
          }
        }

        const result = {
          ...member,
          relationship: relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1)
        };
        console.log('Final member with relationship:', result);
        return result;
      });

      return membersWithRelationships;
    } catch (error) {
      console.error('Error in getFamilyMembersWithRelationships:', error);
      throw error;
    }
  },

  async updateFamilyMember(memberId, updateData) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .update(updateData)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateFamilyMember:', error);
      throw error;
    }
  },

  async getMemberMemories(memberId) {
    try {
      const { data, error } = await supabase
        .from('family_memories')
        .select(`
          id,
          title,
          description,
          media_url,
          created_at,
          created_by,
          family_member_id
        `)
        .eq('family_member_id', memberId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getMemberMemories:', error);
      throw error;
    }
  },

  async addFamilyMemory(familyId, memoryData) {
    try {
      const { data, error } = await supabase
        .from('family_memories')
        .insert([{
          family_id: familyId,
          title: memoryData.title,
          description: memoryData.description,
          media_url: memoryData.mediaUrl,
          created_by: memoryData.created_by,
          family_member_id: memoryData.family_member_id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in addFamilyMemory:', error);
      throw error;
    }
  },

  async addFamilyRelationship(familyId, member1Id, member2Id, relationshipType) {
    try {
      const { data, error } = await supabase
        .from('family_relationships')
        .insert([{
          family_id: familyId,
          member1_id: member1Id,
          member2_id: member2Id,
          relationship_type: relationshipType.toLowerCase()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in addFamilyRelationship:', error);
      throw error;
    }
  }
};

export { familyService };