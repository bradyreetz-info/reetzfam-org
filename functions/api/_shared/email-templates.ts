export interface RequestEmailData {
  name: string
  email: string
  phone?: string
  relationship: string
  verifier: string
  message?: string
  reviewUrl: string
}

const escapeHtml = (value = '') => value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]!)

const shell = (preheader: string, body: string) => `<!doctype html><html><body style="margin:0;background:#f8f5ef;font-family:Arial,sans-serif;color:#1f2933"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="600" style="max-width:600px;background:#fff;border:1px solid #e8dfd2;border-radius:14px"><tr><td style="padding:32px"><p style="margin:0 0 24px;color:#315c45;font-weight:bold">ReetzFam.org</p>${body}<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #e8dfd2;color:#667085;font-size:12px">Private family portal · This message may contain family information. Please handle it thoughtfully.</p></td></tr></table></td></tr></table></body></html>`

const field = (label: string, value?: string) => value ? `<tr><td style="padding:8px 12px 8px 0;color:#667085;font-size:13px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 0;font-size:14px">${escapeHtml(value)}</td></tr>` : ''

export const newAccessRequestEmail = (data: RequestEmailData) => ({
  subject: `Access request from ${data.name}`,
  html: shell('A family access request is waiting for review.', `<h1 style="margin:0 0 12px;font-size:26px">New access request</h1><p style="color:#667085;line-height:1.6">A new request is waiting for a family administrator. Verify the person’s connection before approving access.</p><table role="presentation" width="100%" style="margin:20px 0;background:#faf7f0;border-radius:10px;padding:12px">${field('Requester', data.name)}${field('Email', data.email)}${field('Phone', data.phone)}${field('Relationship', data.relationship)}${field('Verifier', data.verifier)}${field('Message', data.message)}</table><a href="${escapeHtml(data.reviewUrl)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#315c45;color:#fff;text-decoration:none;font-weight:bold">Review request</a>`),
})

export const approvedWelcomeEmail = (name: string, loginUrl: string) => ({
  subject: 'Welcome to ReetzFam.org',
  html: shell('Your family portal access has been approved.', `<h1 style="font-size:26px">Welcome, ${escapeHtml(name)}.</h1><p style="color:#667085;line-height:1.6">Your access request was approved. Create your account or use an email link with this same address, then sign in to the private family portal.</p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#315c45;color:#fff;text-decoration:none;font-weight:bold">Open login</a>`),
})

export const deniedOrMoreInfoEmail = (name: string, message: string) => ({
  subject: 'An update about your ReetzFam.org request',
  html: shell('There is an update about your access request.', `<h1 style="font-size:26px">Hello, ${escapeHtml(name)}.</h1><p style="color:#667085;line-height:1.6">${escapeHtml(message)}</p><p style="color:#667085;line-height:1.6">Reply to the family administrator if you have questions or more context to share.</p>`),
})

export const familyAnnouncementEmail = (title: string, excerpt: string, announcementUrl: string) => ({
  subject: title,
  html: shell('A new private family announcement is available.', `<p style="color:#315c45;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.1em">Family announcement</p><h1 style="font-size:26px">${escapeHtml(title)}</h1><p style="color:#667085;line-height:1.6">${escapeHtml(excerpt)}</p><a href="${escapeHtml(announcementUrl)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#315c45;color:#fff;text-decoration:none;font-weight:bold">Read announcement</a>`),
})
