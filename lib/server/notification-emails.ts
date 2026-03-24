import { sendMail } from '@/lib/server/mailer'
import { canSendEmailNotification } from '@/lib/server/notifications'

type Recipient = {
  email: string | null | undefined
  name?: string | null | undefined
}

function withGreeting(recipient: Recipient, body: string) {
  const name = recipient.name?.trim() || 'Uzytkowniku'
  return `Czesc ${name},\n\n${body}\n\nPozdrawiamy,\nDeskFlow`
}

async function canDeliverEmail(input: {
  companyId?: string
  userId?: string
  type: 'reservation' | 'equipment' | 'reminder' | 'approval' | 'rejection' | 'info'
}) {
  if (!input.companyId || !input.userId) {
    return true
  }

  return canSendEmailNotification({
    companyId: input.companyId,
    userId: input.userId,
    type: input.type,
  })
}

export async function sendResourceChangedEmail(input: {
  recipient: Recipient
  resourceName: string
  changedBy: string
  changeDescription: string
  companyId?: string
  userId?: string
}) {
  if (!input.recipient.email) {
    return
  }

  if (!(await canDeliverEmail({ companyId: input.companyId, userId: input.userId, type: 'equipment' }))) {
    return
  }

  const subject = `Aktualizacja wypozyczonego zasobu: ${input.resourceName}`
  const text = withGreeting(
    input.recipient,
    [
      `Administrator ${input.changedBy} zaktualizowal dane wypozyczonego zasobu ${input.resourceName}.`,
      `Opis zmian: ${input.changeDescription}`,
    ].join('\n')
  )

  await sendMail({ to: input.recipient.email, subject, text })
}

export async function sendReservationCancelledEmail(input: {
  recipient: Recipient
  reservationLabel: string
  reason?: string
  companyId?: string
  userId?: string
}) {
  if (!input.recipient.email) {
    return
  }

  if (!(await canDeliverEmail({ companyId: input.companyId, userId: input.userId, type: 'reservation' }))) {
    return
  }

  const subject = `Anulowano rezerwacje: ${input.reservationLabel}`
  const reasonLine = input.reason ? `Powod: ${input.reason}` : 'Powod: decyzja administratora.'
  const text = withGreeting(
    input.recipient,
    [`Twoja rezerwacja zostala anulowana przez administratora.`, `Szczegoly: ${input.reservationLabel}`, reasonLine].join('\n')
  )

  await sendMail({ to: input.recipient.email, subject, text })
}

export async function sendReservationConfirmedEmail(input: {
  recipient: Recipient
  reservationLabel: string
  companyId?: string
  userId?: string
}) {
  if (!input.recipient.email) {
    return
  }

  if (!(await canDeliverEmail({ companyId: input.companyId, userId: input.userId, type: 'reservation' }))) {
    return
  }

  const subject = `Potwierdzenie rezerwacji: ${input.reservationLabel}`
  const text = withGreeting(
    input.recipient,
    [`Twoja rezerwacja zostala potwierdzona.`, `Szczegoly: ${input.reservationLabel}`].join('\n')
  )

  await sendMail({ to: input.recipient.email, subject, text })
}

export async function sendReservationDecisionEmail(input: {
  recipient: Recipient
  reservationLabel: string
  decision: 'approved' | 'rejected'
  companyId?: string
  userId?: string
}) {
  if (!input.recipient.email) {
    return
  }

  if (
    !(await canDeliverEmail({
      companyId: input.companyId,
      userId: input.userId,
      type: input.decision === 'approved' ? 'approval' : 'rejection',
    }))
  ) {
    return
  }

  const isApproved = input.decision === 'approved'
  const subject = isApproved
    ? `Zaakceptowano Twoj wniosek: ${input.reservationLabel}`
    : `Odrzucono Twoj wniosek: ${input.reservationLabel}`
  const text = withGreeting(
    input.recipient,
    [
      isApproved
        ? 'Administrator zaakceptowal Twoj wniosek o wypozyczenie.'
        : 'Administrator odrzucil Twoj wniosek o wypozyczenie.',
      `Szczegoly: ${input.reservationLabel}`,
    ].join('\n')
  )

  await sendMail({ to: input.recipient.email, subject, text })
}

export async function sendDeskOrRoomRemovedEmail(input: {
  recipient: Recipient
  itemType: 'desk' | 'room'
  itemName: string
  floorName?: string | null
  companyId?: string
  userId?: string
}) {
  if (!input.recipient.email) {
    return
  }

  if (!(await canDeliverEmail({ companyId: input.companyId, userId: input.userId, type: 'reservation' }))) {
    return
  }

  const itemTypeLabel = input.itemType === 'desk' ? 'biurko' : 'sala'
  const location = input.floorName ? `, pietro: ${input.floorName}` : ''
  const subject = `Usunieto ${itemTypeLabel}: ${input.itemName}`
  const text = withGreeting(
    input.recipient,
    `Administrator usunal ${itemTypeLabel}, ktore miales/mialas zarezerwowane: ${input.itemName}${location}. Twoja rezerwacja zostala anulowana.`
  )

  await sendMail({ to: input.recipient.email, subject, text })
}

export async function sendOverdueEquipmentEmail(input: {
  recipient: Recipient
  resourceName: string
  dueAt: Date
  companyId?: string
  userId?: string
}) {
  if (!input.recipient.email) {
    return
  }

  if (!(await canDeliverEmail({ companyId: input.companyId, userId: input.userId, type: 'reminder' }))) {
    return
  }

  const date = input.dueAt.toISOString().slice(0, 16).replace('T', ' ')
  const subject = `Przekroczony termin zwrotu: ${input.resourceName}`
  const text = withGreeting(
    input.recipient,
    [
      `Minel termin zwrotu wypozyczonego zasobu: ${input.resourceName}.`,
      `Termin zwrotu: ${date}`,
      'Prosimy o pilny zwrot lub kontakt z administratorem.',
    ].join('\n')
  )

  await sendMail({ to: input.recipient.email, subject, text })
}

export async function sendResourceIssuedEmail(input: {
  recipient: Recipient
  resourceName: string
  endAt: Date
  companyId?: string
  userId?: string
}) {
  if (!input.recipient.email) {
    return
  }

  if (!(await canDeliverEmail({ companyId: input.companyId, userId: input.userId, type: 'equipment' }))) {
    return
  }

  const dueDate = input.endAt.toISOString().slice(0, 16).replace('T', ' ')
  const subject = `Wydano zasob: ${input.resourceName}`
  const text = withGreeting(
    input.recipient,
    [`Administrator wydal Ci zasob ${input.resourceName}.`, `Termin zwrotu: ${dueDate}`].join('\n')
  )

  await sendMail({ to: input.recipient.email, subject, text })
}

export async function sendResourceReturnedEmail(input: {
  recipient: Recipient
  resourceName: string
  companyId?: string
  userId?: string
}) {
  if (!input.recipient.email) {
    return
  }

  if (!(await canDeliverEmail({ companyId: input.companyId, userId: input.userId, type: 'equipment' }))) {
    return
  }

  const subject = `Zakonczono wypozyczenie: ${input.resourceName}`
  const text = withGreeting(
    input.recipient,
    `Administrator zamknal wypozyczenie zasobu ${input.resourceName} i oznaczyl go jako zwrocony.`
  )

  await sendMail({ to: input.recipient.email, subject, text })
}

export async function sendNewRequestToAdminEmail(input: {
  recipient: Recipient
  requesterName: string
  resourceName: string
  companyId?: string
  userId?: string
}) {
  if (!input.recipient.email) {
    return
  }

  if (!(await canDeliverEmail({ companyId: input.companyId, userId: input.userId, type: 'approval' }))) {
    return
  }

  const subject = `Nowy wniosek do akceptacji: ${input.resourceName}`
  const text = withGreeting(
    input.recipient,
    [
      `${input.requesterName} zlozyl(a) nowy wniosek o wypozyczenie ${input.resourceName}.`,
      'Wejdz do panelu admina i podejmij decyzje.',
    ].join('\n')
  )

  await sendMail({ to: input.recipient.email, subject, text })
}
