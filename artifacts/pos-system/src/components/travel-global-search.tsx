import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plane, Ticket, Users, Globe, Building2, Luggage, ArrowLeft, Phone, Hash,
  Calculator, FileText, ShoppingCart, Package, DollarSign, Wallet, Database, BookOpen,
  Hotel, Settings, HelpCircle, Receipt, Briefcase, CheckCircle2, FolderOpen, ArrowRight,
  Sparkles, ShieldCheck, Tag
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SystemScreen {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  path: string;
  icon: any;
  keywords: string[];
}

const SYSTEM_SCREENS: SystemScreen[] = [
  {
    id: "pos",
    title: "نقطة البيع الكاشير (POS)",
    subtitle: "شاشة الكاشير والمبيعات السريعة وإصدار الفواتير الفورية وجبات الموظفين",
    category: "المبيعات والكاشير",
    path: "/pos",
    icon: ShoppingCart,
    keywords: ["كاشير", "نقطة بيع", "pos", "مبيعات", "وجبة", "وجبات", "فاتورة", "دفع", "سفري", "محلي", "توصيل"]
  },
  {
    id: "chart_of_accounts",
    title: "دليل وشجرة الحسابات",
    subtitle: "شجرة الحسابات الموحدة، الأصول، الخصوم، الإيرادات، المصروفات، حقوق الملكية",
    category: "المحاسبة والمالية",
    path: "/accounting",
    icon: Calculator,
    keywords: ["حسابات", "دليل", "شجرة", "أصول", "خصوم", "إيرادات", "مصروفات", "ملكية", "محاسبة", "مالية"]
  },
  {
    id: "account_statements",
    title: "كشوفات الحسابات ودفتر الاستاد العام",
    subtitle: "كشف حساب تفصيلي وتحليلي، دفتر الاستاد، ميزان المراجعة وقائمة الدخل",
    category: "المحاسبة والمالية",
    path: "/accounting",
    icon: FileText,
    keywords: ["كشف", "كشف حساب", "استاد", "دفتر", "ميزان", "مراجعة", "قائمة دخل", "ميزانية", "تحليلي", "إجمالي"]
  },
  {
    id: "vouchers",
    title: "سندات القبض والصرف والقيود اليومية",
    subtitle: "سندات اليومية، سندات الصرف والقبض، القيود المحاسبية والتسويات المالية",
    category: "المحاسبة والمالية",
    path: "/accounting",
    icon: Receipt,
    keywords: ["سند", "سندات", "قيد", "قيود", "صرف", "قبض", "تحديث", "تسوية", "يومية", "حوالة"]
  },
  {
    id: "customers",
    title: "إدارة العملاء والذمم المدينة (CRM)",
    subtitle: "دليل بطاقات العملاء، كشوف حسابات العملاء، حدود الائتمان، تحصيل الذمم",
    category: "العملاء والمبيعات",
    path: "/customers",
    icon: Users,
    keywords: ["عميل", "عملاء", "آجل", "ذمم", "كشف حساب عميل", "زبون", "زبائن", "بطاقة عميل"]
  },
  {
    id: "suppliers",
    title: "إدارة الموردين والمشتريات والذمم الدائنة",
    subtitle: "دليل بطاقات الموردين، فواتير الشراء، كشوفات حساب الموردين ومتابعة المستحقات",
    category: "المشتريات والموردين",
    path: "/suppliers",
    icon: Building2,
    keywords: ["مورد", "موردين", "شراء", "مشتريات", "كشف حساب مورد", "شركات", "مستحقات"]
  },
  {
    id: "inventory",
    title: "إدارة المخزون والمنتجات والأصناف",
    subtitle: "قائمة المنتجات والمواد، حركة الأصناف، تحويل المستودعات والجرد المخزني",
    category: "المخزون والمستودعات",
    path: "/inventory",
    icon: Package,
    keywords: ["مخزون", "أصناف", "منتج", "منتجات", "مواد", "جرد", "مستودع", "مستودعات", "تحويل", "كميات"]
  },
  {
    id: "hr",
    title: "الموارد البشرية وشؤون الموظفين (HR)",
    subtitle: "بيانات الموظفين، مسيرات الرواتب، السلف والقروض، الحضور والخصومات",
    category: "الموارد البشرية",
    path: "/hr",
    icon: Briefcase,
    keywords: ["موظف", "موظفين", "راتب", "رواتب", "سلفة", "سلف", "حضور", "خصم", "خصومات", "hr", "عمالة"]
  },
  {
    id: "expenses",
    title: "إدارة المصروفات والنفقات",
    subtitle: "تسجيل المصروفات التشغيلية والعمومية، متابعة النفقات وإيصالات الصرف",
    category: "المحاسبة والمالية",
    path: "/expenses",
    icon: DollarSign,
    keywords: ["مصروف", "مصروفات", "نفقات", "تشغيل", "صرف", "مصاريف"]
  },
  {
    id: "safes",
    title: "الخزائن والصناديق والبنوك",
    subtitle: "حركة الخزينة الرئيسية، الصناديق الفرعية، التسويات والتحويلات المالية",
    category: "المحاسبة والمالية",
    path: "/safes",
    icon: Wallet,
    keywords: ["خزينة", "خزن", "صندوق", "صناديق", "بنك", "بنوك", "تحويل مالي", "سيولة"]
  },
  {
    id: "onyx_erp",
    title: "شاشة Onyx ERP المتكاملة",
    subtitle: "لوحة القيادة الشاملة لمؤسسة أومني سيستم ERP والعمليات المتقدمة",
    category: "إدارة النظام",
    path: "/onyx-erp",
    icon: Database,
    keywords: ["onyx", "erp", "أونكس", "أومني", "لوحة قيادة", "إدارة شاملة"]
  },
  {
    id: "reports",
    title: "تقارير النظام والتحليلات المالية",
    subtitle: "تقارير المبيعات، الأرباح والخسائر، كشوف الحسابات والإحصائيات البيانية",
    category: "التقارير والإحصائيات",
    path: "/reports",
    icon: BookOpen,
    keywords: ["تقرير", "تقارير", "أرباح", "إحصائيات", "مبيعات", "تحليل", "مالية", "موجز"]
  },
  {
    id: "travel_bookings",
    title: "السفريات والسياحة - حجوزات الطيران",
    subtitle: "حجوزات الطيران، الـ PNR، التذاكر الصادرة، إعادة الإصدار والاسترجاع",
    category: "السفريات والسياحة",
    path: "/travel-bookings",
    icon: Plane,
    keywords: ["سفريات", "طيران", "تذكرة", "تذاكر", "pnr", "حجز", "حجوزات", "سياحة", "رحلات"]
  },
  {
    id: "travel_visas",
    title: "السفريات والسياحة - التأشيرات والجوازات",
    subtitle: "إصدار التأشيرات، متابعة طلبات السفارات وتأشيرات الدخول",
    category: "السفريات والسياحة",
    path: "/travel-visas",
    icon: Globe,
    keywords: ["تأشيرة", "تأشيرات", "فيزا", "جواز", "جوازات", "سفارة"]
  },
  {
    id: "travel_hotels",
    title: "السفريات والسياحة - الفنادق والإقامة",
    subtitle: "حجوزات الفنادق، قسائم الإقامة (Vouchers) وإدارة الفنادق والشركاء",
    category: "السفريات والسياحة",
    path: "/travel-hotels",
    icon: Hotel,
    keywords: ["فندق", "فنادق", "إقامة", "سكن", "حجز فندق"]
  },
  {
    id: "settings",
    title: "إدارة المستخدمين والصلاحيات والإعدادات",
    subtitle: "إعدادات المنشأة، الهوية، صلاحيات المستخدمين والشاشات، إعدادات الطباعة والطابعات",
    category: "إدارة النظام",
    path: "/settings",
    icon: Settings,
    keywords: ["إعدادات", "مستخدمين", "صلاحيات", "طابعة", "طابعات", "طباعة", "نظام", "مستخدم", "نسخ احتياطي"]
  },
  {
    id: "system_guide",
    title: "دليل استخدام النظام والدعم الفني",
    subtitle: "الشرح التفاعلي الشامل لكافة شاشات ووظائف النظام وكيفية الاستخدام",
    category: "إدارة النظام",
    path: "/system-guide",
    icon: HelpCircle,
    keywords: ["دليل", "شرح", "مساعدة", "استخدام", "تعليمات", "طريقة", "ارشادات"]
  }
];

type SearchTab = "all" | "screens" | "accounts" | "crm" | "hr" | "inventory" | "vouchers" | "travel";

export function TravelGlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [loading, setLoading] = useState(false);
  const [dbResults, setDbResults] = useState<any>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setDbResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("pos_token") || localStorage.getItem("pos_token") || "";
        const res = await fetch(`/api/system/global-search?q=${encodeURIComponent(query.trim())}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDbResults(data);
        }
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = (path: string) => {
    setLocation(path);
    onOpenChange(false);
  };

  // Filter static system screens & quick actions
  const matchingScreens = useMemo(() => {
    if (!query.trim()) return SYSTEM_SCREENS;
    const qLower = query.trim().toLowerCase();
    return SYSTEM_SCREENS.filter(s => {
      if (s.title.toLowerCase().includes(qLower)) return true;
      if (s.subtitle.toLowerCase().includes(qLower)) return true;
      if (s.category.toLowerCase().includes(qLower)) return true;
      return s.keywords.some(k => k.toLowerCase().includes(qLower));
    });
  }, [query]);

  const totalResultsCount =
    matchingScreens.length +
    (dbResults?.accounts?.length || 0) +
    (dbResults?.customers?.length || 0) +
    (dbResults?.suppliers?.length || 0) +
    (dbResults?.employees?.length || 0) +
    (dbResults?.products?.length || 0) +
    (dbResults?.vouchers?.length || 0) +
    (dbResults?.invoices?.length || 0) +
    (dbResults?.travel?.length || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-3xl p-0 overflow-hidden shadow-2xl border-slate-200">
        <DialogHeader className="p-4 pb-3 border-b bg-slate-900 text-white shrink-0">
          <DialogTitle className="text-base font-black flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-400" />
              <span>البحث الشامل والمساعد الذكي (Universal ERP Search)</span>
            </div>
            <kbd className="hidden sm:inline-block bg-white/10 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded border border-white/20">
              ESC للإغلاق
            </kbd>
          </DialogTitle>

          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن أي قسم، شاشة، حساب، عميل، مورد، موظف، صنف، سند، فاتورة..."
              className="pr-10 pl-16 h-11 text-sm bg-white text-slate-900 placeholder:text-slate-400 border-0 focus-visible:ring-2 focus-visible:ring-amber-400 shadow-inner font-semibold"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute left-3 top-3 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors"
              >
                مسح
              </button>
            )}
          </div>

          {/* Filter Categories Tabs Bar */}
          <div className="flex items-center gap-1 mt-3 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800">
            {[
              { id: "all", label: "الكل" },
              { id: "screens", label: "الشاشات والوظائف" },
              { id: "accounts", label: "الحسابات والدليل" },
              { id: "crm", label: "العملاء والموردين" },
              { id: "hr", label: "الموظفين" },
              { id: "inventory", label: "المخزون والأصناف" },
              { id: "vouchers", label: "السندات والفواتير" },
              { id: "travel", label: "السفريات" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SearchTab)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 border",
                  activeTab === tab.id
                    ? "bg-amber-400 text-slate-950 border-amber-400 shadow-xs font-black"
                    : "bg-white/5 text-slate-300 border-transparent hover:bg-white/10 hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {loading && (
            <div className="py-12 text-center text-xs font-bold text-slate-500 animate-pulse flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>جاري البحث الشامل في سجلات وقواعد بيانات النظام...</span>
            </div>
          )}

          {!loading && query.trim().length > 0 && totalResultsCount === 0 && (
            <div className="py-12 text-center text-slate-500">
              <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-800">لم يتم العثور على نتائج تطابق "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">تأكد من كتابة الاسم أو الرقم أو الكلمة بشكل صحيح</p>
            </div>
          )}

          {/* 1. System Screens & Quick Actions (الشاشات والوظائف) */}
          {(activeTab === "all" || activeTab === "screens") && matchingScreens.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                <span className="flex items-center gap-1.5 text-slate-800 font-black">
                  <FolderOpen className="w-4 h-4 text-indigo-600" />
                  <span>الشاشات والأقسام والوظائف المتاحة ({matchingScreens.length})</span>
                </span>
                {!query && <span className="text-[10px] text-slate-400 font-normal">اختصارات الوصول السريع</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchingScreens.slice(0, query ? 12 : 8).map((screen) => {
                  const Icon = screen.icon;
                  return (
                    <div
                      key={screen.id}
                      onClick={() => navigateTo(screen.path)}
                      className="p-2.5 bg-white hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 rounded-xl flex items-start justify-between cursor-pointer transition-all shadow-2xs group"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {screen.title}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                            {screen.subtitle}
                          </div>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-1.5 text-slate-500 bg-slate-50 border-slate-200">
                            {screen.category}
                          </Badge>
                        </div>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all shrink-0 mt-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Accounts (دليل الحسابات) */}
          {(activeTab === "all" || activeTab === "accounts") && dbResults?.accounts && dbResults.accounts.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <h3 className="text-xs font-black text-emerald-800 flex items-center gap-1.5 px-1">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>دليل الحسابات وشجرة الحسابات ({dbResults.accounts.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {dbResults.accounts.map((acc: any) => (
                  <div
                    key={acc.id}
                    onClick={() => navigateTo("/accounting")}
                    className="p-2.5 bg-emerald-50/60 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-2xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-black text-xs bg-emerald-700 text-white px-2 py-1 rounded-md shrink-0">
                        {acc.code}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-800 transition-colors">
                          {acc.name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          النوع: <span className="font-semibold text-emerald-700">{acc.type || "حساب"}</span>
                          {acc.balance !== undefined && (
                            <span className="me-3 ms-3 font-mono font-bold text-slate-800">
                              الرصيد: {Number(acc.balance || 0).toLocaleString()} ريال
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] gap-1 shrink-0">
                      <span>عرض كشف الحساب</span>
                      <ArrowLeft className="w-3 h-3" />
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Customers (العملاء) */}
          {(activeTab === "all" || activeTab === "crm") && dbResults?.customers && dbResults.customers.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <h3 className="text-xs font-black text-blue-800 flex items-center gap-1.5 px-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span>بطاقات وكشوفات حساب العملاء ({dbResults.customers.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {dbResults.customers.map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => navigateTo("/customers")}
                    className="p-2.5 bg-blue-50/60 hover:bg-blue-100/80 border border-blue-200/80 rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {c.name ? c.name.charAt(0) : "ع"}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-blue-800 transition-colors">
                          {c.name}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 font-mono">
                          {c.code && <span>الرمز: {c.code}</span>}
                          {c.phone && <span>هاتف: {c.phone}</span>}
                          {c.balance !== undefined && (
                            <span className="font-bold text-blue-900">
                              الرصيد: {Number(c.balance || 0).toLocaleString()} ريال
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-blue-600 text-white text-[10px] gap-1 shrink-0">
                      <span>بطاقة العميل</span>
                      <ArrowLeft className="w-3 h-3" />
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Suppliers (الموردين) */}
          {(activeTab === "all" || activeTab === "crm") && dbResults?.suppliers && dbResults.suppliers.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <h3 className="text-xs font-black text-purple-800 flex items-center gap-1.5 px-1">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>بطاقات وكشوفات حساب الموردين ({dbResults.suppliers.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {dbResults.suppliers.map((s: any) => (
                  <div
                    key={s.id}
                    onClick={() => navigateTo("/suppliers")}
                    className="p-2.5 bg-purple-50/60 hover:bg-purple-100/80 border border-purple-200/80 rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {s.name ? s.name.charAt(0) : "م"}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-purple-800 transition-colors">
                          {s.name} {s.company_name ? `(${s.company_name})` : ""}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 font-mono">
                          {s.code && <span>الرمز: {s.code}</span>}
                          {s.phone && <span>هاتف: {s.phone}</span>}
                          {s.balance !== undefined && (
                            <span className="font-bold text-purple-900">
                              الرصيد: {Number(s.balance || 0).toLocaleString()} ريال
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-purple-600 text-white text-[10px] gap-1 shrink-0">
                      <span>بطاقة المورد</span>
                      <ArrowLeft className="w-3 h-3" />
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Employees (الموظفين) */}
          {(activeTab === "all" || activeTab === "hr") && dbResults?.employees && dbResults.employees.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <h3 className="text-xs font-black text-amber-800 flex items-center gap-1.5 px-1">
                <Briefcase className="w-4 h-4 text-amber-600" />
                <span>سجلات وكشوفات حساب الموظفين ({dbResults.employees.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {dbResults.employees.map((e: any) => (
                  <div
                    key={e.id}
                    onClick={() => navigateTo("/hr")}
                    className="p-2.5 bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {e.name ? e.name.charAt(0) : "م"}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-amber-800 transition-colors">
                          {e.name}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 font-mono">
                          {e.employee_number && <span>رقم الموظف: {e.employee_number}</span>}
                          {e.job_title && <span>المسمى: {e.job_title}</span>}
                          {e.phone && <span>هاتف: {e.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-amber-600 text-white text-[10px] gap-1 shrink-0">
                      <span>ملف الموظف والرواتب</span>
                      <ArrowLeft className="w-3 h-3" />
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Products & Stock (المنتجات والأصناف) */}
          {(activeTab === "all" || activeTab === "inventory") && dbResults?.products && dbResults.products.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 px-1">
                <Package className="w-4 h-4 text-slate-700" />
                <span>المنتجات والأصناف المخزنية ({dbResults.products.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {dbResults.products.map((p: any) => (
                  <div
                    key={p.id}
                    onClick={() => navigateTo("/inventory")}
                    className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-2xs group"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-primary transition-colors">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                        <span>السعر: <strong className="text-emerald-700">{p.price} ريال</strong></span>
                        {p.stock !== undefined && (
                          <span className={cn("px-1.5 py-0.2 rounded text-[10px] font-bold", p.stock > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                            الرصيد: {p.stock}
                          </span>
                        )}
                        {p.barcode && <span>باركود: {p.barcode}</span>}
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:text-primary shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Vouchers & Journal Entries (السندات والقيود) */}
          {(activeTab === "all" || activeTab === "vouchers") && dbResults?.vouchers && dbResults.vouchers.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <h3 className="text-xs font-black text-indigo-800 flex items-center gap-1.5 px-1">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span>سندات القيد والقبض والصرف اليومية ({dbResults.vouchers.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {dbResults.vouchers.map((v: any) => (
                  <div
                    key={v.id}
                    onClick={() => navigateTo("/accounting")}
                    className="p-2.5 bg-indigo-50/60 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-2xs group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-indigo-900">سند رقم #{v.entry_number || v.id}</span>
                        {v.date && <span className="text-[10px] text-slate-500">({v.date})</span>}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                        البيان: {v.description || "بدون بيان"}
                      </div>
                    </div>
                    {v.amount !== undefined && (
                      <span className="font-mono font-bold text-xs text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                        {Number(v.amount).toLocaleString()} ريال
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Sales Invoices (الفواتير والمبيعات) */}
          {(activeTab === "all" || activeTab === "vouchers") && dbResults?.invoices && dbResults.invoices.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 px-1">
                <ShoppingCart className="w-4 h-4 text-slate-700" />
                <span>فواتير المبيعات ونقطة البيع ({dbResults.invoices.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {dbResults.invoices.map((inv: any) => (
                  <div
                    key={inv.id}
                    onClick={() => navigateTo("/reports")}
                    className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-2xs group"
                  >
                    <div>
                      <div className="font-mono font-bold text-xs text-slate-900">
                        فاتورة #{inv.invoice_number || inv.id}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        الدفع: {inv.payment_method === "cash" ? "نقداً" : inv.payment_method === "card" ? "شبكة" : "آجل/مخلوط"}
                      </div>
                    </div>
                    <span className="font-mono font-black text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {Number(inv.total || 0).toLocaleString()} ريال
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. Travel & Tourism (السفريات) */}
          {(activeTab === "all" || activeTab === "travel") && dbResults?.travel && dbResults.travel.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <h3 className="text-xs font-black text-sky-800 flex items-center gap-1.5 px-1">
                <Plane className="w-4 h-4 text-sky-600" />
                <span>سجلات وحجوزات السفريات والطيران ({dbResults.travel.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {dbResults.travel.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => navigateTo("/travel-bookings")}
                    className="p-2.5 bg-sky-50/60 hover:bg-sky-100/80 border border-sky-200/80 rounded-xl flex items-center justify-between cursor-pointer transition-colors shadow-2xs group"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        {t.customer_name || t.passenger_name || "حجز سفر"}
                        {t.destination && <span className="me-2 ms-2 text-[10px] text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded">✈️ {t.destination}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-0.5">
                        {t.pnr && <span>PNR: <strong className="text-sky-800">{t.pnr}</strong></span>}
                        {t.ticket_number && <span>تذكرة: {t.ticket_number}</span>}
                        {t.code && <span>رمز: {t.code}</span>}
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-sky-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
