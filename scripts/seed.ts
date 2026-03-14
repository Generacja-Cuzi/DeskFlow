import { and, eq, inArray } from 'drizzle-orm'

import { db } from '../lib/db/client'
import {
  companies,
  companyBranding,
  floorElements,
  floors,
  reservations,
  resources,
  users,
} from '../lib/db/schema'

async function seed() {
  const companyId = 'company-techstart'

  const existing = await db.query.companies.findFirst({ where: eq(companies.id, companyId) })

  if (!existing) {
    await db.insert(companies).values([
      {
        id: companyId,
        name: 'TechStart Sp. z o.o.',
        slug: 'techstart',
        plan: 'business',
        status: 'active',
      },
      {
        id: 'company-marketingpro',
        name: 'Marketing Pro',
        slug: 'marketingpro',
        plan: 'starter',
        status: 'active',
      },
      {
        id: 'company-designxyz',
        name: 'Design Studio XYZ',
        slug: 'designxyz',
        plan: 'starter',
        status: 'trial',
      },
    ])
  }

  await db
    .insert(companyBranding)
    .values({
      companyId,
      name: 'DeskFlow',
      primaryColor: '#3b82f6',
      secondaryColor: '#10b981',
      textColor: '#111827',
      activeButtonTextColor: '#ffffff',
      description: 'Nowoczesne rozwiazania do zarzadzania biurem',
      website: 'https://deskflow.local',
      address: 'Warszawa, ul. Przemyslowa 10',
      phone: '+48 600 100 100',
    })
    .onConflictDoUpdate({
      target: companyBranding.companyId,
      set: {
        name: 'DeskFlow',
        primaryColor: '#3b82f6',
        secondaryColor: '#10b981',
      },
    })

  await db
    .insert(users)
    .values([
      {
        id: 'user-jan-kowalski',
        companyId,
        name: 'Jan Kowalski',
        email: '272715@student.pwr.edu.pl',
        department: 'IT',
        role: 'superadmin',
        status: 'active',
      },
      {
        id: 'user-anna-nowak',
        companyId,
        name: 'Anna Nowak',
        email: 'anna.nowak@firma.pl',
        department: 'Marketing',
        role: 'user',
        status: 'active',
      },
      {
        id: 'user-piotr-wisniewski',
        companyId,
        name: 'Piotr Wisniewski',
        email: 'piotr.wisniewski@firma.pl',
        department: 'Sales',
        role: 'user',
        status: 'active',
      },
      {
        id: 'user-maria-kowalczyk',
        companyId,
        name: 'Maria Kowalczyk',
        email: 'maria.kowalczyk@firma.pl',
        department: 'HR',
        role: 'user',
        status: 'inactive',
      },
    ])
    .onConflictDoNothing()

  await db
    .delete(reservations)
    .where(eq(reservations.companyId, companyId))

  await db
    .delete(resources)
    .where(eq(resources.companyId, companyId))

  const existingFloors = await db.query.floors.findMany({ where: eq(floors.companyId, companyId) })
  if (existingFloors.length) {
    await db.delete(floorElements).where(inArray(floorElements.floorId, existingFloors.map((f) => f.id)))
    await db.delete(floors).where(eq(floors.companyId, companyId))
  }

  await db.insert(floors).values([
    {
      id: 'floor-1',
      companyId,
      name: 'Pietro 1',
      floorNumber: 1,
      canvasWidth: 1400,
      canvasHeight: 900,
    },
    {
      id: 'floor-2',
      companyId,
      name: 'Pietro 2',
      floorNumber: 2,
      canvasWidth: 1200,
      canvasHeight: 800,
    },
  ])

  await db.insert(floorElements).values([
    {
      id: 'desk-a01',
      floorId: 'floor-1',
      type: 'desk',
      x: 100,
      y: 100,
      width: 80,
      height: 60,
      rotation: 0,
      name: 'Biurko A-01',
      capacity: 1,
      equipment: ['Monitor 27"', 'Stacja dokujaca'],
      floor: 1,
      status: 'available',
      zone: 'Strefa A',
    },
    {
      id: 'desk-a02',
      floorId: 'floor-1',
      type: 'desk',
      x: 200,
      y: 100,
      width: 80,
      height: 60,
      rotation: 0,
      name: 'Biurko A-02',
      capacity: 1,
      equipment: ['Monitor 24"'],
      floor: 1,
      status: 'occupied',
      reservedBy: 'Jan Kowalski',
      reservedUntil: '17:00',
      zone: 'Strefa A',
    },
    {
      id: 'desk-a03',
      floorId: 'floor-1',
      type: 'desk',
      x: 300,
      y: 100,
      width: 80,
      height: 60,
      rotation: 0,
      name: 'Biurko A-03',
      capacity: 1,
      equipment: ['Monitor 27"', 'Stacja dokujaca', 'Telefon'],
      floor: 1,
      status: 'reserved',
      reservedBy: 'Anna Nowak',
      reservedUntil: '14:30',
      zone: 'Strefa A',
    },
    {
      id: 'room-sala-a',
      floorId: 'floor-1',
      type: 'room',
      x: 100,
      y: 250,
      width: 200,
      height: 150,
      rotation: 0,
      name: 'Sala Konferencyjna A',
      capacity: 8,
      equipment: ['Projektor', 'Wideokonferencja', 'Whiteboard'],
      floor: 1,
      status: 'available',
      timeSlots: [
        { time: '08:00 - 09:00', available: false, bookedBy: 'Team Alpha', meetingTitle: 'Daily Standup' },
        { time: '09:00 - 10:00', available: true },
        { time: '10:00 - 11:00', available: true },
        { time: '11:00 - 12:00', available: false, bookedBy: 'Team Beta', meetingTitle: 'Sprint Planning' },
      ],
    },
    {
      id: 'room-sala-b',
      floorId: 'floor-1',
      type: 'room',
      x: 400,
      y: 250,
      width: 180,
      height: 120,
      rotation: 0,
      name: 'Sala Konferencyjna B',
      capacity: 6,
      equipment: ['Monitor 55"', 'Kamera', 'Mikrofony'],
      floor: 1,
      status: 'occupied',
      timeSlots: [
        { time: '08:00 - 09:00', available: true },
        { time: '09:00 - 10:00', available: false, bookedBy: 'Management', meetingTitle: 'Board Meeting' },
        { time: '10:00 - 11:00', available: false, bookedBy: 'Management', meetingTitle: 'Board Meeting' },
        { time: '11:00 - 12:00', available: true },
      ],
    },
    {
      id: 'desk-b01',
      floorId: 'floor-2',
      type: 'desk',
      x: 150,
      y: 120,
      width: 80,
      height: 60,
      rotation: 0,
      name: 'Biurko B-01',
      capacity: 1,
      equipment: ['Monitor 32"', 'Stacja dokujaca', 'Telefon'],
      floor: 2,
      status: 'available',
      zone: 'Strefa B',
    },
    {
      id: 'desk-b02',
      floorId: 'floor-2',
      type: 'desk',
      x: 250,
      y: 120,
      width: 80,
      height: 60,
      rotation: 0,
      name: 'Biurko B-02',
      capacity: 1,
      equipment: ['Monitor 27"'],
      floor: 2,
      status: 'available',
      zone: 'Strefa B',
    },
    {
      id: 'room-sala-c',
      floorId: 'floor-2',
      type: 'room',
      x: 150,
      y: 250,
      width: 220,
      height: 160,
      rotation: 0,
      name: 'Sala Konferencyjna C',
      capacity: 12,
      equipment: ['Projektor', 'System audio', 'Whiteboard', 'Flipchart'],
      floor: 2,
      status: 'available',
      timeSlots: [
        { time: '08:00 - 09:00', available: true },
        { time: '09:00 - 10:00', available: true },
        { time: '10:00 - 11:00', available: true },
        { time: '11:00 - 12:00', available: true },
      ],
    },
  ])

  await db.insert(resources).values([
    { id: 'res-1', companyId, name: 'Biurko A-01', type: 'Biurko', category: 'desks', location: 'Strefa A, P1', status: 'available' },
    { id: 'res-2', companyId, name: 'Sala Konferencyjna A', type: 'Sala', category: 'rooms', location: 'Pietro 1', status: 'occupied' },
    { id: 'res-3', companyId, name: 'MacBook Pro 16" M3', type: 'Laptop', category: 'laptops', location: 'Magazyn IT', serialNumber: 'MBP-2024-001', description: 'Apple M3 Pro, 18GB RAM, 512GB SSD', status: 'available' },
    { id: 'res-4', companyId, name: 'MacBook Pro 14" M3', type: 'Laptop', category: 'laptops', location: 'Magazyn IT', serialNumber: 'MBP-2024-002', description: 'Apple M3, 16GB RAM, 512GB SSD', status: 'borrowed' },
    { id: 'res-5', companyId, name: 'Dell XPS 15', type: 'Laptop', category: 'laptops', location: 'Magazyn IT', serialNumber: 'DELL-2024-001', description: 'Intel i7, 32GB RAM, 1TB SSD', status: 'available' },
    { id: 'res-6', companyId, name: 'ThinkPad X1 Carbon', type: 'Laptop', category: 'laptops', location: 'Serwis', serialNumber: 'TP-2023-015', description: 'Intel i5, 16GB RAM, 512GB SSD', status: 'maintenance' },
    { id: 'res-7', companyId, name: 'Projektor Epson EB-L260F', type: 'Projektor', category: 'projectors', location: 'Magazyn IT', serialNumber: 'PROJ-2024-001', description: '4600 lumenow, Full HD, Laser', status: 'available' },
    { id: 'res-8', companyId, name: 'Ford Focus', type: 'Pojazd', category: 'vehicles', location: 'Parking', serialNumber: 'WW12345', description: 'Samochod sluzbowy, benzyna, 2023', status: 'borrowed' },
  ])

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  await db.insert(reservations).values([
    {
      id: 'reservation-1',
      companyId,
      userId: 'user-jan-kowalski',
      type: 'desk',
      targetId: 'desk-a01',
      name: 'Biurko A-01',
      location: 'Strefa A, Pietro 1',
      startAt: now,
      endAt: new Date(now.getTime() + 8 * 60 * 60 * 1000),
      date: now.toISOString().slice(0, 10),
      status: 'active',
    },
    {
      id: 'reservation-2',
      companyId,
      userId: 'user-anna-nowak',
      type: 'room',
      targetId: 'room-sala-b',
      name: 'Sala Konferencyjna B',
      location: 'Pietro 1',
      startAt: tomorrow,
      endAt: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
      date: tomorrow.toISOString().slice(0, 10),
      timeSlot: '10:00 - 12:00',
      meetingTitle: 'Spotkanie kwartalne',
      participantCount: 6,
      status: 'upcoming',
    },
    {
      id: 'reservation-3',
      companyId,
      userId: 'user-maria-kowalczyk',
      type: 'equipment',
      targetId: 'res-8',
      resourceId: 'res-8',
      name: 'Ford Focus',
      location: 'Parking',
      startAt: now,
      endAt: tomorrow,
      date: now.toISOString().slice(0, 10),
      status: 'upcoming',
      pendingApproval: true,
    },
  ])

  const borrowedEquipment = await db.query.resources.findFirst({ where: and(eq(resources.id, 'res-4'), eq(resources.companyId, companyId)) })
  if (borrowedEquipment) {
    await db
      .insert(reservations)
      .values({
        id: 'reservation-4',
        companyId,
        userId: 'user-anna-nowak',
        type: 'equipment',
        targetId: 'res-4',
        resourceId: 'res-4',
        name: 'MacBook Pro 14" M3',
        location: 'Magazyn IT',
        startAt: now,
        endAt: tomorrow,
        date: now.toISOString().slice(0, 10),
        status: 'active',
      })
      .onConflictDoNothing()
  }

  console.log('Seed completed')
}

seed()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => process.exit(0))
