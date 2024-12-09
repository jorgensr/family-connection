import { supabase } from '../config/supabase';

export const familyService = {
 async createFamily(name) {
   try {
     const { data: { user } } = await supabase.auth.getUser();
     const { data, error } = await supabase
       .from('families')
       .insert([{ 
         name,
         created_by: user.id 
       }])
       .select()
       .single();

     if (error) throw error;
     return data;
   } catch (error) {
     console.error('Error creating family:', error);
     throw error;
   }
 },

 async addFamilyMember(familyId, memberData) {
   try {
     const { data, error } = await supabase
       .from('family_members')
       .insert([{
         family_id: familyId,
         first_name: memberData.firstName,
         last_name: memberData.lastName,
         birth_date: memberData.birthDate,
         relationship: memberData.relationship,
         parent_member_id: memberData.parentMemberId
       }])
       .select()
       .single();

     if (error) throw error;
     return data;
   } catch (error) {
     console.error('Error adding family member:', error);
     throw error;
   }
 },

 async getFamilyTree(familyId) {
   try {
     const { data, error } = await supabase
       .from('family_members')
       .select('*')
       .eq('family_id', familyId)
       .order('created_at');

     if (error) throw error;
     return this.buildFamilyTree(data);
   } catch (error) {
     console.error('Error fetching family tree:', error);
     throw error;
   }
 },

 async addFamilyMedia(familyId, memberId, mediaData) {
   try {
     const { data, error } = await supabase
       .from('family_media')
       .insert([{
         family_id: familyId,
         member_id: memberId,
         url: mediaData.url,
         file_type: mediaData.fileType,
         title: mediaData.title,
         description: mediaData.description
       }])
       .select()
       .single();

     if (error) throw error;
     return data;
   } catch (error) {
     console.error('Error adding family media:', error);
     throw error;
   }
 },

 async getFamilyMedia(familyId, memberId) {
   try {
     const { data, error } = await supabase
       .from('family_media')
       .select('*')
       .eq('family_id', familyId)
       .eq('member_id', memberId)
       .order('created_at', { ascending: false });

     if (error) throw error;
     return data;
   } catch (error) {
     console.error('Error fetching family media:', error);
     throw error;
   }
 },

 buildFamilyTree(members) {
   const membersById = {};
   const rootMembers = [];

   members.forEach(member => {
     membersById[member.id] = {
       ...member,
       children: []
     };
   });

   members.forEach(member => {
     if (member.parent_member_id) {
       const parent = membersById[member.parent_member_id];
       if (parent) {
         parent.children.push(membersById[member.id]);
       }
     } else {
       rootMembers.push(membersById[member.id]);
     }
   });

   return rootMembers;
 }
};