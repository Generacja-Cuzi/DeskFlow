import nodemailer from 'nodemailer'

type MailPayload = {
  to: string
  subject: string
  text: string
  html?: string
}

let transporter: nodemailer.Transporter | null = null

function toInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getTransporter() {
  if (transporter) {
    return transporter
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = toInt(process.env.SMTP_PORT, 465)
  const user = process.env.SMTP_USER
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!user || !clientId || !clientSecret || !refreshToken) {
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: {
      type: 'OAuth2',
      user,
      clientId,
      clientSecret,
      refreshToken,
    },
  })

  return transporter
}

export async function sendMail(payload: MailPayload) {
  const tx = getTransporter()

  if (!tx) {
    console.warn('Mailer is not configured. Set SMTP_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN.')
    return { ok: false as const, skipped: true as const }
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER

  if (!from) {
    console.warn('Mailer is not configured. Missing SMTP_FROM or SMTP_USER.')
    return { ok: false as const, skipped: true as const }
  }

  await tx.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  })

  return { ok: true as const, skipped: false as const }
}
