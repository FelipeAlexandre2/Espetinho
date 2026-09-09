import { pgTable, text, real, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: real('price').notNull(),
  costPrice: real('cost_price').notNull().default(0),
  description: text('description').notNull().default(''),
  photoUrl: text('photo_url').notNull().default(''),
  requiresMeatPoint: boolean('requires_meat_point').notNull().default(false),
  isAvailable: boolean('is_available').notNull().default(true),
  isQuickPos: boolean('is_quick_pos').notNull().default(false),
  stockQty: integer('stock_qty').notNull().default(0),
  unit: text('unit').notNull().default('unid'),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: integer('order_number').notNull(),
  tableOrCustomer: text('table_or_customer').notNull(),
  items: jsonb('items').notNull().default([]),
  status: text('status').notNull().default('novo'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  subtotal: real('subtotal').notNull().default(0),
  discount: real('discount').notNull().default(0),
  serviceFee: real('service_fee').notNull().default(0),
  total: real('total').notNull().default(0),
  paymentMethod: text('payment_method'),
  isPaid: boolean('is_paid').notNull().default(false),
  notes: text('notes'),
});

export const stockItems = pgTable('stock_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  currentQty: integer('current_qty').notNull().default(0),
  minQty: integer('min_qty').notNull().default(5),
  unit: text('unit').notNull().default('unid'),
  costPrice: real('cost_price').notNull().default(0),
  supplier: text('supplier').notNull().default(''),
  lastRestocked: text('last_restocked').notNull(),
});

export const cashShifts = pgTable('cash_shifts', {
  id: text('id').primaryKey(),
  openedAt: text('opened_at').notNull(),
  closedAt: text('closed_at'),
  operatorName: text('operator_name').notNull(),
  initialFloat: real('initial_float').notNull().default(0),
  salesByPaymentMethod: jsonb('sales_by_payment_method').notNull().default({ pix: 0, credito: 0, debito: 0, dinheiro: 0 }),
  totalSales: real('total_sales').notNull().default(0),
  status: text('status').notNull().default('aberto'),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('garcom'),
  pin: text('pin').notNull(),
  phone: text('phone'),
  avatar: text('avatar'),
  status: text('status').notNull().default('ativo'),
  permissions: jsonb('permissions').notNull().default({}),
  createdAt: text('created_at').notNull(),
  lastLogin: text('last_login'),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  formattedDate: text('formatted_date'),
  category: text('category').notNull().default('sistema'),
  actionType: text('action_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  userName: text('user_name').notNull(),
  userRole: text('user_role').notNull().default('admin'),
  userAvatar: text('user_avatar'),
  severity: text('severity').notNull().default('info'),
  details: jsonb('details').default({}),
  ipAddress: text('ip_address'),
});

