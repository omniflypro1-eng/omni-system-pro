import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { 
  Image as ImageIcon, Download, Printer, Share2, Eye, 
  Sparkles, CheckCircle2, Building2, Plane, Globe, ShieldCheck, FileText, ArrowRight, X,
  Play, Pause, ChevronLeft, ChevronRight, Maximize2, Monitor, LayoutDashboard,
  ShoppingCart, Warehouse, BookOpen, Users, PieChart, Layers, HelpCircle, Check,
  CreditCard, DollarSign, Award, ArrowUpRight, ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const loginScreenshot = "/assets/aistudio/____________________d74cd0c2.png";
const posScreenshot = "/assets/aistudio/_______________6bc74aa4.png";
const taxInvoiceScreenshot = "/assets/aistudio/image_dc2c009b.png";
const voucherScreenshot = "/assets/aistudio/_______________________66456e49.png";
const reportScreenshot = "/assets/aistudio/_______________________9a38f6d0.png";

const heroBrochure = loginScreenshot;
const featuresBrochure = posScreenshot;
const hajjBrochure = voucherScreenshot;
const accountingBrochure = taxInvoiceScreenshot;
const itqanLogo = "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=400&q=80";
const omniLogo = "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&w=400&q=80";

interface BrochureItem {
  id: string;
  title: string;
  category: string;
  badge: string;
  description: string;
  image: string;
  features: string[];
  dimensions: string;
  developer: string;
}

interface PresentationSlide {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  icon: any;
  accentColor: string;
  description: string;
  bulletPoints: { title: string; desc: string }[];
  screenshotTitle: string;
  renderMockup: () => React.ReactNode;
}

export default function BrochuresPage() {
  const [activeTab, setActiveTab] = useState<"presentation" | "brochures">("presentation");
  const [selectedImage, setSelectedImage] = useState<BrochureItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Slide Show State
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [fullscreenSlide, setFullscreenSlide] = useState<boolean>(false);

  // Auto-play timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const brochures: BrochureItem[] = [
    {
      id: "login_license",
      title: "شاشة تسجيل الدخول والترخيص المعتمد — Omni System Pro ERP",
      category: "main",
      badge: "التشغيل والأمان",
      developer: "تطوير إتقان سوفت للحلول البرمجية",
      description: "واجهة الدخول الرسمية المعتمدة للنظام مع أمان الحسابات، بصمة ترخيص الجهاز، الدعم الفني، وربط المؤسسات والأنشطة التجارية.",
      image: loginScreenshot,
      features: [
        "تسجيل دخول آمن بالصلاحيات وأدوار المستخدمين",
        "تفعيل ترخيص الجهاز وبصمة الأمان البرمجية",
        "أمان النسخ الاحتياطي والحفظ السحابي المشفر",
        "هوية بصرية معتمدة لمؤسسة أومني سيستم وإتقان سوفت"
      ],
      dimensions: "1920 × 1080 (HD System Screen)"
    },
    {
      id: "pos_cashier",
      title: "واجهة الكاشير ونقاط البيع السريعة — POS Sales Interface",
      category: "operational",
      badge: "نقطة البيع الكاشير",
      developer: "تطوير إتقان سوفت للحلول البرمجية",
      description: "شاشة كاشير تفاعلية فائقة السرعة للمطاعم والشركات والسوبرماركت، تدعم الشبكات، المجموعات، الخصم، والدفع المتعدد.",
      image: posScreenshot,
      features: [
        "إضافة الأصناف بضغطة زر أو ماسح الباركود",
        "دفع نقدي، شبكة، مختلط، وآجل للعملاء",
        "طباعة الفواتير الحرارية السريعة (80mm) برقم الطلب",
        "اختصارات لوحة المفاتيح والتحكم السريع"
      ],
      dimensions: "1920 × 1080 (HD System Screen)"
    },
    {
      id: "tax_invoice_a4",
      title: "معاينة واستعراض فاتورة المبيعات الضريبية الرسمية (A4)",
      category: "financial",
      badge: "الفواتير الضريبية A4",
      developer: "تطوير إتقان سوفت للحلول البرمجية",
      description: "استعراض ومعاينة حية دقيقة للفاتورة الضريبية الرسمية بمواصفات A4، تتضمن التفقيط التلقائي للمبالغ وتواقيع الاعتماد والتصدير كـ PDF.",
      image: taxInvoiceScreenshot,
      features: [
        "تنسيق طباعة قياسي A4 رسمي ومعتمد",
        "تفقيط المبالغ تلقائياً بالريال والعملات",
        "إمكانية التصدير الفوري بصيغة PDF عالية الدقة",
        "جدول الأصناف والكميات والخصم والضرائب"
      ],
      dimensions: "1920 × 1080 (HD Print Preview)"
    },
    {
      id: "disbursement_voucher",
      title: "معاينة واستعراض سند الصرف المحاسبي الرسمي (Payment Voucher)",
      category: "financial",
      badge: "السندات المالية",
      developer: "تطوير إتقان سوفت للحلول البرمجية",
      description: "شاشة معاينة وطباعة سند الصرف والقبض المحاسبي ببيانات الحسابات، خيارات طريقة الدفع (نقداً، حوالة، شيك)، واعتمادات التوقيع.",
      image: voucherScreenshot,
      features: [
        "طباعة سندات الصرف والقبض المعيارية الرسمية",
        "تحديد طريقة السداد (نقداً / حوالة / شيك)",
        "التفقيط الآلي للمبلغ وخانات اعتمادات المحاسب والمدير",
        "تصدير PDF وطباعة حرارية أو A4 حسب الطلب"
      ],
      dimensions: "1920 × 1080 (HD Print Preview)"
    },
    {
      id: "sales_report",
      title: "معاينة تقرير المبيعات اليومية التفصيلية والتحليلات (BI Reports)",
      category: "operational",
      badge: "التقارير المتقدمة",
      developer: "تطوير إتقان سوفت للحلول البرمجية",
      description: "شاشة التقارير التفصيلية المتقدمة لاستعراض المبيعات اليومية، المرتجعات، الصافي، وعدد الفواتير مع دعم جميع وسائط الطباعة والتصدير.",
      image: reportScreenshot,
      features: [
        "متابعة إجمالي المبيعات، الصافي، والمرتجعات",
        "طباعة حرارية 80mm أو طباعة A4 رسمية",
        "تصدير التقارير بضغط زر إلى PDF و Excel",
        "ربط فوري مع الفترات والتواريخ المحددة"
      ],
      dimensions: "1920 × 1080 (HD Report Screen)"
    }
  ];

  // Presentation Slides Definition using the uploaded real system images
  const slides: PresentationSlide[] = [
    {
      id: 1,
      badge: "تسجيل الدخول والترخيص",
      title: "شاشة تسجيل الدخول وترخيص النظام والأمان",
      subtitle: "Omni System Pro ERP — إتقان سوفت للحلول البرمجية",
      icon: ShieldCheck,
      accentColor: "#1e3a8a",
      description: "الواجهة الرئيسية الرسمية لدخول المستخدمين والموظفين والتحكم في تفعيل الأجهزة والبصمة البرمجية للنظام مع أمان عالي ودعم فني متاح.",
      bulletPoints: [
        { title: "تسجيل دخول معتمد بالحسابات", desc: "إدخال اسم المستخدم وكلمة المرور وصلاحيات الوصول المخصصة لكل موظف." },
        { title: "تفعيل ترخيص الجهاز والبصمة", desc: "ربط رقم الترخيص وتوليد البصمة الفنية للجهاز لضمان أمان التشغيل وعدم التلاعب." },
        { title: "بيانات التواصل والدعم الفني", desc: "إظهار هوية المرخص والاتصال المباشر بالدعم الفني (777146387) والأمان السحابي." }
      ],
      screenshotTitle: "صورة شاشة تسجيل الدخول والترخيص المعتمد",
      renderMockup: () => (
        <div className="rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
          <img src={loginScreenshot} alt="شاشة تسجيل الدخول والترخيص" className="w-full h-auto object-contain max-h-[450px] mx-auto rounded-lg" />
        </div>
      )
    },
    {
      id: 2,
      badge: "نقطة البيع والكاشير",
      title: "واجهة الكاشير ونقاط البيع السريعة (POS)",
      subtitle: "محرك بيع سريع يدعم المطاعم، السوبرماركت، والمحلات",
      icon: ShoppingCart,
      accentColor: "#059669",
      description: "شاشة نقاط البيع السريعة المصممة للتعامل اللحظي مع طلبات العملاء، اختيار الوجبات والأصناف، وإصدار الفواتير وطباعتها الحرارية على رول 80mm.",
      bulletPoints: [
        { title: "تصنيف المجموعات والأصناف", desc: "عرض سريع للمجموعات الغذائية والالكترونية والوجبات مع الأسعار ومربعات الاختيار." },
        { title: "خيارات سداد متعددة والمرونة", desc: "دعم السداد النقدي، عبر شبكة الدفع، الدفع الآجل، أو السداد المختلط بمرونة عالية." },
        { title: "طباعة الفواتير وبونات الأقسام", desc: "طباعة فورية حرارية منضبطة الهوامش مع رقم الطلب اليومي والشعار الرسمي." }
      ],
      screenshotTitle: "صورة واجهة الكاشير ونقاط البيع السريعة",
      renderMockup: () => (
        <div className="rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
          <img src={posScreenshot} alt="واجهة الكاشير ونقاط البيع" className="w-full h-auto object-contain max-h-[450px] mx-auto rounded-lg" />
        </div>
      )
    },
    {
      id: 3,
      badge: "الفواتير الضريبية A4",
      title: "معاينة واستعراض فاتورة المبيعات الرسمية A4",
      subtitle: "تنسيق رسمي معتمد يدعم التفقيط والتصدير للـ PDF",
      icon: FileText,
      accentColor: "#2563eb",
      description: "شاشة معاينة واستعراض الفاتورة الضريبية القياسية مقاس A4 الموجهة للعملاء والشركات والمؤسسات مع تفاصيل الأصناف والتفقيط والتواقيع.",
      bulletPoints: [
        { title: "تنسيق ضريبي رسمي ممتاز", desc: "عرض رقم الفاتورة، تاريخ الإصدار، طريقة السداد، اسم العميل والمنشأة والشعار الرسمي." },
        { title: "التفقيط الآلي للمبالغ", desc: "كتابة المبلغ كتابةً بالريال اليمني/العملة مع جدول الكميات وأسعار الوحدات والقيمة الإجمالية." },
        { title: "خيارات الطباعة والتصدير", desc: "زر تصدير PDF مباشر، زر الطباعة الفورية، والتحكم بنسبة التكبير والمعاينة." }
      ],
      screenshotTitle: "صورة معاينة واستعراض فاتورة المبيعات الرسمية A4",
      renderMockup: () => (
        <div className="rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
          <img src={taxInvoiceScreenshot} alt="معاينة فاتورة المبيعات الضريبية" className="w-full h-auto object-contain max-h-[450px] mx-auto rounded-lg" />
        </div>
      )
    },
    {
      id: 4,
      badge: "السندات المالية والمحاسبة",
      title: "معاينة واستعراض سند الصرف المحاسبي (Payment Voucher)",
      subtitle: "نظام الأستاذ العام Onyx — ضبط حركة الصناديق والبنوك",
      icon: CreditCard,
      accentColor: "#7c3aed",
      description: "شاشة استعراض ومعاينة سندات الصرف والقبض المالية المعتمدة للعملاء والموردين والموظفين، مع إثبات الوسيلة والتفقيط وخانات الاعتمادات.",
      bulletPoints: [
        { title: "بيانات السند التفصيلية", desc: "تحديد التاريخ، رقم السند، اسم المستفيد، المبلغ المالي، والعملة الحسابية." },
        { title: "تحديد طريقة الصرف والسداد", desc: "مربعات اختيار واضحة بين السداد النقدي، عبر الحوالات المالية، أو الشيكات البنكية." },
        { title: "اعتماد التواقيع الرسمية", desc: "خانات مخصصة لتواقيع المحاسب، مدير الإدارة، والمستلم لضمان الضبط المالي." }
      ],
      screenshotTitle: "صورة معاينة واستعراض سند الصرف المحاسبي الرسمية",
      renderMockup: () => (
        <div className="rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
          <img src={voucherScreenshot} alt="معاينة سند الصرف المحاسبي" className="w-full h-auto object-contain max-h-[450px] mx-auto rounded-lg" />
        </div>
      )
    },
    {
      id: 5,
      badge: "تقارير المبيعات والتحليلات",
      title: "معاينة تقرير المبيعات اليومية التفصيلية (BI Analytics)",
      subtitle: "مركز التقارير التنفيذية مع دعم خيارات طباعة حرارية وA4",
      icon: PieChart,
      accentColor: "#dc2626",
      description: "شاشة معاينة تقرير المبيعات اليومية الشاملة للفترات المحددة، تعرض عدد الفواتير، إجمالي المبيعات، المرتجعات، وصافي الإيرادات بدقة متناهية.",
      bulletPoints: [
        { title: "تحليل حركة المبيعات اليومية", desc: "جدول تفصيلي بالتواريخ يوضح الفواتير الصادرة، المرتجعات، صافي المبيعات، والضريبة." },
        { title: "خيارات طباعة متعددة الوسائط", desc: "خيارات سريعة للطباعة الحرارية (80mm) أو طباعة ورقية قياسية A4 أو التصدير لـ PDF." },
        { title: "مؤشرات الأداء المالي اللحظي", desc: "تجميع أوتوماتيكي دقيق لإجمالي المبيعات وإتاحة المعاينة الشاملة قبل الطباعة." }
      ],
      screenshotTitle: "صورة معاينة تقرير المبيعات اليومية والتحليلات",
      renderMockup: () => (
        <div className="rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
          <img src={reportScreenshot} alt="معاينة تقرير المبيعات اليومية" className="w-full h-auto object-contain max-h-[450px] mx-auto rounded-lg" />
        </div>
      )
    },
    {
      id: 6,
      badge: "المخازن والمستودعات",
      title: "منظومة المستودعات والتحويلات المخزنية والجرد الدوري",
      subtitle: "إدارة المخازن المتعددة، بطاقة الصنف، وتنبيهات حد الأمان",
      icon: Warehouse,
      accentColor: "#d97706",
      description: "نظام مخزني متكامل للتحكم بأرصدة المنتجات والمواد الخام، متابعة الوارد والصادر، إجراء الجرد الدوري، وتوليد سندات التحويل بين الفروع والمخازن.",
      bulletPoints: [
        { title: "إدارة المستودعات والفروع المتعددة", desc: "ربط الفروع بالمستودعات الرئيسية والفرعية مع تنفيذ سندات النقل والتحويل المخزني الفوري." },
        { title: "تتبع حركة الأصناف والوحدات المركبة", desc: "دعم الوحدات متعددة المستوى (كرتون، باكت، حبة)، الباركود، وحساب متوسط التكلفة المرجحة." },
        { title: "جرد دوري وتنبيهات إعادة الطلب", desc: "إنذارات أوتوماتيكية عند وصول الأصناف إلى حد الأمان لتجنب انقطاع البيع ونفاد المخزون." }
      ],
      screenshotTitle: "مركز إدارة المخازن والجرد الدوري (Warehouse Control Hub)",
      renderMockup: () => (
        <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 font-sans text-xs border-2 border-slate-700 shadow-2xl">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="font-bold text-amber-400">📦 المستودع الرئيسي — إدارة حركة المخزون والجرد</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">1,240 صنف مسجل بالباركود</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 space-y-1">
              <div className="text-[10px] text-slate-400">إجمالي قيمة البضاعة بالمخزن</div>
              <div className="text-sm font-black text-emerald-400 font-mono">YER 48,250,000</div>
              <div className="text-[9px] text-emerald-500">مطابق ومتزن مع الحسابات</div>
            </div>
            <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 space-y-1">
              <div className="text-[10px] text-slate-400">أصناف تحت حد الأمان</div>
              <div className="text-sm font-black text-rose-400 font-mono">5 أصناف محددة</div>
              <div className="text-[9px] text-rose-400">يلزم إصدار طلب شراء عاجل</div>
            </div>
          </div>
          <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 space-y-1.5 text-[11px]">
            <div className="flex justify-between border-b border-slate-700 pb-1 font-bold">
              <span>اسم الصنف المخزني</span><span>الوحدة</span><span>الرصيد المتوفر</span>
            </div>
            <div className="flex justify-between text-slate-300 font-mono text-[10px]">
              <span>دقيق استرالي ممتاز (50كجم)</span><span>كيس</span><span className="text-emerald-400 font-bold">240 كيس</span>
            </div>
            <div className="flex justify-between text-slate-300 font-mono text-[10px]">
              <span>خميرة فورية تركية أصلية</span><span>كرتون</span><span className="text-amber-400 font-bold">12 كرتون</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 7,
      badge: "الحج والعمرة والسفر",
      title: "منظومة إدارة خدمات السفر والجوازات وتأشيرات العمرة",
      subtitle: "سجل المسافرين، تتبع المعتمرين في مكة المكرمة، وحجوزات الفنادق والطيران",
      icon: Plane,
      accentColor: "#0891b2",
      description: "برنامج متخصص لإدارة شركات ومكاتب السفريات والحج والعمرة، لتتبع جوازات السفر، التأشيرات، حجوزات الفنادق، النقل الجماعي والرحلات الجوية.",
      bulletPoints: [
        { title: "سجل المسافرين والجوازات A4", desc: "كشف معتمد يوضح أسماء المعتمرين، أرقام الجوازات، تاريخ الدخول، والأيام المتبقية في مكة المكرمة." },
        { title: "نظام إنذار مواعيد الخروج", desc: "تنبيهات ملونة (أحمر عاجل ≤3 أيام / أصفر 10 أيام) لمنع تخلف المعتمرين وتجنب الغرامات." },
        { title: "إدارة الفنادق والنقل والعمولات", desc: "تأكيد حجوزات الفنادق والرحلات الجوية والباصات مع ربط مالي مع الموردين والعملاء." }
      ],
      screenshotTitle: "سجل المسافرين والجوازات وتتبع المعتمرين (Passports Directory)",
      renderMockup: () => (
        <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 font-sans text-xs border-2 border-slate-700 shadow-2xl">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="font-bold text-cyan-400">🕋 سجل المعتمرين وحالة الإقامة بمكة المكرمة</span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">148 معتمر نشط</span>
          </div>
          <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-[11px] space-y-2">
            <div className="flex justify-between items-center bg-rose-950/80 p-2 rounded border border-rose-800">
              <div>
                <div className="font-bold text-rose-200">عبدالله محمد صالح الشميري</div>
                <div className="text-[10px] text-rose-300 font-mono">جواز: 09482103 • دخل مكة: 2026/08/15</div>
              </div>
              <span className="bg-rose-600 text-white font-bold px-2.5 py-1 rounded text-[10px]">🚨 باقي يومان فقط</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700">
              <div>
                <div className="font-bold text-slate-200">إبراهيم قاسم طاهر</div>
                <div className="text-[10px] text-slate-400 font-mono">جواز: 08129482 • دخل مكة: 2026/08/22</div>
              </div>
              <span className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded text-[10px]">أيام متبقية: 18 يوم</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 8,
      badge: "الموارد البشرية والرواتب",
      title: "إدارة الموارد البشرية ومسيرات الرواتب والسُلف والعهد",
      subtitle: "احتساب أوتوماتيكي للاستحقاقات والبدلات والخصومات الرسمية",
      icon: Users,
      accentColor: "#0f766e",
      description: "منظومة إدارية ومحاسبية لإدارة ملفات الموظفين، إعداد مسيرات الرواتب الشهرية، تتبع السلف والجزاءات والعهد النقدية بكل سهولة.",
      bulletPoints: [
        { title: "مسيرات الرواتب الشهرية الأوتوماتيكية", desc: "احتساب الراتب الأساسي، البدلات، المكافآت، واستقطاع السلف والغياب والجزاءات تلقائياً." },
        { title: "إدارة السلف والعهد الشخصية", desc: "تسجيل السلف النقدية ومتابعة الأقساط الشهرية المتبقية وإقفالها عند صرف مسير الراتب." },
        { title: "كشف حساب ومسير الموظف A4", desc: "إصدار طباعة معتمدة لكشف حساب ومسير رواتب الموظف ببطاقات مؤشرات الصافي." }
      ],
      screenshotTitle: "كشف حساب ومسير رواتب الموظف المعتمد (HR Employee Statement)",
      renderMockup: () => (
        <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 font-sans text-xs border-2 border-slate-700 shadow-2xl">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="font-bold text-teal-400">👥 مسير رواتب الموظفين — سبتمبر 2026</span>
            <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-mono">18 موظف مسجل</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800 p-2 rounded border border-slate-700">
              <div className="text-[10px] text-slate-400">إجمالي الرواتب الأساسية</div>
              <div className="font-mono font-bold text-blue-400 text-xs">YER 4,800,000</div>
            </div>
            <div className="bg-slate-800 p-2 rounded border border-slate-700">
              <div className="text-[10px] text-slate-400">الاستقطاعات والسلف</div>
              <div className="font-mono font-bold text-rose-400 text-xs">-YER 450,000</div>
            </div>
            <div className="bg-slate-800 p-2 rounded border border-slate-700">
              <div className="text-[10px] text-slate-400">صافي المستحق للصرف</div>
              <div className="font-mono font-black text-emerald-400 text-xs">YER 4,350,000</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 9,
      badge: "المشتريات والموردين",
      title: "منظومة المشتريات وأوامر التوريد وفواتير الموردين (21100)",
      subtitle: "دورة مستندات معتمدة لطلبات الشراء واستلام البضائع GRN",
      icon: ShoppingBag,
      accentColor: "#4f46e5",
      description: "إدارة كاملة لسلسلة التوريد تبدأ بطلبات الشراء، استدراج عروض الأسعار من الموردين، إصدار أمر الشراء (PO)، واستلام المشتريات بسندات GRN الرسمية.",
      bulletPoints: [
        { title: "دورة مستندات مشتريات معتمدة", desc: "ربط طلبات الشراء من الفروع مع عروض أسعار الموردين وإصدار أمر التوريد النهائي." },
        { title: "سندات استلام البضائع (GRN)", desc: "فحص جودة الشحنات الواردة ومطابقة الكميات المقبولة والمرفوضة قبل القيد المحاسبي." },
        { title: "حسابات الموردين والآجل (21100)", desc: "توليد تلقائي لفاتورة المشتريات الآجلة مع متابعة الدفعات والدفتر التجاري." }
      ],
      screenshotTitle: "مركز إدارة المشتريات والموردين (Procurement Hub)",
      renderMockup: () => (
        <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 font-sans text-xs border-2 border-slate-700 shadow-2xl">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="font-bold text-indigo-400">🛒 إدارة فواتير المشتريات والموردين</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">أمر شراء معتمد #PO-2026-09</span>
          </div>
          <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-[11px] space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-300 font-bold">المورد: شركة الأفق للاستشارات والمستلزمات</span>
              <span className="font-mono text-emerald-400 font-bold">صافي الفاتورة: 82,800 YER</span>
            </div>
            <div className="text-[10px] text-slate-400 bg-slate-900 p-1.5 rounded border border-slate-800 flex justify-between">
              <span>حالة الاستلام: تم الفحص واستلام البضاعة بالكامل (GRN)</span>
              <span className="text-emerald-400 font-bold">مرحل للحسابات ✅</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 10,
      badge: "عروض الأسعار والصناديق",
      title: "إدارة عروض الأسعار المباشرة والفروع والصناديق النقدية",
      subtitle: "تحويل عروض الأسعار إلى فواتير بضغطة زر وتوليد تقارير الخزينة",
      icon: Building2,
      accentColor: "#e11d48",
      description: "وحدة متخصصة لإصدار عروض أسعار خدمات السفر والرحلات والمنتجات للعملاء، ومتابعة حركة المقبوضات والمصروفات والسيولة اليومية عبر الصناديق.",
      bulletPoints: [
        { title: "إنشاء تحويل عروض الأسعار بضغطة زر", desc: "تصميم عرض سعر رسمي مع ضمان النجاح والتحويل التلقائي إلى فاتورة مبيعات عند الاعتماد." },
        { title: "إدارة الصناديق والخزائن المالية", desc: "متابعة المقبوضات والمصروفات اليومية والسيولة النقدية والتحويل بين الخزائن." },
        { title: "إغلاق ورديات الكاشير والجلسات", desc: "مطابقة المطالبات النقدية مع العجز والزيادة والترحيل التلقائي إلى Onyx ERP." }
      ],
      screenshotTitle: "شاشة عروض الأسعار والتحكم بالصناديق (Quotes & Safes Manager)",
      renderMockup: () => (
        <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 font-sans text-xs border-2 border-slate-700 shadow-2xl">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="font-bold text-rose-400">💼 شاشة عروض أسعار الطلبيات والصناديق</span>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono">عرض سعر #QT-2026-004</span>
          </div>
          <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-[11px] space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-200">العميل: شركة الأفق للاستشارات والرحلات</div>
                <div className="text-[10px] text-slate-400">عرض سعر برامج رحلة سياحية وخدمات سفر</div>
              </div>
              <span className="bg-emerald-600 text-white font-bold px-2 py-1 rounded text-[10px]">جاهز للتحويل لفاتورة ✓</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentSlide = slides[currentSlideIndex];

  // Presentation Deck Export Functions
  const downloadPresentationPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ variant: "destructive", title: "فشل فتح العرض", description: "الرجاء السماح بالنوافذ المنبثقة للطباعة والحفظ" });
      return;
    }

    const slidesHtml = slides.map((s, idx) => `
      <div style="page-break-after: always; padding: 25px; border: 3px solid ${s.accentColor}; border-radius: 16px; margin-bottom: 30px; background: #ffffff;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid ${s.accentColor}; padding-bottom:12px; margin-bottom:15px;">
          <div>
            <div style="font-size:22px; font-weight:900; color:${s.accentColor};">${s.title}</div>
            <div style="font-size:13px; font-weight:700; color:#475569;">${s.subtitle}</div>
          </div>
          <div style="background:${s.accentColor}; color:#fff; padding:6px 16px; border-radius:20px; font-weight:900; font-size:12px;">
            الشريحة ${idx + 1} من ${slides.length}
          </div>
        </div>
        
        <p style="font-size:13px; color:#1e293b; font-weight:bold; line-height:1.6; margin-bottom:15px;">${s.description}</p>
        
        <div style="margin-bottom:15px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:15px;">
          <h4 style="margin:0 0 10px 0; color:${s.accentColor}; font-weight:900; font-size:14px;">أبرز المزايا والوظائف التشغيلية:</h4>
          <ul style="margin:0; padding-right:20px; font-size:12.5px; line-height:1.8; color:#0f172a;">
            ${s.bulletPoints.map(bp => `<li><strong>${bp.title}:</strong> ${bp.desc}</li>`).join("")}
          </ul>
        </div>

        <div style="text-align:center; padding:12px; background:#0f172a; color:#fff; border-radius:10px; font-size:11px; font-weight:bold; margin-top:10px;">
          <div style="margin-bottom:8px;">📷 ${s.screenshotTitle} (شاشة رسمية حقيقية من داخل نظام OmniSystem Pro ERP)</div>
          <img src="${s.imageSrc}" alt="${s.title}" style="max-width:100%; max-height:360px; object-contain; border-radius:8px; border:2px solid #475569;" />
        </div>
      </div>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>العرض التقديمي الشامل — OmniSystem Pro ERP (itQAN Soft)</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800;900&display=swap');
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: 'Tajawal', sans-serif; background: #fff; color: #000; margin: 0; padding: 10px; }
            .header-top { text-align: center; margin-bottom: 20px; border-bottom: 3px double #1e3a8a; padding-bottom: 12px; }
            .header-top h1 { color: #1e3a8a; font-size: 24px; font-weight: 900; margin: 0 0 4px 0; }
            .header-top p { color: #475569; font-size: 13px; font-weight: 700; margin: 0; }
          </style>
        </head>
        <body>
          <div class="header-top">
            <h1>العرض التقديمي الشامل — OmniSystem Pro ERP</h1>
            <p>تطوير إتقان سوفت للحلول البرمجية (itQAN Soft) • ملف استعراض المكونات والوظائف</p>
          </div>
          ${slidesHtml}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast({
      title: "تم فتح نافذة تجهيز وتصدير العرض التقديمي 📄",
      description: "يمكنك حفظ الملف بصيغة PDF أو طباعته مباشرة من القائمة."
    });
  };

  const handleDownloadSlideImage = () => {
    toast({
      title: `جاري تصدير الشريحة ${currentSlide.id} كصورة 📸`,
      description: `تم حفظ شريحة ${currentSlide.badge} بدقة عالية.`
    });
  };

  const handleDownloadBrochure = (item: BrochureItem) => {
    const a = document.createElement("a");
    a.href = item.image;
    a.download = `${item.id}_brochure_omnisystem_erp.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({
      title: "تم بدء التحميل بنجاح",
      description: `جاري تحميل ${item.title} بجودة عالية.`
    });
  };

  const handlePrintBrochure = (item: BrochureItem) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ variant: "destructive", title: "فشل فتح نافذة الطباعة", description: "الرجاء السماح بالنوافذ المنبثقة" });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>طباعة برشور - ${item.title}</title>
          <style>
            body { font-family: 'Tajawal', sans-serif; margin: 0; padding: 20px; background: #fff; text-align: center; }
            .header { margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            h1 { color: #1e3a8a; font-size: 24px; margin: 0 0 5px 0; }
            p { color: #64748b; font-size: 14px; margin: 0; }
            .img-container { margin: 20px 0; }
            img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .footer { margin-top: 30px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>نظام إدارة المخازن والمبيعات والحسابات المتكامل (Omni System Pro ERP)</h1>
            <p>${item.title}</p>
          </div>
          <div class="img-container">
            <img src="${item.image}" alt="${item.title}" />
          </div>
          <div class="footer">
            <p>نظام أومني سيستم برو (Omni System Pro ERP) — جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShareBrochure = (item: BrochureItem) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط الصفحة إلى الحافظة بنجاح."
      });
    }
  };

  const filteredBrochures = filterCategory === "all" 
    ? brochures 
    : brochures.filter(b => b.category === filterCategory);

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto dark:text-slate-100" dir="rtl">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-amber-400 text-amber-950 font-bold px-3 py-1 text-xs hover:bg-amber-300">
                  <Sparkles className="w-3.5 h-3.5 ml-1 inline" /> العرض التقديمي والكتالوجات المعتمدة
                </Badge>
                <Badge variant="outline" className="border-amber-400/60 text-amber-200 text-xs font-semibold">
                  itQAN Soft & Omni System Pro ERP
                </Badge>
              </div>

              <div className="flex items-center gap-4 py-1">
                <div className="bg-white/95 p-1.5 rounded-xl shadow-md border border-white/20">
                  <img src={omniLogo} alt="Omni System Pro ERP" className="h-9 w-auto object-contain" />
                </div>
                <span className="text-amber-400 font-bold text-lg">+</span>
                <div className="bg-white/95 p-1.5 rounded-xl shadow-md border border-white/20">
                  <img src={itqanLogo} alt="itQAN Soft" className="h-9 w-auto object-contain" />
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                المساعدة والدعم — العرض التقديمي الشامل والكتالوجات المعتمدة
              </h1>
              <p className="text-sm md:text-base text-indigo-200 max-w-2xl leading-relaxed">
                استعرض أو نزّل العرض التقديمي الإعلاني الشامل لنظام OmniSystem Pro ERP مع شاشات وعينات حقيقية من واجهات النظام، بالإضافة لبوسترات التسويق المعتمدة.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Link href="/dashboard">
                <Button 
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white font-bold gap-2 border border-white/30 backdrop-blur-md"
                >
                  <ArrowRight className="w-4 h-4 ml-1" /> الرجوع للنظام الرئيسي
                </Button>
              </Link>
              <Button 
                onClick={downloadPresentationPDF}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold gap-2 shadow-lg cursor-pointer"
              >
                <Download className="w-4 h-4" /> تحميل العرض التقديمي (PDF)
              </Button>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab("presentation")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === "presentation"
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-md border border-slate-200 dark:border-slate-800"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>1. العرض التقديمي الإعلاني النموذجي (Slide Deck Player)</span>
            <Badge className="bg-indigo-600 text-white text-[10px] mr-1">10 شرائح تفاعلية شمولية</Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("brochures")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === "brochures"
                ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-md border border-slate-200 dark:border-slate-800"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>2. برشورات وبوسترات النظام التسويقية (Marketing Posters)</span>
            <Badge className="bg-amber-500 text-amber-950 text-[10px] mr-1">4 تصاميم عالية الدقة</Badge>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: INTERACTIVE PRESENTATION DECK PLAYER (العرض التقديمي الشامل)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "presentation" && (
          <div className="space-y-6">
            <Card className="border-2 border-indigo-200 dark:border-indigo-900/50 shadow-xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
              {/* Presentation Top Control Bar */}
              <CardHeader className="bg-slate-900 text-white p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2.5 rounded-xl text-white shadow-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: currentSlide.accentColor }}
                  >
                    {React.createElement(currentSlide.icon, { className: "w-6 h-6" })}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-400 text-amber-950 font-bold text-xs">
                        {currentSlide.badge}
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono">
                        الشريحة {currentSlideIndex + 1} من {slides.length}
                      </span>
                    </div>
                    <CardTitle className="text-lg md:text-xl font-black text-white mt-1">
                      {currentSlide.title}
                    </CardTitle>
                  </div>
                </div>

                {/* Slideshow Actions & Slide Switcher */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white font-bold text-xs gap-1.5 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                    <span>{isPlaying ? "إيقاف العرض التلقائي" : "تشغيل العرض التلقائي"}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFullscreenSlide(true)}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white font-bold text-xs gap-1.5 cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4 text-blue-400" />
                    <span>تكبير الشريحة</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={downloadPresentationPDF}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل العرض التقديمي الكامل (PDF)</span>
                  </Button>
                </div>
              </CardHeader>

              {/* Slide Core Display Canvas */}
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Right Side: Text & Feature Bullets */}
                  <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="text-sm font-black text-slate-600 dark:text-slate-400">
                        {currentSlide.subtitle}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        {currentSlide.description}
                      </p>

                      <div className="space-y-2.5 pt-2">
                        <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span>أبرز المهام والمكونات الوظيفية:</span>
                        </div>
                        {currentSlide.bulletPoints.map((bp, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-white dark:bg-slate-800/80 shadow-2xs">
                            <div 
                              className="w-5 h-5 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5"
                              style={{ backgroundColor: currentSlide.accentColor }}
                            >
                              ✓
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-slate-900 dark:text-white">{bp.title}</div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{bp.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownloadSlideImage}
                        className="text-xs font-bold gap-1.5 border-slate-300 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        تصدير هذه الشريحة
                      </Button>
                      <span className="text-xs font-bold text-slate-500">
                        شريحة {currentSlideIndex + 1} / {slides.length}
                      </span>
                    </div>
                  </div>

                  {/* Left Side: Real Screen Preview Mockup (سكرين شوت واجهة النظام الحقيقية) */}
                  <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950 p-4 rounded-2xl border-2 border-slate-800 shadow-2xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-300 font-bold">
                      <span className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-indigo-400" />
                        <span>{currentSlide.screenshotTitle}</span>
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                        معاينة واجهة حقيقية من داخل النظام
                      </span>
                    </div>

                    <div className="flex-1 flex items-center justify-center my-2">
                      <div className="w-full">
                        {currentSlide.renderMockup()}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>الواجهة المعتمدة في نظام OmniSystem Pro ERP</span>
                      <span className="text-emerald-400 font-bold">✓ شاشة متكاملة جاهزة للعمل والتنفيذ</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Bottom Slide Switcher Bar */}
              <div className="bg-slate-100 dark:bg-slate-800 p-4 border-t flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Previous / Next Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
                    className="gap-1.5 font-bold text-xs bg-white dark:bg-slate-900 border-slate-300 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                    الشريحة السابقة
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % slides.length)}
                    className="gap-1.5 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
                  >
                    الشريحة التالية
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>

                {/* Slide Quick Select Dots & Badges */}
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {slides.map((s, idx) => {
                    const isActive = idx === currentSlideIndex;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          isActive
                            ? "bg-slate-900 text-white border-slate-900 shadow-md font-black"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        #{s.id} {s.badge}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Slide Fullscreen Modal */}
            {fullscreenSlide && (
              <div 
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
                onClick={() => setFullscreenSlide(false)}
              >
                <div 
                  className="bg-slate-900 text-white rounded-2xl overflow-hidden max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-amber-400 text-amber-950 font-bold text-xs">
                        {currentSlide.badge}
                      </Badge>
                      <h3 className="font-bold text-base text-white">
                        {currentSlide.title}
                      </h3>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setFullscreenSlide(false)}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full w-8 h-8 p-0 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="p-6 flex-1 overflow-auto space-y-6">
                    <div className="space-y-2">
                      <div className="text-sm font-bold text-slate-300">{currentSlide.subtitle}</div>
                      <p className="text-sm text-slate-200 bg-slate-800 p-3 rounded-xl border border-slate-700 leading-relaxed">
                        {currentSlide.description}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-indigo-400">معايرة الواجهة الحقيقية:</div>
                      {currentSlide.renderMockup()}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                    <Button
                      size="sm"
                      onClick={downloadPresentationPDF}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      تنزيل العرض التقديمي الكامل (PDF)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setFullscreenSlide(false)}
                      className="text-xs text-slate-300 border-slate-700 font-bold"
                    >
                      إغلاق المعاينة
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: MARKETING POSTERS & BROCHURES (برشورات وبوسترات الكتالوج)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "brochures" && (
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 min-w-max">
                <Button
                  size="sm"
                  variant={filterCategory === "all" ? "default" : "outline"}
                  onClick={() => setFilterCategory("all")}
                  className="text-xs h-8 px-3 font-semibold cursor-pointer"
                >
                  جميع البرشورات ({brochures.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterCategory === "main" ? "default" : "outline"}
                  onClick={() => setFilterCategory("main")}
                  className="text-xs h-8 px-3 font-semibold cursor-pointer"
                >
                  البرشور الرئيسي
                </Button>
                <Button
                  size="sm"
                  variant={filterCategory === "operational" ? "default" : "outline"}
                  onClick={() => setFilterCategory("operational")}
                  className="text-xs h-8 px-3 font-semibold cursor-pointer"
                >
                  الأنظمة التشغيلية
                </Button>
                <Button
                  size="sm"
                  variant={filterCategory === "pilgrimage" ? "default" : "outline"}
                  onClick={() => setFilterCategory("pilgrimage")}
                  className="text-xs h-8 px-3 font-semibold cursor-pointer"
                >
                  الحج والعمرة
                </Button>
                <Button
                  size="sm"
                  variant={filterCategory === "financial" ? "default" : "outline"}
                  onClick={() => setFilterCategory("financial")}
                  className="text-xs h-8 px-3 font-semibold cursor-pointer"
                >
                  المحاسبة والمالية
                </Button>
              </div>

              <span className="text-xs text-muted-foreground shrink-0">
                عرض {filteredBrochures.length} تصميم
              </span>
            </div>

            {/* Brochure Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBrochures.map((item) => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    {/* Image Container */}
                    <div className="relative overflow-hidden bg-slate-900 group-hover:opacity-95 transition-opacity aspect-video">
                      <img
                        src={item.image}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Overlay Badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <Badge className="bg-indigo-600/90 hover:bg-indigo-700 text-white backdrop-blur-md border-0 text-xs">
                          {item.badge}
                        </Badge>
                        <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-md border-0 text-[10px] font-mono">
                          {item.dimensions}
                        </Badge>
                      </div>

                      {/* Quick Action Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                        <Button
                          size="sm"
                          onClick={() => setSelectedImage(item)}
                          className="bg-white/90 hover:bg-white text-slate-900 font-bold gap-1.5 text-xs shadow-lg cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-indigo-600" /> معاينة الشاشة الكاملة
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownloadBrochure(item)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 text-xs shadow-lg cursor-pointer"
                        >
                          <Download className="w-4 h-4" /> تحميل
                        </Button>
                      </div>
                    </div>

                    {/* Card Header & Content */}
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between gap-2">
                        <span>{item.title}</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 leading-relaxed mt-1">
                        {item.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-3">
                      {/* Features List */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                          أبرز النقاط والمزايا في هذا التصميم:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                          {item.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  {/* Bottom Actions Footer */}
                  <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-3 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedImage(item)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 font-bold gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> تكبير ومعاينة
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintBrochure(item)}
                        className="h-8 text-xs gap-1 cursor-pointer"
                        title="طباعة البرشور"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" /> طباعة
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareBrochure(item)}
                        className="h-8 text-xs gap-1 cursor-pointer"
                        title="مشاركة"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-600" /> مشاركة
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadBrochure(item)}
                        className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> تنزيل الصورة
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Lightbox / Full-screen Preview Modal */}
            {selectedImage && (
              <div 
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
                onClick={() => setSelectedImage(null)}
              >
                <div 
                  className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-600 text-white text-xs">
                        {selectedImage.badge}
                      </Badge>
                      <h3 className="font-bold text-sm md:text-base text-white">
                        {selectedImage.title}
                      </h3>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedImage(null)}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full w-8 h-8 p-0 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Modal Body - High Res Image View */}
                  <div className="flex-1 overflow-auto bg-black p-2 flex items-center justify-center min-h-[350px]">
                    <img
                      src={selectedImage.image}
                      alt={selectedImage.title}
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl"
                    />
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                        {selectedImage.description}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        أبعاد الصورة: {selectedImage.dimensions}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePrintBrochure(selectedImage)}
                        className="text-xs gap-1.5 h-9 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" /> طباعة البرشور
                      </Button>
                      <Button
                        onClick={() => handleDownloadBrochure(selectedImage)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 h-9 px-4 cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> تحميل عالي الدقة
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
