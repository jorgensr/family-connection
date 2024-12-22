// src/services/familyService.js
import { supabase } from '../config/supabase';

export const familyService = {
  async getOrCreateFamily(name) {
    try {
      // First try to find an existing family
      let { data: family, error } = await supabase
        .from('families')
        .select('*')
        .eq('name', name)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If no family exists, create one
      if (!family) {
        const { data: newFamily, error: createError } = await supabase
          .from('families')
          .insert([{ name }])
          .select()
          .single();

        if (createError) throw createError;
        family = newFamily;
      }

      return family;
    } catch (error) {
      console.error('Error in getOrCreateFamily:', error);
      throw error;
    }
  },

  async getFamilyMembers(familyId) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getFamilyMembers:', error);
      throw error;
    }
  },

  async getFamilyRelationships(familyId) {
    try {
      const { data, error } = await supabase
        .from('family_relationships')
        .select('*')
        .eq('family_id', familyId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getFamilyRelationships:', error);
      throw error;
    }
  },

  async addFamilyMember(memberData) {
    try {
      const { firstName, lastName, relationship, birthDate, bio, relativeToId } = memberData;

      // First add the member
      const { data: newMember, error: memberError } = await supabase
        .from('family_members')
        .insert([{
          first_name: firstName,
          last_name: lastName,
          birth_date: birthDate,
          bio: bio,
          family_id: (await this.getFamilyIdForMember(relativeToId))
        }])
        .select()
        .single();

      if (memberError) throw memberError;

      // Then create the relationship
      if (relativeToId) {
        // For parent relationships, we need to create a child relationship from child to parent
        if (relationship.toLowerCase() === 'parent') {
          const { error: relationshipError } = await supabase
            .from('family_relationships')
            .insert([{
              family_id: newMember.family_id,
              member1_id: newMember.id,
              member2_id: relativeToId,
              relationship_type: 'child'
            }]);

          if (relationshipError) throw relationshipError;
        } else {
          // For all other relationships, create the relationship as specified
          const { error: relationshipError } = await supabase
            .from('family_relationships')
            .insert([{
              family_id: newMember.family_id,
              member1_id: relativeToId,
              member2_id: newMember.id,
              relationship_type: relationship.toLowerCase()
            }]);

          if (relationshipError) throw relationshipError;
        }

        // Create reciprocal relationships for spouse and sibling
        if (relationship.toLowerCase() === 'spouse' || relationship.toLowerCase() === 'sibling') {
          const { error: reciprocalError } = await supabase
            .from('family_relationships')
            .insert([{
              family_id: newMember.family_id,
              member1_id: newMember.id,
              member2_id: relativeToId,
              relationship_type: relationship.toLowerCase()
            }]);

          if (reciprocalError) throw reciprocalError;
        }
      }

      return newMember;
    } catch (error) {
      console.error('Error in addFamilyMember:', error);
      throw error;
    }
  },

  async getFamilyIdForMember(memberId) {
    if (!memberId) throw new Error('Member ID is required');

    const { data, error } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('id', memberId)
      .single();

    if (error) throw error;
    return data.family_id;
  },

  async addFirstFamilyMember(familyId, memberData) {
    try {
      const { data: newMember, error: memberError } = await supabase
        .from('family_members')
        .insert([{
          family_id: familyId,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          birth_date: memberData.birthDate,
          bio: memberData.bio,
          user_id: memberData.userId
        }])
        .select()
        .single();

      if (memberError) throw memberError;

      // Create self relationship
      const { error: relationshipError } = await supabase
        .from('family_relationships')
        .insert([{
          family_id: familyId,
          member1_id: newMember.id,
          member2_id: newMember.id,
          relationship_type: 'self'
        }]);

      if (relationshipError) throw relationshipError;

      return newMember;
    } catch (error) {
      console.error('Error in addFirstFamilyMember:', error);
      throw error;
    }
  },

  async getFamilyMember(memberId) {
    try {
      // First get the member's basic information
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;
      
      if (!member) {
        throw new Error('Member not found');
      }

      // Then get all relationships where this member is involved
      const { data: relationships, error: relError } = await supabase
        .from('family_relationships')
        .select('*')
        .or(`member1_id.eq.${memberId},member2_id.eq.${memberId}`);

      if (relError) throw relError;

      // Process relationships to determine the member's role
      const processedRelationships = (relationships || []).map(rel => {
        const isFirstMember = rel.member1_id === memberId;
        return {
          otherId: isFirstMember ? rel.member2_id : rel.member1_id,
          type: isFirstMember ? rel.relationship_type : rel.relationship_type === 'child' ? 'parent' : rel.relationship_type
        };
      });

      // Return combined data
      return {
        ...member,
        relationships: processedRelationships
      };
    } catch (error) {
      console.error('Error in getFamilyMember:', error);
      throw error;
    }
  },

  async getMemberMemories(memberId) {
    try {
      const { data, error } = await supabase
        .from('family_memories')
        .select('*')
        .eq('family_member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getMemberMemories:', error);
      throw error;
    }
  }
};