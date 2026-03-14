import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

export const companyPlanEnum = pgEnum('company_plan_enum', ['starter', 'growth', 'enterprise'])
export const companyStatusEnum = pgEnum('company_status_enum', ['active', 'trial', 'suspended'])
export const userRoleEnum = pgEnum('user_role_enum', ['superadmin', 'admin', 'user'])
export const userStatusEnum = pgEnum('user_status_enum', ['active', 'inactive', 'suspended'])
export const membershipRoleEnum = pgEnum('membership_role_enum', ['admin', 'user'])
export const membershipStatusEnum = pgEnum('membership_status_enum', ['active', 'inactive', 'suspended'])
export const floorElementTypeEnum = pgEnum('floor_element_type_enum', ['desk', 'room', 'wall', 'door'])
export const resourceStatusEnum = pgEnum('resource_status_enum', ['available', 'borrowed', 'maintenance'])
export const resourceCategoryEnum = pgEnum('resource_category_enum', ['laptops', 'monitors', 'projectors', 'vehicles', 'accessories'])
export const reservationTypeEnum = pgEnum('reservation_type_enum', ['desk', 'room', 'equipment'])
export const reservationStatusEnum = pgEnum('reservation_status_enum', [
  'pending',
  'approved',
  'issued',
  'active',
  'upcoming',
  'completed',
  'cancelled',
  'rejected',
])

export const companies = pgTable('companies', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  plan: companyPlanEnum('plan').notNull().default('starter'),
  status: companyStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  department: varchar('department', { length: 128 }),
  role: userRoleEnum('role').notNull().default('user'),
  status: userStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const userCompanyMemberships = pgTable(
  'user_company_memberships',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    role: membershipRoleEnum('role').notNull().default('user'),
    status: membershipStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCompanyUnique: uniqueIndex('user_company_memberships_user_company_unique').on(
      table.userId,
      table.companyId
    ),
  })
)

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
  type: floorElementTypeEnum('type').notNull(),
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
  category: resourceCategoryEnum('category'),
  location: varchar('location', { length: 255 }).notNull(),
  serialNumber: varchar('serial_number', { length: 128 }),
  description: text('description'),
  status: resourceStatusEnum('status').notNull().default('available'),
})

export const subscriptionPackages = pgTable('subscription_packages', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  price: integer('price').notNull().default(0),
  maxUsers: integer('max_users').notNull().default(1),
  maxResources: integer('max_resources').notNull().default(100),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reservations = pgTable('reservations', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  type: reservationTypeEnum('type').notNull(),
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
  status: reservationStatusEnum('status').notNull().default('active'),
  pendingApproval: boolean('pending_approval').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const companiesRelations = relations(companies, ({ many, one }) => ({
  users: many(users),
  memberships: many(userCompanyMemberships),
  floors: many(floors),
  resources: many(resources),
  reservations: many(reservations),
  branding: one(companyBranding, {
    fields: [companies.id],
    references: [companyBranding.companyId],
  }),
}))

export const companyBrandingRelations = relations(companyBranding, ({ one }) => ({
  company: one(companies, {
    fields: [companyBranding.companyId],
    references: [companies.id],
  }),
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
  memberships: many(userCompanyMemberships),
  reservations: many(reservations),
}))

export const userCompanyMembershipsRelations = relations(userCompanyMemberships, ({ one }) => ({
  user: one(users, {
    fields: [userCompanyMemberships.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [userCompanyMemberships.companyId],
    references: [companies.id],
  }),
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
