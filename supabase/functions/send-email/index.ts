import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text, attachments } = await req.json()
    
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    
    const emailData: any = {
      from: 'Sacred Heart <portal@sacredheart.edu>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }

    // ✅ ATTACHMENTS HANDLING ADDED
    if (attachments && Array.isArray(attachments)) {
      emailData.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        content_type: att.content_type,
        disposition: att.disposition || 'attachment'
      }));
    }

    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
