import { Router } from 'express';
import nodemailer from 'nodemailer';
import { supabase } from '../db';

const router = Router();

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'mrperfect9863@gmail.com',
    pass: process.env.SMTP_PASS || 'qusb wqwj rdap clsi'
  }
});

router.post('/send', async (req, res) => {
  try {
    const { facility_id, to_email, subject, body, user_id } = req.body;
    
    // Send email
    const info = await transporter.sendMail({
      from: '"Srimatric" <no-reply@srimatric.com>',
      to: to_email,
      subject: subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br/>')}</p>`
    });
    
    // Log interaction
    const { data, error } = await supabase
      .from('facility_interactions')
      .insert([
        {
          facility_id,
          user_id,
          interaction_type: 'Email (Sent)',
          subject: subject,
          body: body,
          outcome: 'Sent',
          email_message_id: info.messageId,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
      
    if (error) throw error;
    
    res.json({ success: true, messageId: info.messageId, interaction: data });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

import { syncInbox } from '../imapListener';

router.post('/sync', async (req, res) => {
  const result = await syncInbox();
  if (result.success) {
    res.json({ success: true, count: result.count });
  } else {
    res.status(500).json({ error: result.error });
  }
});

export default router;
