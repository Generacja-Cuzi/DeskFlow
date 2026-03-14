import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

export const companies = pgTable('companies', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  plan: varchar('plan', { length: 32 }).notNull().default('starter'),
  status: varchar('status', { length: 32 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  department: varchar('department', { length: 128 }),
  role: varchar('role', { length: 32 }).notNull().default('user'),
  status: varchar('status', { length: 32 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const companyBranding = pgTable('company_branding', {
  companyId: text('company_id').primaryKey().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  logo: text('logo'),
  primaryColor: varchar('primary_color', { length: 32 }).notNull().default('#3b82f6'),
  secondaryColor: varchar('secondary_color', { length: 32 }).notNull().default('#10b981'),
  textColor: varchar('text_color', { length: 32 }).notNull().default('#111827'),
  activeButtonTextColor: varchar('active_button_text_color', { length: 32 }).notNull().default('#ffffff'),
  description: text('description'),
  website: text('website'),
  address: text('address'),
  phone: varchar('phone', { length: 64 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const floors = pgTable('floors', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  floorNumber: integer('floor_number').notNull(),
  canvasWidth: integer('canvas_width').notNull().default(1200),
  canvasHeight: integer('canvas_height').notNull().default(800),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const floorElements = pgTable('floor_elements', {
  id: text('id').primaryKey(),
  floorId: text('floor_id').notNull().references(() => floors.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 32 }).notNull(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  rotation: integer('rotation').notNull().default(0),
  name: varchar('name', { length: 255 }).notNull(),
  capacity: integer('capacity'),
  equipment: jsonb('equipment').$type<string[]>().notNull().default([]),
  floor: integer('floor').notNull(),
  status: varchar('status', { length: 32 }),
  reservedBy: varchar('reserved_by', { length: 255 }),
  reservedUntil: varchar('reserved_until', { length: 64 }),
  timeSlots: jsonb('time_slots')
    .$type<Array<{ time: string; available: boolean; bookedBy?: string; meetingTitle?: string }>>()
    .notNull()
    .default([]),
  zone: varchar('zone', { length: 128 }),
  description: text('description'),
  labelFontFamily: varchar('label_font_family', { length: 128 }),
  labelFontSize: integer('label_font_size'),
  labelColor: varchar('label_color', { length: 32 }),
  labelOffsetX: integer('label_offset_x'),
  labelOffsetY: integer('label_offset_y'),
})

export const resources = pgTable('resources', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 64 }).notNull(),
  category: varchar('category', { length: 64 }),
  location: varchar('location', { length: 255 }).notNull(),
  serialNumber: varchar('serial_number', { length: 128 }),
  description: text('description'),
  status: varchar('status', { length: 32 }).notNull().default('available'),
})

export const reservations = pgTable('reservations', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 32 }).notNull(),
  targetId: text('target_id').notNull(),
  resourceId: text('resource_id').references(() => resources.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  date: varchar('date', { length: 16 }).notNull(),
  timeSlot: varchar('time_slot', { length: 32 }),
  meetingTitle: varchar('meeting_title', { length: 255 }),
  participantCount: integer('participant_count'),
  status: varchar('status', { length: 32 }).notNull().default('active'),
  pendingApproval: boolean('pending_approval').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const companiesRelations = relations(companies, ({ many, one }) => ({
  users: many(users),
  floors: many(floors),
  resources: many(resources),
  reservations: many(reservations),
  branding: one(companyBranding),
}))

export const floorsRelations = relations(floors, ({ many, one }) => ({
  company: one(companies, {
    fields: [floors.companyId],
    references: [companies.id],
  }),
  elements: many(floorElements),
}))

export const floorElementsRelations = relations(floorElements, ({ one }) => ({
  floor: one(floors, {
    fields: [floorElements.floorId],
    references: [floors.id],
  }),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  reservations: many(reservations),
}))

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  company: one(companies, {
    fields: [resources.companyId],
    references: [companies.id],
  }),
  reservations: many(reservations),
}))

export const reservationsRelations = relations(reservations, ({ one }) => ({
  company: one(companies, {
    fields: [reservations.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
  resource: one(resources, {
    fields: [reservations.resourceId],
    references: [resources.id],
  }),
}))
