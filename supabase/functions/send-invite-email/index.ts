import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { inviteeEmail, inviterName, memberName, inviteToken } = await req.json()

    // Debug log the configuration
    console.log('Starting email send with config:', {
      smtpHost: Deno.env.get('SMTP_HOSTNAME'),
      smtpPort: Deno.env.get('SMTP_PORT'),
      username: Deno.env.get('GMAIL_USER'),
      hasPassword: !!Deno.env.get('GMAIL_APP_PASSWORD'),
      appUrl: Deno.env.get('APP_URL')
    });

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOSTNAME') || 'smtp.gmail.com',
        port: Number(Deno.env.get('SMTP_PORT')) || 465,
        tls: true,
        auth: {
          username: Deno.env.get('GMAIL_USER'),
          password: Deno.env.get('GMAIL_APP_PASSWORD'),
        },
      },
    });

    // Generate the invite link using the APP_URL from environment
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000';
    const inviteLink = `${appUrl}/claim-invite/${inviteToken}`;

    // Create email content
    const emailContent = `
      <h2>You've been invited to Family Legacy Connection!</h2>
      <p>${inviterName} has invited you to claim the profile of ${memberName} in their family tree.</p>
      <p>Click the link below to claim your profile:</p>
      <a href="${inviteLink}" style="display: inline-block; background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Claim Your Profile</a>
      <p>This invite link will expire in 7 days.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    `;

    // Send the email
    await client.send({
      from: Deno.env.get('GMAIL_USER'),
      to: inviteeEmail,
      subject: `${inviterName} invited you to Family Legacy Connection`,
      content: "This email requires HTML support",
      html: emailContent,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 