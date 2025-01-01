import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

const inviteService = {
  sendInvite: async (memberId, email) => {
    try {
      const inviteToken = uuidv4();
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // 7 days expiration

      // Get the current user's name (inviter)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      // Get the member being invited
      const { data: memberData } = await supabase
        .from('family_members')
        .select('first_name, last_name')
        .eq('id', memberId)
        .single();

      // Update family member record with invite details
      const { error: updateError } = await supabase
        .from('family_members')
        .update({
          invite_token: inviteToken,
          invite_token_expires_at: expirationDate.toISOString(),
          invite_email: email
        })
        .eq('id', memberId);

      if (updateError) throw updateError;

      // Call the Edge Function to send the email
      const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
        body: {
          inviteeEmail: email,
          inviterName: user.email, // or user's display name if you have it
          memberName: `${memberData.first_name} ${memberData.last_name}`,
          inviteToken: inviteToken
        }
      });

      if (emailError) throw emailError;

      return { success: true };
    } catch (error) {
      console.error('Error sending invite:', error);
      throw error;
    }
  },

  verifyInvite: async (token) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('invite_token', token)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Invalid invite token');

      const now = new Date();
      const expirationDate = new Date(data.invite_token_expires_at);

      if (now > expirationDate) {
        throw new Error('Invite token has expired');
      }

      return { success: true, member: data };
    } catch (error) {
      console.error('Error verifying invite:', error);
      throw error;
    }
  }
};

export default inviteService; 