import type { Env } from './supabase-admin'

interface EmailTemplate {
  subject: string
  html: string
}

export async function sendEmail(env: Env, to: string, template: EmailTemplate) {
  if (!env.RESEND_API_KEY) return false

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL || 'ReetzFam.org <access@reetzfam.org>',
      to: [to],
      subject: template.subject,
      html: template.html,
    }),
  })

  if (!response.ok) {
    console.error('Resend email failed', response.status, await response.text().catch(() => ''))
    return false
  }

  return true
}
