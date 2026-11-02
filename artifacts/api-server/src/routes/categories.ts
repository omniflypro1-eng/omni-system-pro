import { Router } from "express";
import { db } from "../lib/sqlite";
import { getAuthUser } from "./auth";
import { recordAuditLog } from "./audit";

const router = Router();

// GET all categories with relation counts and status
router.get("/categories", (req, res) => {
  const showDeleted = req.query.show_deleted === "true" || req.query.deleted === "true";
  const posOnly = req.query.pos_only === "true";

  let sql = `
    SELECT c.id, c.name, c.color, c.cost, c.revenue,
           COALESCE(c.is_active, 1) as is_active,
           c.deleted_at, c.deleted_by_user_id, c.deleted_by_user_name,
           (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND (p.deleted_at IS NULL OR p.deleted_at = '')) as product_count,
           (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND COALESCE(p.active, 1) = 1 AND (p.deleted_at IS NULL OR p.deleted_at = '')) as active_product_count,
           (SELECT COUNT(DISTINCT oi.order_id) FROM order_items oi WHERE oi.category_id = c.id OR oi.product_id IN (SELECT p2.id FROM products p2 WHERE p2.category_id = c.id)) as orders_count
    FROM categories c
    WHERE 1=1
  `;

  if (showDeleted) {
    sql += " AND c.deleted_at IS NOT NULL AND c.deleted_at != ''";
  } else {
    sql += " AND (c.deleted_at IS NULL OR c.deleted_at = '')";
    if (posOnly) {
      sql += " AND COALESCE(c.is_active, 1) = 1";
    }
  }

  sql += " ORDER BY c.name ASC";

  const rows = (db.prepare(sql).all() as any[]).map(r => ({
    ...r,
    is_active: r.is_active === 1 || r.is_active === true,
    product_count: Number(r.product_count || 0),
    active_product_count: Number(r.active_product_count || 0),
    orders_count: Number(r.orders_count || 0)
  }));

  res.json(rows);
});

// GET category impact before deletion (checks linked products, sales, recipes)
router.get("/categories/:id/impact", (req, res) => {
  const { id } = req.params;
  const cat = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as any;
  if (!cat) {
    res.status(404).json({ error: "التصنيف أو القسم غير موجود" });
    return;
  }

  const linkedProducts = db.prepare(`
    SELECT id, name, number, barcode, price, active 
    FROM products 
    WHERE category_id = ? AND (deleted_at IS NULL OR deleted_at = '')
    LIMIT 20
  `).all(id) as any[];

  const totalProducts = db.prepare(`
    SELECT COUNT(*) as count 
    FROM products 
    WHERE category_id = ? AND (deleted_at IS NULL OR deleted_at = '')
  `).get(id) as { count: number };

  let salesStat = { ordersCount: 0, totalItemsSold: 0, totalRevenue: 0 };
  try {
    const s = db.prepare(`
      SELECT COUNT(DISTINCT oi.order_id) as ordersCount,
             COALESCE(SUM(oi.quantity), 0) as totalItemsSold,
             COALESCE(SUM(oi.total), 0) as totalRevenue
      FROM order_items oi
      WHERE oi.category_id = ? OR oi.product_id IN (SELECT id FROM products WHERE category_id = ?)
    `).get(id, id) as any;
    if (s) {
      salesStat = {
        ordersCount: Number(s.ordersCount || 0),
        totalItemsSold: Number(s.totalItemsSold || 0),
        totalRevenue: Number(s.totalRevenue || 0)
      };
    }
  } catch (err) {
    console.error("Failed to query category sales impact:", err);
  }

  const reasons: string[] = [];
  if ((totalProducts?.count || 0) > 0) {
    reasons.push(`مرتبط به عدد (${totalProducts.count}) منتج وصنف مسجل في المستودعات وقوائم البيع.`);
  }
  if ((salesStat?.ordersCount || 0) > 0) {
    reasons.push(`مرتبط به عدد (${salesStat.ordersCount}) فاتورة مبيعات سابقة بإجمالي مبيعات (${salesStat.totalRevenue.toFixed(2)} ريال).`);
  }

  res.json({
    category: {
      ...cat,
      is_active: cat.is_active !== 0
    },
    linkedProductsCount: totalProducts?.count || 0,
    linkedProductsSample: linkedProducts,
    ordersCount: salesStat?.ordersCount || 0,
    totalItemsSold: salesStat?.totalItemsSold || 0,
    totalRevenue: salesStat?.totalRevenue || 0,
    hasRelations: (totalProducts?.count || 0) > 0 || (salesStat?.ordersCount || 0) > 0,
    reasons,
    recommendation: "يوصى باستخدام زر (إيقاف القسم) كخيار آمن لمنع ظهوره في شاشة الكاشير POS دون المساس بسجلات المحاسبة والفواتير والمنتجات المرتبطة به."
  });
});

router.post("/categories", (req, res) => {
  const user = getAuthUser(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }
  const { name, color, cost, revenue, is_active } = req.body;
  if (!name || !name.trim()) { res.status(400).json({ error: "الاسم مطلوب" }); return; }

  const r = db.prepare("INSERT INTO categories (name, color, cost, revenue, is_active) VALUES (?,?,?,?,?)").run(
    name.trim(),
    color ?? "#f59e0b",
    Number(cost || 0),
    Number(revenue || 0),
    is_active !== false ? 1 : 0
  );

  const cat = db.prepare("SELECT * FROM categories WHERE id=?").get(r.lastInsertRowid) as any;

  recordAuditLog({
    userId: user.id,
    userName: user.name,
    action: `إضافة تصنيف / قسم جديد: "${cat.name}"`,
    actionType: "create",
    entityType: "category",
    entityId: cat.id,
    details: `قام المستخدم ${user.name} بإضافة قسم جديد باسم "${cat.name}" ولون تمييز ${cat.color}`,
    newData: cat
  });

  res.status(201).json({
    ...cat,
    is_active: cat.is_active !== 0
  });
});

// Toggle category active/inactive status (تفعيل أو إيقاف القسم لمنع ظهوره في POS)
router.patch("/categories/:id/status", (req, res) => {
  const user = getAuthUser(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }

  const existing = db.prepare("SELECT * FROM categories WHERE id=?").get(req.params.id) as any;
  if (!existing) {
    res.status(404).json({ error: "التصنيف غير موجود" });
    return;
  }

  const { is_active } = req.body;
  const newStatus = is_active ? 1 : 0;

  db.prepare("UPDATE categories SET is_active=? WHERE id=?").run(newStatus, req.params.id);
  const updated = db.prepare("SELECT * FROM categories WHERE id=?").get(req.params.id) as any;

  recordAuditLog({
    userId: user.id,
    userName: user.name,
    action: newStatus === 1 ? `تفعيل تصنيف / قسم: "${existing.name}"` : `إيقاف تصنيف / قسم: "${existing.name}"`,
    actionType: "update",
    entityType: "category",
    entityId: Number(req.params.id),
    details: `قام المستخدم ${user.name} بـ ${newStatus === 1 ? 'تفعيل' : 'إيقاف'} قسم "${existing.name}" (${newStatus === 1 ? 'مسموح بالظهور في كاشير POS' : 'ممنوع من الظهور في كاشير POS'})`,
    oldData: { is_active: existing.is_active },
    newData: { is_active: newStatus }
  });

  res.json({
    ...updated,
    is_active: updated.is_active !== 0
  });
});

router.put("/categories/:id", (req, res) => {
  const user = getAuthUser(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }

  const existing = db.prepare("SELECT * FROM categories WHERE id=?").get(req.params.id) as any;
  if (!existing) {
    res.status(404).json({ error: "التصنيف غير موجود" });
    return;
  }

  const { name, color, cost, revenue, is_active } = req.body;
  const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : (existing.is_active ?? 1);

  db.prepare("UPDATE categories SET name=?, color=?, cost=?, revenue=?, is_active=? WHERE id=?").run(
    name?.trim() ?? existing.name,
    color ?? existing.color ?? "#f59e0b",
    cost !== undefined ? Number(cost) : (existing.cost || 0),
    revenue !== undefined ? Number(revenue) : (existing.revenue || 0),
    activeVal,
    req.params.id
  );

  const updated = db.prepare("SELECT * FROM categories WHERE id=?").get(req.params.id) as any;

  recordAuditLog({
    userId: user.id,
    userName: user.name,
    action: `تعديل تصنيف / قسم: "${updated.name}"`,
    actionType: "update",
    entityType: "category",
    entityId: Number(req.params.id),
    details: `قام المستخدم ${user.name} بتعديل بيانات قسم "${updated.name}"`,
    oldData: existing,
    newData: updated
  });

  res.json({
    ...updated,
    is_active: updated.is_active !== 0
  });
});

// Soft-delete category with undo window and audit logging
router.delete("/categories/:id", (req, res) => {
  const user = getAuthUser(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }

  const cat = db.prepare("SELECT * FROM categories WHERE id=?").get(req.params.id) as any;
  if (!cat) {
    res.status(404).json({ error: "التصنيف غير موجود" });
    return;
  }

  // Count linked records for audit info
  const linkedProducts = db.prepare("SELECT COUNT(*) as count FROM products WHERE category_id = ? AND (deleted_at IS NULL OR deleted_at = '')").get(cat.id) as { count: number };
  const linkedOrders = db.prepare("SELECT COUNT(DISTINCT order_id) as count FROM order_items WHERE category_id = ? OR product_id IN (SELECT id FROM products WHERE category_id = ?)").get(cat.id, cat.id) as { count: number };

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE categories 
    SET deleted_at = datetime('now', 'localtime'),
        deleted_by_user_id = ?,
        deleted_by_user_name = ?
    WHERE id = ?
  `).run(user.id, user.name, req.params.id);

  recordAuditLog({
    userId: user.id,
    userName: user.name,
    action: `حذف تصنيف أو قسم (مع إمكانية التراجع): "${cat.name}"`,
    actionType: "delete",
    entityType: "category",
    entityId: cat.id,
    details: `قام المستخدم ${user.name} (${user.username || user.role}) بحذف قسم "${cat.name}" (معرف: ${cat.id}). إجمالي الأصناف المرتبطة: ${linkedProducts?.count || 0}، إجمالي فواتير المبيعات: ${linkedOrders?.count || 0}. تم تمكين إمكانية التراجع عن الحذف.`,
    oldData: cat
  });

  res.json({
    success: true,
    message: `تم حذف قسم "${cat.name}" مع إمكانية التراجع`,
    id: cat.id,
    deleted_at: now,
    canUndo: true
  });
});

// Restore deleted category (التراجع عن حذف القسم)
router.post("/categories/:id/restore", (req, res) => {
  const user = getAuthUser(req);
  if (!user) { res.status(401).json({ error: "غير مصرح" }); return; }

  const cat = db.prepare("SELECT * FROM categories WHERE id=?").get(req.params.id) as any;
  if (!cat) {
    res.status(404).json({ error: "التصنيف غير موجود" });
    return;
  }

  db.prepare(`
    UPDATE categories 
    SET deleted_at = NULL,
        deleted_by_user_id = NULL,
        deleted_by_user_name = NULL,
        is_active = 1
    WHERE id = ?
  `).run(req.params.id);

  const restored = db.prepare("SELECT * FROM categories WHERE id=?").get(req.params.id) as any;

  recordAuditLog({
    userId: user.id,
    userName: user.name,
    action: `تراجع عن حذف تصنيف أو قسم: "${cat.name}"`,
    actionType: "update",
    entityType: "category",
    entityId: cat.id,
    details: `قام المستخدم ${user.name} بالتراجع عن حذف قسم "${cat.name}" واستعادته بنجاح إلى النظام وشاشات نقاط البيع.`,
    oldData: cat,
    newData: restored
  });

  res.json({
    success: true,
    message: `تم التراجع عن حذف قسم "${cat.name}" واستعادته بنجاح`,
    category: {
      ...restored,
      is_active: true
    }
  });
});

export default router;
