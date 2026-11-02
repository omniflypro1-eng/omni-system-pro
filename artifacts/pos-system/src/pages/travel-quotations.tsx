import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { ReportViewerModal } from "@/components/ReportViewerModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Trash2,
  ArrowRight,
  Send,
  Calendar,
  DollarSign,
  Eye,
  Package,
  ShoppingBag,
  User,
  Building2,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function TravelQuotationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [selectedQuo, setSelectedQuo] = useState<any>(null);
  const [reportViewerOpen, setReportViewerOpen] = useState(false);
  const [reportHtml, setReportHtml] = useState("");
  const [reportTitle, setReportTitle] = useState("");

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("شركة الأمل للتجارة والمقاولات");
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10));
  const [terms, setTerms] = useState("العرض ساري لمدة 10 أيام من تاريخه - تسليم البضائع وفق المواعيد المحددة - الدفع عند اعتماد عرض السعر وفق التسهيلات المتفق عليها.");
  const [notes, setNotes] = useState("");

  // Products and Customers query for auto-fill & lookup
  const { data: systemProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: systemCustomers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      if (!res.ok) return [];
      return res.json();
    }
  });

  const [items, setItems] = useState<any[]>([
    {
      product_id: null,
      service_type: "product",
      description: "طابعة فواتير حرارية عالية السرعة XP-80C",
      quantity: 2,
      unit_price: 350,
      cost_price: 280,
      service_fees: 0,
      selling_price: 700
    },
    {
      product_id: null,
      service_type: "product",
      description: "ورق طباعة فواتير حراري 80mm (كرتون 50 رول)",
      quantity: 5,
      unit_price: 135,
      cost_price: 100,
      service_fees: 0,
      selling_price: 675
    }
  ]);

  const addItem = () => {
    setItems([
      ...items,
      {
        product_id: null,
        service_type: "product",
        description: "صنف جديد / خدمة مبيعات",
        quantity: 1,
        unit_price: 100,
        cost_price: 70,
        service_fees: 0,
        selling_price: 100
      }
    ]);
  };

  const handleSelectProduct = (index: number, productIdStr: string) => {
    const prod = systemProducts.find((p: any) => p.id.toString() === productIdStr);
    if (!prod) return;
    const updated = [...items];
    const qty = updated[index].quantity || 1;
    const unitPrice = Number(prod.price || 0);
    const costPrice = Number(prod.cost || prod.price * 0.7 || 0);
    
    updated[index] = {
      ...updated[index],
      product_id: prod.id,
      description: `${prod.name} ${prod.barcode ? `(كود: ${prod.barcode})` : ''}`,
      unit_price: unitPrice,
      cost_price: costPrice * qty,
      selling_price: unitPrice * qty
    };
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;

    // Auto calculate selling price when qty or unit_price changes
    if (field === "quantity" || field === "unit_price") {
      const q = field === "quantity" ? Number(value) : updated[index].quantity || 1;
      const u = field === "unit_price" ? Number(value) : updated[index].unit_price || 0;
      updated[index].selling_price = q * u;
      if (updated[index].cost_price) {
        // scale cost if possible
        const baseUnitCost = updated[index].cost_price / (updated[index].quantity || 1);
        updated[index].cost_price = baseUnitCost * q;
      }
    }
    setItems(updated);
  };

  // Queries
  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["/api/travel/quotations"],
    queryFn: async () => {
      const res = await fetch("/api/travel/quotations");
      return res.json();
    }
  });

  const { data: quoDetails } = useQuery({
    queryKey: ["/api/travel/quotations", selectedQuo?.id],
    queryFn: async () => {
      if (!selectedQuo?.id) return null;
      const res = await fetch(`/api/travel/quotations/${selectedQuo.id}`);
      return res.json();
    },
    enabled: !!selectedQuo?.id
  });

  // Mutations
  const createQuoMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = localStorage.getItem("pos_token") ?? "";
      const res = await fetch("/api/travel/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("فشل إنشاء عرض السعر");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/travel/quotations"] });
      toast({ title: "نجاح", description: "تم إنشاء عرض سعر الطلبية بنجاح ✅" });
      setOpenCreateModal(false);
    }
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: async (quoId: number) => {
      const token = localStorage.getItem("pos_token") ?? "";
      const res = await fetch(`/api/travel/quotations/${quoId}/convert`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("فشل تحويل عرض السعر إلى فاتورة مبيعات");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/travel/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/travel/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "تم تحويل العرض إلى فاتورة مبيعات معتمدة ✅", description: data.message });
    }
  });

  const totalCost = (items || []).reduce((sum, i) => sum + Number(i.cost_price || 0), 0);
  const totalSelling = (items || []).reduce((sum, i) => sum + Number(i.selling_price || 0), 0);

  const filtered = quotations.filter((q: any) =>
    q.quotation_number?.toLowerCase().includes(search.toLowerCase()) ||
    q.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-800">إدارة عروض الأسعار والطلبيات (Sales & Inventory Quotations)</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              إعداد وتصميم عروض أسعار المبيعات والطلبيات للعملاء، واختيار الأصناف والمنتجات المباشرة من المخزن، وتحويل العرض المقبول بنقرة واحدة إلى فاتورة مبيعات معتمدة.
            </p>
          </div>
          <Button onClick={() => setOpenCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-medium shadow-md">
            <Plus className="w-4 h-4" /> إنشاء عرض سعر طلبية جديد
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم عرض السعر، اسم العميل، البيان..."
              className="pr-9"
            />
          </div>
        </div>

        {/* Quotations Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">رقم العرض</th>
                  <th className="p-3.5">العميل والتاريخ</th>
                  <th className="p-3.5">تاريخ الصلاحية</th>
                  <th className="p-3.5">إجمالي العرض للعميل</th>
                  <th className="p-3.5">الربح المتوقع</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5">خيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center p-8 text-slate-400">جاري تحميل عروض الأسعار...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center p-8 text-slate-400">لا توجد عروض أسعار مسجلة بعد</td></tr>
                ) : (
                  filtered.map((q: any) => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-indigo-700">{q.quotation_number}</td>
                      <td className="p-3.5 text-xs">
                        <div className="font-bold text-slate-800">{q.customer_name}</div>
                        <div className="text-slate-500">{q.quotation_date}</div>
                      </td>
                      <td className="p-3.5 text-xs text-amber-700 font-medium">{q.valid_until}</td>
                      <td className="p-3.5 text-xs font-bold text-emerald-700 font-mono">
                        {q.total_selling?.toLocaleString()} ريال
                      </td>
                      <td className="p-3.5 text-xs font-bold text-blue-700 font-mono">
                        +{q.total_profit?.toLocaleString()} ريال
                      </td>
                      <td className="p-3.5">
                        {q.status === 'accepted' ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">مقبول وتَم التحويل ✅</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">مرسل للعميل 📩</span>
                        )}
                      </td>
                      <td className="p-3.5 flex gap-2">
                        {q.status !== 'accepted' && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1 shadow-sm"
                            onClick={() => convertToInvoiceMutation.mutate(q.id)}
                            disabled={convertToInvoiceMutation.isPending}
                          >
                            <ArrowRight className="w-3.5 h-3.5" /> تحويل لفاتورة مبيعات
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1 border-slate-200"
                          onClick={() => { setSelectedQuo(q); setOpenPrintModal(true); }}
                        >
                          <Printer className="w-3.5 h-3.5" /> استعراض وتنسيق
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Create Quotation */}
        <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto font-sans" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <FileText className="w-6 h-6 text-indigo-600" /> إعداد عرض سعر طلبية مبيعات جديد (Sales Quotation Proposal)
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-sm mt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1 md:col-span-2">
                  <Label className="font-bold text-slate-700">اسم العميل / الجهة الطالبة *</Label>
                  <div className="flex gap-2">
                    {systemCustomers.length > 0 && (
                      <Select
                        onValueChange={(val) => {
                          const cust = systemCustomers.find((c) => c.id.toString() === val);
                          if (cust) {
                            setSelectedCustomerId(val);
                            setCustomerName(cust.name);
                          }
                        }}
                      >
                        <SelectTrigger className="w-48 bg-white text-xs">
                          <SelectValue placeholder="اختر من قائمة العملاء" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          {systemCustomers.map((c: any) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name} {c.phone ? `(${c.phone})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="أو اكتب اسم العميل يدويًا..."
                      className="bg-white flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-700">ساري حتى تاريخ</Label>
                  <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="bg-white" />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" /> بنود وأصناف عرض السعر والطلبية:
                  </h4>
                  <Button size="sm" onClick={addItem} variant="outline" className="text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <Plus className="w-3.5 h-3.5" /> إضافة بند جديد
                  </Button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs items-center">
                        {/* Select from Inventory */}
                        <div className="md:col-span-4 space-y-1">
                          <div className="flex justify-between items-center">
                            <Label className="text-[11px] font-semibold text-slate-700">الوصف / البيان</Label>
                            {systemProducts.length > 0 && (
                              <Select onValueChange={(val) => handleSelectProduct(idx, val)}>
                                <SelectTrigger className="h-6 text-[10px] py-0 px-1 border-indigo-200 text-indigo-600">
                                  <SelectValue placeholder="اختر من المخزون 📦" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                  {systemProducts.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                      {p.name} - ({p.price} ريال) {p.stock !== undefined ? `[متوفر: ${p.stock}]` : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <Input
                            className="h-8 text-xs font-medium"
                            value={item.description}
                            onChange={(e) => updateItem(idx, "description", e.target.value)}
                            placeholder="اسم المنتج أو الخدمة..."
                          />
                        </div>

                        {/* Quantity */}
                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700">الكمية</Label>
                          <Input
                            className="h-8 text-xs font-mono font-bold text-center"
                            type="number"
                            min="1"
                            value={item.quantity || 1}
                            onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700">سعر الوحدة</Label>
                          <Input
                            className="h-8 text-xs font-mono font-bold text-indigo-700"
                            type="number"
                            value={item.unit_price || 0}
                            onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))}
                          />
                        </div>

                        {/* Total Selling */}
                        <div className="md:col-span-3 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-700">الإجمالي الصافي</Label>
                          <div className="h-8 px-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between font-mono font-bold text-emerald-700">
                            <span>{(item.selling_price || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500">ريال</span>
                          </div>
                        </div>

                        {/* Delete button */}
                        <div className="md:col-span-1 flex justify-end pt-4 md:pt-0">
                          {items.length > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-red-500 hover:bg-red-50 p-1 h-8 w-8">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Banner */}
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 flex justify-between items-center font-bold text-slate-800 text-xs">
                <span>إجمالي عرض السعر للعميل: <strong className="text-indigo-700 text-sm font-mono">{totalSelling.toLocaleString()} ريال سعودي</strong></span>
                <span className="text-emerald-700 font-mono">الربح المتوقع: +{(totalSelling - totalCost).toLocaleString()} ريال</span>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-1">
                <Label className="font-bold text-slate-700">الشروط والأحكام والضمانات الخاصة بالعرض</Label>
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="شروط التسليم والصلاحية والضمان..." className="text-xs" />
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setOpenCreateModal(false)}>إلغاء</Button>
              <Button
                onClick={() => createQuoMutation.mutate({
                  customer_name: customerName,
                  customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
                  valid_until: validUntil,
                  terms_conditions: terms,
                  notes,
                  items
                })}
                disabled={createQuoMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                حفظ وإرسال عرض السعر
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Printable Commercial Order Quotation Proposal Modal */}
        <Dialog open={openPrintModal} onOpenChange={setOpenPrintModal}>
          <DialogContent className="max-w-3xl font-sans" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> معاينة وتنسيق عرض سعر طلبية مبيعات (Sales Proposal)
              </DialogTitle>
            </DialogHeader>

            <div id="printable-quotation" className="p-6 bg-white border border-slate-200 rounded-2xl space-y-5 text-xs font-sans">
              {/* Quotation Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-1">
                    <Building2 className="w-5 h-5" /> مؤسسة أومني سيستم للتجارة والمبيعات (Omni System Pro)
                  </div>
                  <h2 className="font-extrabold text-xl text-slate-900">عرض سعر طلبية مبيعات وبضائع</h2>
                  <p className="text-slate-500 text-xs">Sales Order Price Quotation Proposal</p>
                </div>
                <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs space-y-1">
                  <div>رقم العرض: <strong className="text-indigo-700">{quoDetails?.quotation_number || selectedQuo?.quotation_number}</strong></div>
                  <div>التاريخ: <strong>{selectedQuo?.quotation_date || new Date().toISOString().slice(0, 10)}</strong></div>
                  <div>الصلاحية حتى: <strong className="text-amber-700">{selectedQuo?.valid_until}</strong></div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500">المقدم إلى العميل / الشركة: </span>
                  <strong className="text-slate-900 text-sm">{selectedQuo?.customer_name}</strong>
                </div>
                <div className="text-slate-600">
                  <span>حالة العرض: </span>
                  <span className="font-bold text-indigo-700">معتمد وقابل للتحويل المباشر لطلب مبيعات</span>
                </div>
              </div>

              {/* Table of Items */}
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-y border-slate-200">
                    <th className="p-2.5 w-12 text-center">#</th>
                    <th className="p-2.5">اسم المنتج / بيان الخدمة والطلبية</th>
                    <th className="p-2.5 text-center w-24">سعر الوحدة</th>
                    <th className="p-2.5 text-center w-24">المبلغ الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(quoDetails?.items || []).length > 0 ? (
                    quoDetails?.items?.map((it: any, idx: number) => (
                      <tr key={it.id || idx}>
                        <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-medium text-slate-800">{it.description}</td>
                        <td className="p-2.5 text-center font-mono">
                          {it.selling_price ? Math.round(it.selling_price / (it.quantity || 1)).toLocaleString() : 0} ريال
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-indigo-700">
                          {it.selling_price?.toLocaleString()} ريال
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">لا توجد بنود تفصيلية مسجلة في هذا العرض</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t-2 border-indigo-600 pt-3 flex justify-between items-center font-bold text-base text-slate-900 bg-indigo-50/50 p-3 rounded-xl">
                <span>الإجمالي العام لعرض السعر والطلبية:</span>
                <span className="text-indigo-700 font-mono text-lg">{selectedQuo?.total_selling?.toLocaleString()} ريال سعودي</span>
              </div>

              {/* Terms */}
              <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-600 border border-slate-200 space-y-1">
                <strong className="text-slate-800">الشروط والأحكام والضمان التجاري:</strong>
                <p className="leading-relaxed">{selectedQuo?.terms_conditions || "العرض ساري لمدة 10 أيام من تاريخه - البضائع المباعة يتم تسليمها وفق المواعيد والكميات المتاحة."}</p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-4 text-center text-[11px] text-slate-500 border-t border-slate-100">
                <div>توقيع وتختيم المسؤول / المبيعات: .........................</div>
                <div>اعتماد وتوقيع العميل بالموافقة: .........................</div>
              </div>
            </div>

            <DialogFooter className="gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setOpenPrintModal(false)}>إغلاق</Button>
              <Button
                variant="outline"
                onClick={() => {
                  const elem = document.getElementById("printable-quotation");
                  if (elem) {
                    setReportHtml(elem.innerHTML);
                    setReportTitle(`عرض سعر طلبية مبيعات - ${selectedQuo?.quotation_number || ""}`);
                    setReportViewerOpen(true);
                  }
                }}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1.5 font-bold"
              >
                <Eye className="w-4 h-4 text-indigo-600" />
                استعراض قبل الطباعة
              </Button>
              <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold shadow-sm">
                <Printer className="w-4 h-4" /> طباعة مباشرة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ReportViewerModal
          isOpen={reportViewerOpen}
          onClose={() => setReportViewerOpen(false)}
          htmlContent={reportHtml}
          title={reportTitle}
        />
      </div>
    </AdminLayout>
  );
}
