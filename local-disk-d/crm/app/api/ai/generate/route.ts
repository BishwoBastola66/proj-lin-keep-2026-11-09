import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY || 'fDCiorWRGuucEywKARG5kH59ScqXLkVY'}`
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
        messages: [
          {
            role: 'system',
            content: 'You are an expert CRM assistant for "Srimatrix Health" (website: srimatrixhealth.com). The user will provide a topic or goal for an email campaign. Generate a professional email subject and body. Keep it concise, persuasive, and professional. NEVER use placeholders like [Your Company Name], always use "Srimatrix Health" and "srimatrixhealth.com". IMPORTANT: You are writing a bulk email template. You MUST personalize the email by using the exact variables {{first_name}} and {{last_name}} for the recipient\'s name. DO NOT use the {{phone}} variable to refer to Srimatrix Health\'s contact number, because {{phone}} is the RECIPIENT\'s phone number. Always start the email with "Hi {{first_name}}," or similar. DO NOT INCLUDE ANY SIGNATURE OR SIGN-OFF. The backend system will automatically append the signature (Best regards, Name, Position, etc.). End your body content immediately after the last sentence of your message. THE BODY MUST BE GENERATED IN CLEAN HTML FORMAT. Use <b>, <i>, <ul>, <li>, and <p> tags appropriately to format the email beautifully. You MUST return ONLY a valid JSON object with EXACTLY two keys: "subject" (string) and "body" (string containing the HTML). Do not include any other text, markdown formatting, or explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Mistral API Error:', err);
      return NextResponse.json({ error: 'Failed to generate content' }, { status: response.status });
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // In case it still wraps in markdown
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
    }

    const result = JSON.parse(content);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('AI Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
