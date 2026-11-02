import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGetDashboardSummary, useGetTopProducts, useGetSalesByHour, useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, DollarSign, Receipt, TrendingUp, Package, Users, ShoppingCart, Percent, Sparkles, Building2, Smartphone, Monitor, Plus, Bell, RefreshCw, Send, Wallet, UserCheck, Coins, Briefcase, Ruler, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

function fetchWithAuth<T>(url: string): Promise<T> {
  const token = localStorage.getItem("pos_token") ?? "";
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
}

function fmt(n?: number) { return Number(n ?? 0).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

const now = new Date();
const today = now.toISOString().slice(0, 10);
const monthStart = today.slice(0, 7) + "-01";
const dateParams = `?startDate=${monthStart}&endDate=${today}`;

const PAYMENT_COLORS: Record<string, string> = { cash: "#1e3a5f", card: "#3b82f6", mixed: "#f59e0b" };
const PAYMENT_LABELS: Record<string, string> = { cash: "نقداً", card: "شبكة", mixed: "مختلط" };

export default function Dashboard() {
  const qc = useQueryClient();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: topProducts, isLoading: isLoadingTopProducts } = useGetTopProducts();
  const { data: salesByHour, isLoading: isLoadingSalesByHour } = useGetSalesByHour();
  const { data: settings } = useGetSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [isMobileAppView, setIsMobileAppView] = useState(false);

  const { data: paymentRows = [] } = useQuery<any[]>({
    queryKey: ["dash-payment"],
    queryFn: () => fetchWithAuth(`/api/reports/by-payment${dateParams}`),
  });
  const { data: categoryRows = [] } = useQuery<any[]>({
    queryKey: ["dash-category"],
    queryFn: () => fetchWithAuth(`/api/reports/by-category${dateParams}`),
  });

  const [initForm, setInitForm] = useState({
    businessName: "",
    currency: "ريال يمني"
  });

  useEffect(() => {
    if (settings) {
      setInitForm({
        businessName: settings.businessName || "مخابز الشام",
        currency: settings.currency || "ريال يمني"
      });
    }
  }, [settings]);

  if (isLoadingSummary || isLoadingTopProducts || isLoadingSalesByHour) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const isInitialized = settings?.initialized === "true" || settings?.initialized === true;

  const handleInitialize = () => {
    updateSettingsMutation.mutate({
      businessName: initForm.businessName,
      currency: initForm.currency,
      initialized: "true"
    }, {
      onSuccess: () => {
        const token = localStorage.getItem("pos_token") ?? "";
        fetch("/api/safes", { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(safesList => {
            const mainSafe = safesList.find((s: any) => s.name === "الصندوق الرئيسي");
            if (mainSafe) {
              fetch(`/api/safes/${mainSafe.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  name: mainSafe.name,
                  balance: mainSafe.balance,
                  currency: initForm.currency,
                  notes: mainSafe.notes,
                  active: mainSafe.active === 1
                })
              });
            }
          });
        qc.invalidateQueries({ queryKey: ["settings"] });
        alert("تمت تهيئة النظام وتحديث مسمى النشاط والعملة الافتراضية بنجاح!");
      }
    });
  };

  const avgOrderValue = summary && summary.todayOrders > 0 ? summary.todaySales / summary.todayOrders : 0;

  if (isMobileAppView) {
    return (
      <AdminLayout>
        <div className="max-w-md mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700 my-2 relative">
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wide">أومي سيستم برو</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => qc.invalidateQueries()} title="تحديث" className="p-1.5 hover:bg-blue-700 rounded-full transition"><RefreshCw className="w-4 h-4" /></button>
              <button title="الإشعارات" className="p-1.5 hover:bg-blue-700 rounded-full transition relative"><Bell className="w-4 h-4" /><span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span></button>
              <Button size="sm" variant="ghost" onClick={() => setIsMobileAppView(false)} className="text-white hover:bg-blue-700 text-xs px-2.5 py-1 h-7">
                <Monitor className="w-3.5 h-3.5 ml-1" /> لوحة الكمبيوتر
              </Button>
            </div>
          </div>

          <div className="p-3 bg-slate-950 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => window.location.href = "/vouchers"} className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 h-auto flex flex-col items-center justify-center rounded-xl shadow">
                <span>سند جديد</span>
              </Button>
              <Button onClick={() => window.location.href = "/travel-bookings"} className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 h-auto flex flex-col items-center justify-center rounded-xl shadow">
                <span>حوالة جديدة</span>
              </Button>
              <Button onClick={() => window.location.href = "/accounting"} className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 h-auto flex flex-col items-center justify-center rounded-xl shadow">
                <span>كشف حساب</span>
              </Button>
              <Button onClick={() => window.location.href = "/accounting"} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 h-auto flex flex-col items-center justify-center rounded-xl shadow">
                <span>قيد بسيط</span>
              </Button>
              <Button onClick={() => window.location.href = "/reports"} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 h-auto flex flex-col items-center justify-center rounded-xl shadow">
                <span>الحركة اليومية</span>
              </Button>
              <Button onClick={() => window.location.href = "/safes"} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 h-auto flex flex-col items-center justify-center rounded-xl shadow">
                <span>صناديق النقدية</span>
              </Button>
              <Button onClick={() => window.location.href = "/pos"} className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 h-auto flex flex-col items-center justify-center rounded-xl shadow">
                <span>فاتورة جديدة</span>
              </Button>
              <Button onClick={() => window.location.href = "/currencies"} className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 h-auto flex flex-col items-center justify-center rounded-xl shadow">
                <span>صرف عملات</span>
              </Button>
              <Button onClick={() => window.location.href = "/orders"} className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 h-auto flex flex-col items-center justify-center rounded-xl shadow">
                <span>البحث السريع</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-16">
              <div onClick={() => window.location.href = "/customers"} className="bg-white text-slate-900 rounded-2xl p-4 shadow-lg flex flex-col items-center text-center cursor-pointer hover:bg-slate-50 transition border border-slate-200">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">العملاء</h3>
                <p className="text-xs font-bold text-red-600 mt-1">{summary?.totalCustomers || 0} عميل</p>
              </div>

              <div onClick={() => window.location.href = "/suppliers"} className="bg-white text-slate-900 rounded-2xl p-4 shadow-lg flex flex-col items-center text-center cursor-pointer hover:bg-slate-50 transition border border-slate-200">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">الموردين</h3>
                <p className="text-xs font-bold text-red-600 mt-1">مورد معتمد</p>
              </div>

              <div onClick={() => window.location.href = "/accounting"} className="bg-white text-slate-900 rounded-2xl p-4 shadow-lg flex flex-col items-center text-center cursor-pointer hover:bg-slate-50 transition border border-slate-200">
                <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <Coins className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">الديون والذمم</h3>
                <p className="text-xs font-bold text-red-600 mt-1">{fmt(summary?.todaySales)}</p>
              </div>

              <div onClick={() => window.location.href = "/hr"} className="bg-white text-slate-900 rounded-2xl p-4 shadow-lg flex flex-col items-center text-center cursor-pointer hover:bg-slate-50 transition border border-slate-200">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">الموظفين</h3>
                <p className="text-xs font-bold text-red-600 mt-1">شؤون العاملين</p>
              </div>

              <div onClick={() => window.location.href = "/expenses"} className="bg-white text-slate-900 rounded-2xl p-4 shadow-lg flex flex-col items-center text-center cursor-pointer hover:bg-slate-50 transition border border-slate-200">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">الصرفيات</h3>
                <p className="text-xs font-bold text-red-600 mt-1">المصروفات اليومية</p>
              </div>

              <div onClick={() => window.location.href = "/inventory"} className="bg-white text-slate-900 rounded-2xl p-4 shadow-lg flex flex-col items-center text-center cursor-pointer hover:bg-slate-50 transition border border-slate-200">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">أخرى (المخازن)</h3>
                <p className="text-xs font-bold text-red-600 mt-1">{summary?.totalProducts || 0} صنف</p>
              </div>

              <div onClick={() => window.location.href = "/units"} className="bg-white text-slate-900 rounded-2xl p-4 shadow-lg flex flex-col items-center text-center cursor-pointer hover:bg-slate-50 transition border border-slate-200">
                <div className="w-12 h-12 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <Ruler className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">مقاس جديد</h3>
                <p className="text-xs font-bold text-red-600 mt-1">الوحدات والقياسات</p>
              </div>

              <div onClick={() => window.location.href = "/warehouse-operations"} className="bg-white text-slate-900 rounded-2xl p-4 shadow-lg flex flex-col items-center text-center cursor-pointer hover:bg-slate-50 transition border border-slate-200">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <Wrench className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">تمثير ومقاسات</h3>
                <p className="text-xs font-bold text-red-600 mt-1">العمليات والتشغيل</p>
              </div>
            </div>

            <div className="absolute bottom-16 left-6">
              <Button onClick={() => window.location.href = "/pos"} className="w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl font-bold">
                <Plus className="w-8 h-8" />
              </Button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
              <a href="https://t.me" target="_blank" rel="noreferrer" className="hover:text-white transition"><Send className="w-4 h-4" /></a>
              <span className="font-mono text-[11px]">رقم الإصدار: 135.3.5</span>
              <a href="https://whatsapp.com" target="_blank" rel="noreferrer" className="hover:text-white transition text-emerald-400 font-bold">واتساب</a>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">لوحة القيادة</h1>
            <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <Button onClick={() => setIsMobileAppView(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold shadow">
            <Smartphone className="w-4 h-4" /> عرض واجهة تطبيق الهاتف
          </Button>
        </div>

        {/* System Initialization Card */}
        {!isInitialized && (
          <Card className="border-r-4 border-r-amber-500 bg-amber-50/20 shadow-sm border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
                تهيئة وتجهيز النظام للاستخدام لأول مرة
              </CardTitle>
              <CardDescription className="text-amber-700/80">
                يرجى تحديد مسمى النشاط والعملة الافتراضية المعتمدة للمبيعات والحسابات وسندات الصرف والقبض.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> اسم النشاط التجاري
                  </label>
                  <Input
                    value={initForm.businessName}
                    onChange={e => setInitForm(f => ({ ...f, businessName: e.target.value }))}
                    placeholder="مثال: مخابز الشام الحديثة"
                    className="bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">العملة الافتراضية للنظام</label>
                  <select
                    value={initForm.currency}
                    onChange={e => setInitForm(f => ({ ...f, currency: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="ريال سعودي">ريال سعودي (ر.س)</option>
                    <option value="ريال يمني">ريال يمني (ر.ي)</option>
                    <option value="دينار أردني">دينار أردني (د.أ)</option>
                    <option value="دولار أمريكي">دولار أمريكي ($)</option>
                    <option value="دينار كويتي">دينار كويتي (د.ك)</option>
                    <option value="درهم إماراتي">درهم إماراتي (د.إ)</option>
                    <option value="جنيه مصري">جنيه مصري (ج.م)</option>
                  </select>
                </div>

                <Button
                  onClick={handleInitialize}
                  disabled={!initForm.businessName}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  حفظ وإتمام تهيئة النظام
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today stats — row 1 */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">اليوم</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-r-4 border-r-primary">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0"><DollarSign className="w-5 h-5" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">المبيعات</p>
                  <p className="text-xl font-bold truncate">{fmt(summary?.todaySales)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-r-4 border-r-blue-500">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg shrink-0"><Receipt className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">الفواتير</p>
                  <p className="text-xl font-bold">{summary?.todayOrders}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-r-4 border-r-green-500">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-500/10 text-green-600 rounded-lg shrink-0"><TrendingUp className="w-5 h-5" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">الأرباح</p>
                  <p className="text-xl font-bold truncate">{fmt(summary?.todayProfit)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-r-4 border-r-amber-500">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg shrink-0"><ShoppingCart className="w-5 h-5" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">متوسط الفاتورة</p>
                  <p className="text-xl font-bold truncate">{fmt(avgOrderValue)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Month stats — row 2 */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">الشهر الحالي</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0"><DollarSign className="w-5 h-5" /></div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">المبيعات</p>
                  <p className="text-xl font-bold truncate">{fmt(summary?.monthSales)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg shrink-0"><Receipt className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">الفواتير</p>
                  <p className="text-xl font-bold">{summary?.monthOrders}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg shrink-0"><Package className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">المنتجات النشطة</p>
                  <p className="text-xl font-bold">{summary?.totalProducts}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 text-orange-600 rounded-lg shrink-0"><Users className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">العملاء</p>
                  <p className="text-xl font-bold">{summary?.totalCustomers}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">مبيعات اليوم بالساعة</CardTitle></CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesByHour || []} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tickFormatter={(v) => `${v}:00`} tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip labelFormatter={(v) => `الساعة ${v}:00`} formatter={(v: number) => [fmt(v), "المبيعات"]} />
                  <Line type="monotone" dataKey="total" name="المبيعات" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">أكثر المنتجات مبيعاً (الشهر)</CardTitle></CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(topProducts || []).slice(0, 8)} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="productName" width={95} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [v, "الكمية"]} />
                  <Bar dataKey="totalQty" name="الكمية" fill="#1e3a5f" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">طرق الدفع (الشهر)</CardTitle></CardHeader>
            <CardContent className="h-56">
              {paymentRows.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">لا توجد بيانات</div>
              ) : (
                <div className="flex items-center gap-4 h-full">
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie data={paymentRows} dataKey="total" nameKey="paymentMethod" cx="50%" cy="50%" outerRadius={70} innerRadius={30}>
                        {paymentRows.map((r: any, i: number) => <Cell key={i} fill={PAYMENT_COLORS[r.paymentMethod] ?? "#94a3b8"} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [fmt(v), "الإجمالي"]} labelFormatter={(v) => PAYMENT_LABELS[v] ?? v} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2 text-sm">
                    {paymentRows.map((r: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: PAYMENT_COLORS[r.paymentMethod] ?? "#94a3b8" }} />
                        <div>
                          <p className="font-medium leading-tight">{PAYMENT_LABELS[r.paymentMethod] ?? r.paymentMethod}</p>
                          <p className="text-xs text-muted-foreground">{r.orders} فاتورة — {fmt(r.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">المبيعات بالفئة (الشهر)</CardTitle></CardHeader>
            <CardContent className="h-56">
              {categoryRows.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">لا توجد بيانات</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryRows} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="categoryName" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v: number) => [fmt(v), "الإيراد"]} />
                    <Bar dataKey="totalRevenue" name="الإيراد" fill="#f59e0b" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
