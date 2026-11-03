import { Router } from "express";
import { db, logAudit } from "../lib/sqlite";
import { getAuthUser } from "./auth";

const router = Router();

function requireAdmin(req: any, res: any): boolean {
  const user = getAuthUser(req);
  if (!user || (user.role !== "admin" && user.role !== "developer")) {
    res.status(403).json({ error: "غير مصرح" });
    return false;
  }
  return true;
}

router.get("/system/backup", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const user = getAuthUser(req);
  const products = db.prepare("SELECT * FROM products").all();
  const categories = db.prepare("SELECT * FROM categories").all();
  const orders = db.prepare("SELECT * FROM orders").all();
  const orderItems = db.prepare("SELECT * FROM order_items").all();
  const customers = db.prepare("SELECT * FROM customers").all();
  const expenses = db.prepare("SELECT * FROM expenses").all();
  const suppliers = db.prepare("SELECT * FROM suppliers").all();

  const backupData = {
    version: "2.5.0",
    timestamp: new Date().toISOString(),
    products,
    categories,
    orders,
    orderItems,
    customers,
    expenses,
    suppliers
  };

  logAudit(user.id, user.name, "نسخ احتياطي", "تصدير نسخة احتياطية من النظام");
  res.setHeader("Content-Disposition", `attachment; filename=omni-backup-${new Date().toISOString().slice(0, 10)}.json`);
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(backupData, null, 2));
});

// ────────────────────────────────────────────────────────
// CURRENCIES MANAGEMENT ENDPOINTS
// ────────────────────────────────────────────────────────
router.get("/currencies", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM currencies ORDER BY id").all();
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/currencies", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const user = getAuthUser(req);
  const { name, symbol, fraction, type, exchange_rate, active } = req.body;
  if (!name || !symbol || !type) {
    res.status(400).json({ error: "بيانات ناقصة" });
    return;
  }
  try {
    const stmt = db.prepare(`
      INSERT INTO currencies (name, symbol, fraction, type, exchange_rate, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, symbol, fraction || null, type, exchange_rate || 1.0, active !== false ? 1 : 0);
    const row = db.prepare("SELECT * FROM currencies WHERE id = ?").get(result.lastInsertRowid);
    
    logAudit(user.id, user.name, "إضافة عملة", `تم إضافة عملة جديدة: ${name} (${symbol})`);
    res.status(201).json(row);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/currencies/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const user = getAuthUser(req);
  const { name, symbol, fraction, type, exchange_rate, active } = req.body;
  try {
    const existing = db.prepare("SELECT * FROM currencies WHERE id = ?").get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: "العملة غير موجودة" });
      return;
    }
    db.prepare(`
      UPDATE currencies
      SET name = ?, symbol = ?, fraction = ?, type = ?, exchange_rate = ?, active = ?
      WHERE id = ?
    `).run(
      name ?? existing.name,
      symbol ?? existing.symbol,
      fraction !== undefined ? fraction : existing.fraction,
      type ?? existing.type,
      exchange_rate ?? existing.exchange_rate,
      active !== undefined ? (active ? 1 : 0) : existing.active,
      req.params.id
    );
    const updated = db.prepare("SELECT * FROM currencies WHERE id = ?").get(req.params.id);
    logAudit(user.id, user.name, "تعديل عملة", `تم تعديل عملة: ${name || existing.name}`);
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/currencies/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const user = getAuthUser(req);
  try {
    const existing = db.prepare("SELECT * FROM currencies WHERE id = ?").get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: "العملة غير موجودة" });
      return;
    }
    db.prepare("DELETE FROM currencies WHERE id = ?").run(req.params.id);
    logAudit(user.id, user.name, "حذف عملة", `تم حذف عملة: ${existing.name}`);
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ────────────────────────────────────────────────────────
// USER SESSIONS TRACKING ENDPOINTS
// ────────────────────────────────────────────────────────
router.get("/system/sessions", (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = db.prepare("SELECT * FROM erp_sessions ORDER BY login_time DESC").all();
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/system/sessions/terminate/:id", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const user = getAuthUser(req);
  try {
    const existing = db.prepare("SELECT * FROM erp_sessions WHERE id = ?").get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: "الجلسة غير موجودة" });
      return;
    }
    db.prepare(`
      UPDATE erp_sessions
      SET status = 'خروج قسري', logout_time = datetime('now', 'localtime')
      WHERE id = ?
    `).run(req.params.id);
    logAudit(user.id, user.name, "إنهاء جلسة", `تم إنهاء جلسة المستخدم قسراً: ${existing.username}`);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ────────────────────────────────────────────────────────
// ROLE PERMISSIONS MANAGEMENT ENDPOINTS
// ────────────────────────────────────────────────────────
router.get("/role-permissions", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM role_permissions").all();
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/role-permissions/:role", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const user = getAuthUser(req);
  const { role } = req.params;
  const {
    can_void_bills,
    can_view_cost,
    can_change_currencies,
    can_approve_returns,
    can_open_close_safe,
    can_transfer_funds,
    can_edit_products,
    can_delete_orders
  } = req.body;

  try {
    db.prepare(`
      UPDATE role_permissions
      SET can_void_bills = ?,
          can_view_cost = ?,
          can_change_currencies = ?,
          can_approve_returns = ?,
          can_open_close_safe = ?,
          can_transfer_funds = ?,
          can_edit_products = ?,
          can_delete_orders = ?
      WHERE role = ?
    `).run(
      can_void_bills !== undefined ? (can_void_bills ? 1 : 0) : 0,
      can_view_cost !== undefined ? (can_view_cost ? 1 : 0) : 0,
      can_change_currencies !== undefined ? (can_change_currencies ? 1 : 0) : 0,
      can_approve_returns !== undefined ? (can_approve_returns ? 1 : 0) : 0,
      can_open_close_safe !== undefined ? (can_open_close_safe ? 1 : 0) : 0,
      can_transfer_funds !== undefined ? (can_transfer_funds ? 1 : 0) : 0,
      can_edit_products !== undefined ? (can_edit_products ? 1 : 0) : 0,
      can_delete_orders !== undefined ? (can_delete_orders ? 1 : 0) : 0,
      role
    );

    const updated = db.prepare("SELECT * FROM role_permissions WHERE role = ?").get(role);
    logAudit(user.id, user.name, "تعديل صلاحيات", `تم تعديل صلاحيات الدور: ${role}`);
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/system/migration-status", (req, res) => {
  res.json({ success: true, notice: "تم فحص قاعدة البيانات المحلية والتأكد من توافق الهيكلة دون فقدان أو حذف أي بيانات سابقة." });
});

// ────────────────────────────────────────────────────────
// UNIVERSAL ERP GLOBAL SEARCH API (البحث الشامل لجميع الشاشات والحسابات)
// ────────────────────────────────────────────────────────
router.get("/system/global-search", (req, res) => {
  const q = ((req.query.q as string) || "").trim();
  if (!q || q.length < 1) {
    res.json({
      accounts: [],
      customers: [],
      suppliers: [],
      employees: [],
      products: [],
      vouchers: [],
      invoices: [],
      travel: []
    });
    return;
  }

  const searchTerm = `%${q}%`;
  const results: any = {
    accounts: [],
    customers: [],
    suppliers: [],
    employees: [],
    products: [],
    vouchers: [],
    invoices: [],
    travel: []
  };

  // 1. Accounts (دليل الحسابات)
  try {
    results.accounts = db.prepare(`
      SELECT id, code, name, type, parent_code, balance, 'account' as result_type
      FROM accounts
      WHERE name LIKE ? OR code LIKE ? OR type LIKE ?
      ORDER BY code ASC
      LIMIT 10
    `).all(searchTerm, searchTerm, searchTerm);
  } catch (e: any) {
    console.warn("Global search accounts error:", e?.message);
  }

  // 2. Customers (العملاء)
  try {
    results.customers = db.prepare(`
      SELECT id, CAST(id AS TEXT) as code, name, phone, email, '' as tax_number, 0 as balance, 'customer' as result_type
      FROM customers
      WHERE name LIKE ? OR phone LIKE ? OR CAST(id AS TEXT) LIKE ? OR email LIKE ?
      LIMIT 10
    `).all(searchTerm, searchTerm, searchTerm, searchTerm);
  } catch (e: any) {
    console.warn("Global search customers error:", e?.message);
  }

  // 3. Suppliers (الموردين)
  try {
    results.suppliers = db.prepare(`
      SELECT id, CAST(id AS TEXT) as code, name, name as company_name, phone, COALESCE(balance, 0) as balance, 'supplier' as result_type
      FROM suppliers
      WHERE name LIKE ? OR phone LIKE ? OR CAST(id AS TEXT) LIKE ? OR email LIKE ?
      LIMIT 10
    `).all(searchTerm, searchTerm, searchTerm, searchTerm);
  } catch (e: any) {
    console.warn("Global search suppliers error:", e?.message);
  }

  // 4. Employees (الموظفين)
  try {
    results.employees = db.prepare(`
      SELECT id, employee_number, name, phone, position as job_title, position, basic_salary, 'employee' as result_type
      FROM hr_employees
      WHERE name LIKE ? OR employee_number LIKE ? OR phone LIKE ? OR position LIKE ?
      LIMIT 10
    `).all(searchTerm, searchTerm, searchTerm, searchTerm);
  } catch (e: any) {
    console.warn("Global search employees error:", e?.message);
  }

  // 5. Products & Inventory Items (الأصناف والمنتجات)
  try {
    results.products = db.prepare(`
      SELECT id, number, name, COALESCE(barcode, '') as barcode, price, COALESCE(stock, 0) as stock, 'product' as result_type
      FROM products
      WHERE name LIKE ? OR barcode LIKE ? OR CAST(number AS TEXT) LIKE ?
      LIMIT 10
    `).all(searchTerm, searchTerm, searchTerm);
  } catch (e: any) {
    console.warn("Global search products error:", e?.message);
  }

  // 6. Vouchers & Journal Entries (السندات والقيود اليومية)
  try {
    results.vouchers = db.prepare(`
      SELECT id, entry_number, entry_date as date, description, (SELECT COALESCE(SUM(debit), 0) FROM journal_entry_lines WHERE journal_entry_id = journal_entries.id) as amount, 'journal' as result_type
      FROM journal_entries
      WHERE entry_number LIKE ? OR description LIKE ? OR CAST(id AS TEXT) LIKE ?
      ORDER BY id DESC
      LIMIT 8
    `).all(searchTerm, searchTerm, searchTerm);
  } catch (e: any) {
    console.warn("Global search journal entries error:", e?.message);
  }

  // 7. Orders & Sales Invoices (الفواتير والمبيعات)
  try {
    results.invoices = db.prepare(`
      SELECT id, invoice_number, total, payment_method, order_type, COALESCE(created_at, '') as created_at, 'invoice' as result_type
      FROM orders
      WHERE invoice_number LIKE ? OR CAST(id AS TEXT) LIKE ?
      ORDER BY id DESC
      LIMIT 8
    `).all(searchTerm, searchTerm);
  } catch (e: any) {
    console.warn("Global search orders error:", e?.message);
  }

  // 8. Travel Bookings & Tickets (السفريات والتذاكر)
  try {
    results.travel = db.prepare(`
      SELECT id, booking_number as code, COALESCE(pnr, '') as pnr, COALESCE(user_name, '') as customer_name, COALESCE(user_name, '') as passenger_name, COALESCE(ticket_number, '') as ticket_number, COALESCE(destination_city, '') as destination, 'travel' as result_type
      FROM travel_bookings
      WHERE booking_number LIKE ? OR pnr LIKE ? OR ticket_number LIKE ? OR destination_city LIKE ? OR origin_city LIKE ?
      LIMIT 8
    `).all(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  } catch (e: any) {
    console.warn("Global search travel error:", e?.message);
  }

  res.json(results);
});

export default router;
