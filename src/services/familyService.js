// src/services/familyService.js
import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

const logPerformance = (methodName, startTime) => {
  const duration = performance.now() - startTime;
  console.debug(`${methodName} took ${duration.toFixed(2)}ms`);
};

// Update addFamilyMember function to handle only direct relationships
const addFamilyMember = async (memberData) => {
  const startTime = performance.now();
  try {
    const {
      firstName,
      lastName,
      birthDate,
      gender,
      bio,
      relationshipType,
      familyId,
      relatedMemberId,
      secondParent,
      areParentsMarried
    } = memberData;

    // Create first parent
    const { data: firstParent, error: firstParentError } = await supabase
      .from('family_members')
      .insert({
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate,
        gender,
        bio,
        family_id: familyId
      })
      .select()
      .single();

    if (firstParentError) throw firstParentError;

    // If adding parent(s)
    if (relationshipType === 'parent') {
      // Create second parent if specified
      let secondParentId = null;
      if (secondParent) {
        const { data: secondParentData, error: secondParentError } = await supabase
          .from('family_members')
          .insert({
            first_name: secondParent.firstName,
            last_name: secondParent.lastName,
            birth_date: secondParent.birthDate,
            gender: secondParent.gender,
            bio: secondParent.bio,
            family_id: familyId
          })
          .select()
          .single();

        if (secondParentError) throw secondParentError;
        secondParentId = secondParentData.id;

        // Create spouse relationship if parents are married
        if (areParentsMarried) {
          const { error: spouseError } = await supabase
            .from('family_relationships')
            .insert({
              member1_id: firstParent.id,
              member2_id: secondParentId,
              relationship_type: 'spouse',
              family_id: familyId
            });

          if (spouseError) throw spouseError;
        }
      }

      // Create parent-child relationships
      const relationships = [];
      
      // First parent relationship
      relationships.push({
        member1_id: relatedMemberId,
        member2_id: firstParent.id,
        relationship_type: 'parent',
        family_id: familyId
      });

      // Second parent relationship if exists
      if (secondParentId) {
        relationships.push({
          member1_id: relatedMemberId,
          member2_id: secondParentId,
          relationship_type: 'parent',
          family_id: familyId
        });
      }

      // Insert all relationships
      const { error: relationshipError } = await supabase
        .from('family_relationships')
        .insert(relationships);

      if (relationshipError) throw relationshipError;

      return {
        member: firstParent,
        secondParent: secondParentId ? { id: secondParentId } : null,
        relationships
      };
    } else if (relationshipType === 'spouse') {
      // Create spouse relationship
      const { error: relationshipError } = await supabase
        .from('family_relationships')
        .insert({
          member1_id: relatedMemberId,
          member2_id: firstParent.id,
          relationship_type: 'spouse',
          family_id: familyId
        });

      if (relationshipError) throw relationshipError;

      return {
        member: firstParent,
        relationships: [{
          member1_id: relatedMemberId,
          member2_id: firstParent.id,
          relationship_type: 'spouse',
          family_id: familyId
        }]
      };
    } else if (relationshipType === 'child') {
      // Create child relationship with first parent
      const { error: relationshipError } = await supabase
        .from('family_relationships')
        .insert({
          member1_id: firstParent.id,  // child
          member2_id: relatedMemberId, // first parent
          relationship_type: 'child',
          family_id: familyId
        });

      if (relationshipError) throw relationshipError;

      // If second parent exists, create relationship with them too
      let secondParentRelationship = null;
      if (secondParent) {
        let secondParentId;

        if (secondParent.id) {
          // Using existing spouse as second parent
          secondParentId = secondParent.id;
        } else {
          // Create new second parent
          const { data: secondParentData, error: secondParentError } = await supabase
            .from('family_members')
            .insert({
              first_name: secondParent.firstName,
              last_name: secondParent.lastName,
              birth_date: secondParent.birthDate,
              gender: secondParent.gender,
              bio: secondParent.bio,
              family_id: familyId
            })
            .select()
            .single();

          if (secondParentError) throw secondParentError;
          secondParentId = secondParentData.id;

          // If parents are married, create spouse relationship
          if (areParentsMarried) {
            const { error: spouseError } = await supabase
              .from('family_relationships')
              .insert({
                member1_id: relatedMemberId,
                member2_id: secondParentId,
                relationship_type: 'spouse',
                family_id: familyId
              });

            if (spouseError) throw spouseError;
          }
        }

        // Create child relationship with second parent
        const { error: secondRelError } = await supabase
          .from('family_relationships')
          .insert({
            member1_id: firstParent.id,  // child
            member2_id: secondParentId, // second parent
            relationship_type: 'child',
            family_id: familyId
          });

        if (secondRelError) throw secondRelError;

        secondParentRelationship = {
          member1_id: firstParent.id,
          member2_id: secondParentId,
          relationship_type: 'child',
          family_id: familyId
        };
      }

      return {
        member: firstParent,
        secondParent: secondParentRelationship ? { id: secondParentRelationship.member2_id } : null,
        relationships: [
          {
            member1_id: firstParent.id,
            member2_id: relatedMemberId,
            relationship_type: 'child',
            family_id: familyId
          },
          ...(secondParentRelationship ? [secondParentRelationship] : [])
        ]
      };
    }

    throw new Error('Unsupported relationship type');
  } catch (error) {
    console.error('Error in addFamilyMember:', error);
    throw error;
  } finally {
    const endTime = performance.now();
    console.log(`addFamilyMember took ${endTime - startTime}ms`);
  }
};

// Add getFamilyMember function
const getFamilyMember = async (memberId) => {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting family member:', error);
    throw error;
  }
};

// Export the familyService object
export const familyService = {
  addFamilyMember,
  getFamilyMember,

  async addFirstFamilyMember(familyId, memberData) {
    try {
      // Validate familyId is a UUID
      if (!familyId || typeof familyId !== 'string' || !familyId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        throw new Error('Invalid family ID');
      }

      // Validate userId is a UUID if provided
      if (memberData.userId && (typeof memberData.userId !== 'string' || !memberData.userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i))) {
        throw new Error('Invalid user ID');
      }

      // Create the first member with UUID
      const memberId = uuidv4();
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .insert([{
          id: memberId,
          family_id: familyId,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          birth_date: memberData.birthDate,
          profile_picture_url: memberData.profilePictureUrl,
          bio: memberData.bio,
          user_id: memberData.userId,
          is_claimed: true,
          gender: memberData.gender || 'unknown'
        }])
        .select()
        .single();

      if (memberError) {
        console.error('Error adding first family member:', memberError);
        throw memberError;
      }

      return member;
    } catch (error) {
      console.error('Error in addFirstFamilyMember:', error);
      throw error;
    }
  },

  async getOrCreateFamily(name) {
    try {
      // Get user ID once
      const userId = (await supabase.auth.getUser()).data.user.id;

      // First check if user already has a family
      const { data: existingFamilies, error: fetchError } = await supabase
        .from('families')
        .select('*')
        .eq('created_by', userId)
        .limit(1);

      if (fetchError) throw fetchError;

      // If family exists, return it
      if (existingFamilies && existingFamilies.length > 0) {
        return existingFamilies[0];
      }

      // If no family exists, create one
      const { data: family, error } = await supabase
        .from('families')
        .insert([{ 
          name: name,
          created_by: userId 
        }])
        .select()
        .single();
      
      if (error) throw error;
      return family;
    } catch (error) {
      console.error('Error in getOrCreateFamily:', error);
      throw error;
    }
  },

  async getFamilyMembers(familyId) {
    const startTime = performance.now();
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*, user_id, is_claimed')
        .eq('family_id', familyId);

      if (error) throw error;
      logPerformance('getFamilyMembers', startTime);
      return data || [];
    } catch (error) {
      console.error('Error in getFamilyMembers:', error);
      throw error;
    }
  },

  async getFamilyRelationships(familyId) {
    const startTime = performance.now();
    try {
      const { data, error } = await supabase
        .from('family_relationships')
        .select('*')
        .eq('family_id', familyId);

      if (error) throw error;
      logPerformance('getFamilyRelationships', startTime);
      return data || [];
    } catch (error) {
      console.error('Error in getFamilyRelationships:', error);
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
  },

  async verifyInviteToken(token) {
    try {
      // First check if token exists and is not expired
      const { data: member, error } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('invite_token', token)
        .single();

      if (error) throw new Error('Invalid invite token');
      if (!member) throw new Error('Member not found');

      // Check if token is expired
      const now = new Date();
      const expirationDate = new Date(member.invite_token_expires_at);
      if (now > expirationDate) {
        throw new Error('Invite token has expired');
      }

      // Check if already claimed
      if (member.is_claimed) {
        throw new Error('This profile has already been claimed');
      }

      return member;
    } catch (error) {
      console.error('Error verifying invite token:', error);
      throw error;
    }
  },

  async updateFamilyMemberByInviteToken(inviteToken, userId) {
    try {
      // First verify the token
      const member = await this.verifyInviteToken(inviteToken);

      // Update the member record
      const { error: updateError } = await supabase
        .from('family_members')
        .update({
          user_id: userId,
          is_claimed: true,
          invite_token: null,
          invite_token_expires_at: null,
          invite_email: null,
          claimed_at: new Date().toISOString()
        })
        .eq('id', member.id);

      if (updateError) throw updateError;

      // Get the updated member record with family details
      const { data: updatedMember, error: fetchError } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('id', member.id)
        .single();

      if (fetchError) throw fetchError;

      if (!updatedMember.is_claimed || updatedMember.user_id !== userId) {
        throw new Error('Failed to claim profile. Please try again.');
      }

      return { success: true, member: updatedMember };
    } catch (error) {
      console.error('Error claiming invite:', error);
      throw error;
    }
  },

  async updateFamilyMember(memberId, updates) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating family member:', error);
      throw error;
    }
  }
};

export default familyService;

