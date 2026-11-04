import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { MasterReceiptSlip } from "@/components/receipt";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Printer,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Receipt,
  FileCheck,
  Zap,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";

const sampleOrder: any = {
  id: 33,
  invoiceNumber: "33",
  dailyOrderNumber: "33",
  createdAt: new Date().toISOString(),
  orderType: "dine-in",
  cashierName: "معمر النعماني",
  paymentMethod: "cash",
  subtotal: 3000,
  tax: 0,
  discount: 0,
  total: 3000,
  tableNumber: "3",
  items: [
    {
      productName: "وجبة دجاج شواية فاخر",
      quantity: 1,
      unitPrice: 2000,
      total: 2000,
    },
    {
      productName: "نص كيس خبز أبيض",
      quantity: 1,
      unitPrice: 1000,
      total: 1000,
    },
  ],
};

// Default configurations for each format
const SHAPE1_DEFAULTS = {
  receiptStyle: 1,
  useAlternativeReceiptStyle: false,
  printLogo: true,
  showDailyOrderNumber: true,
  showMainInvoiceNumber: true,
  showCustomer: true,
  showCashier: true,
  showTaxNumber: true,
  showTableNumber: true,
  showDateTime: true,
  showNotes: true,
  receiptPaperSize: "80mm",
  paperWidth: 80,
  topMargin: 1,
  bottomMargin: 1,
  leftMargin: 1,
  rightMargin: 1,
  fontSize: 11,
  lineSpacing: 2,
};

const SHAPE2_DEFAULTS = {
  receiptStyle: 2,
  useAlternativeReceiptStyle: true,
  altHideLogo: true,
  altHideTaxHeader: true,
  altShowAddressInFooter: true,
  altShowPhonesInFooterBox: true,
  altCompactDeptSlip: true,
  altShowBigDailyNumber: true,
  altDailyOrderNumberSize: "3xl",
  altCompactSpacing: true,
  altApplyToDepartment: true,
  paperWidth: 80,
  topMargin: 0.5,
  bottomMargin: 0.5,
  leftMargin: 0.5,
  rightMargin: 0.5,
};

const SHAPE3_DEFAULTS = {
  receiptStyle: 3,
  useAlternativeReceiptStyle: false,
  showDailyOrderNumber: true,
  altDailyOrderNumberSize: "2xl",
  paperWidth: 80,
  topMargin: 0.5,
  bottomMargin: 0.5,
  leftMargin: 0.5,
  rightMargin: 0.5,
  fontSize: 11,
  lineSpacing: 1.15,
};

export default function ReceiptFormatsStatusPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [printingStyle, setPrintingStyle] = useState<number | null>(null);

  const { data: settings = {} } = useGetSettings();
  const updateMutation = useUpdateSettings();

  const saveSettings = (payload: any, successTitle?: string) => {
    try {
      localStorage.setItem("pos_system_settings_v1", JSON.stringify(payload));
    } catch {}
    updateMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          window.dispatchEvent(new Event("pos-permissions-updated"));
          toast({ title: successTitle || "تم تحديث واعتماد الإعدادات بنجاح ✅" });
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "خطأ في الحفظ",
            description: err?.message || "يرجى المحاولة مرة أخرى",
          });
        },
      }
    );
  };

  const currentActiveStyle = Number(
    settings?.receiptStyle ?? (settings?.useAlternativeReceiptStyle ? 2 : 1)
  );

  const handleActivateStyle = (styleNum: number) => {
    const payload = {
      ...settings,
      receiptStyle: styleNum,
      useAlternativeReceiptStyle: styleNum === 2,
    };
    saveSettings(payload, `تم تفعيل واعتماد الشكل ${styleNum} بنجاح ✅`);
  };

  const handleResetSpecificStyle = (styleNum: number) => {
    let styleDefaults = {};
    let styleName = "";

    if (styleNum === 1) {
      styleDefaults = SHAPE1_DEFAULTS;
      styleName = "الشكل 1 (القياسي الكامل)";
    } else if (styleNum === 2) {
      styleDefaults = SHAPE2_DEFAULTS;
      styleName = "الشكل 2 (البديل الموفر)";
    } else {
      styleDefaults = SHAPE3_DEFAULTS;
      styleName = "الشكل 3 (المربع للطلب السريع)";
    }

    const payload = {
      ...settings,
      ...styleDefaults,
    };

    saveSettings(payload, `تمت إعادة ضبط إعدادات ${styleName} للافتراضي بنجاح 🔄✅`);
  };

  const handleResetAllStyles = () => {
    const payload = {
      ...settings,
      ...SHAPE1_DEFAULTS,
      receiptStyle: currentActiveStyle,
      useAlternativeReceiptStyle: currentActiveStyle === 2,
    };

    saveSettings(payload, "تمت إعادة ضبط جميع أشكال الفواتير إلى القيم الافتراضية الأصلية! 🛠️✨");
  };

  const handleTestPrintStyle = (styleNum: number) => {
    setPrintingStyle(styleNum);
    const printAreaId = `__settings-preview-print-style-${styleNum}__`;
    document.getElementById(printAreaId)?.remove();

    const printableContainer = document.getElementById(`live-preview-container-style-${styleNum}`);
    if (!printableContainer) {
      setPrintingStyle(null);
      return;
    }

    const el = document.createElement("div");
    el.id = printAreaId;
    el.setAttribute("dir", "rtl");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    el.style.top = "0";
    el.innerHTML = printableContainer.innerHTML;
    document.body.appendChild(el);

    const cleanup = () => {
      document.getElementById(printAreaId)?.remove();
      setPrintingStyle(null);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(cleanup, 3000);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-10" dir="rtl">
        {/* Header Title Section */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
                <Receipt className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                إدارة وحالة أشكال الفواتير الثلاث (المقاسات والتصميم)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              عرض تفصيلي ومعاينة حية حقيقية لكل طراز، مع إمكانية التبديل الفوري وإعادة الضبط الافتراضي في حال وجود خطأ في الطباعة أو التنسيق.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleResetAllStyles}
              disabled={updateMutation.isPending}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>إعادة ضبط جميع الأشكال للافتراضي</span>
            </Button>
          </div>
        </div>

        {/* Current Active Banner */}
        <Card className="border-2 border-indigo-500/50 bg-gradient-to-r from-indigo-50 via-white to-slate-50 dark:from-indigo-950/30 dark:to-slate-900 shadow-md">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">الطراز والمقاس المعتمد حالياً للطباعة المباشرة في الكاشير:</div>
                <div className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                  <span>
                    {currentActiveStyle === 3
                      ? "الشكل 3: التذكرة المربعة السريعة (مطابق للصورة)"
                      : currentActiveStyle === 2
                      ? "الشكل 2: البديل الموفر للورق"
                      : "الشكل 1: القياسي الكامل"}
                  </span>
                  <Badge className="bg-emerald-600 text-white font-bold text-xs">
                    نشط ومفعّل تلقائياً ✅
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>أي تغيير في الشكل المعتمد هنا يتم تطبيقه فورياً على طابعة الكاشير ونقاط البيع.</span>
            </div>
          </CardContent>
        </Card>

        {/* 3 Receipt Formats Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ═════════ SHAPE 1: STANDARD ═════════ */}
          <Card
            className={`flex flex-col justify-between transition-all duration-200 ${
              currentActiveStyle === 1
                ? "border-2 border-indigo-600 shadow-xl ring-2 ring-indigo-500/20"
                : "border border-slate-300 dark:border-slate-800 shadow-md"
            }`}
          >
            <CardHeader className="pb-3 border-b bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <span>الشكل 1: الطراز القياسي الكامل</span>
                </CardTitle>
                <Badge
                  variant={currentActiveStyle === 1 ? "default" : "outline"}
                  className={currentActiveStyle === 1 ? "bg-indigo-600 text-white font-bold" : "text-slate-600 font-bold"}
                >
                  {currentActiveStyle === 1 ? "نشط حالياً ✅" : "غير مفعّل"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                الشكل القياسي الرسومي الكامل يتضمن ترويسة النشاط والتفاصيل والشعار والباركود.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 bg-slate-100 dark:bg-slate-950 space-y-4">
              {/* Features Badge list */}
              <div className="text-[11px] space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>عرض الورق:</span>
                  <span className="font-mono font-bold">80mm</span>
                </div>
                <div className="flex justify-between">
                  <span>ارتفاع التخمين:</span>
                  <span className="font-mono font-bold">~120mm (قياسي)</span>
                </div>
                <div className="flex justify-between">
                  <span>إظهار الشعار والتذييل:</span>
                  <span className="font-bold text-emerald-600">نعم مفعّل</span>
                </div>
              </div>

              {/* Live Preview Container */}
              <div className="border rounded-xl p-2 bg-white overflow-hidden shadow-xs">
                <div id="live-preview-container-style-1">
                  <MasterReceiptSlip
                    order={sampleOrder}
                    settings={{ ...settings, receiptStyle: 1, useAlternativeReceiptStyle: false }}
                    cashierName="معمر النعماني"
                    copyLabel="نسخة العميل"
                  />
                </div>
              </div>
            </CardContent>

            <div className="p-4 border-t bg-white dark:bg-slate-900 space-y-2">
              <Button
                onClick={() => handleActivateStyle(1)}
                disabled={currentActiveStyle === 1 || updateMutation.isPending}
                className={`w-full text-xs font-bold gap-1.5 cursor-pointer ${
                  currentActiveStyle === 1
                    ? "bg-slate-200 text-slate-800 hover:bg-slate-200"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {currentActiveStyle === 1 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>مفعّل حالياً في الكاشير</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>تفعيل واعتماد الشكل 1</span>
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleTestPrintStyle(1)}
                  variant="outline"
                  size="sm"
                  className="text-[11px] font-bold gap-1 text-slate-700 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>طباعة تجريبية</span>
                </Button>

                <Button
                  onClick={() => handleResetSpecificStyle(1)}
                  disabled={updateMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="text-[11px] font-bold gap-1 text-amber-700 hover:bg-amber-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>إعادة ضبط الشكل 1</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* ═════════ SHAPE 2: ALTERNATIVE ═════════ */}
          <Card
            className={`flex flex-col justify-between transition-all duration-200 ${
              currentActiveStyle === 2
                ? "border-2 border-blue-600 shadow-xl ring-2 ring-blue-500/20"
                : "border border-slate-300 dark:border-slate-800 shadow-md"
            }`}
          >
            <CardHeader className="pb-3 border-b bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                  <span>الشكل 2: البديل الموفر للورق</span>
                </CardTitle>
                <Badge
                  variant={currentActiveStyle === 2 ? "default" : "outline"}
                  className={currentActiveStyle === 2 ? "bg-blue-600 text-white font-bold" : "text-slate-600 font-bold"}
                >
                  {currentActiveStyle === 2 ? "نشط حالياً ✅" : "غير مفعّل"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                طراز مختصر وقصير جداً لتقليص استهلاك الورق وإلغاء الشعار والنصوص الضريبية الطويلة.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 bg-slate-100 dark:bg-slate-950 space-y-4">
              {/* Features Badge list */}
              <div className="text-[11px] space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>عرض الورق:</span>
                  <span className="font-mono font-bold">80mm</span>
                </div>
                <div className="flex justify-between">
                  <span>ارتفاع التخمين:</span>
                  <span className="font-mono font-bold">~65mm (قصيرة جداً)</span>
                </div>
                <div className="flex justify-between">
                  <span>إخفاء الشعار والتفاصيل:</span>
                  <span className="font-bold text-blue-600">نعم مفعّل</span>
                </div>
              </div>

              {/* Live Preview Container */}
              <div className="border rounded-xl p-2 bg-white overflow-hidden shadow-xs">
                <div id="live-preview-container-style-2">
                  <MasterReceiptSlip
                    order={sampleOrder}
                    settings={{ ...settings, receiptStyle: 2, useAlternativeReceiptStyle: true }}
                    cashierName="معمر النعماني"
                    copyLabel="خاصة بالزبون"
                  />
                </div>
              </div>
            </CardContent>

            <div className="p-4 border-t bg-white dark:bg-slate-900 space-y-2">
              <Button
                onClick={() => handleActivateStyle(2)}
                disabled={currentActiveStyle === 2 || updateMutation.isPending}
                className={`w-full text-xs font-bold gap-1.5 cursor-pointer ${
                  currentActiveStyle === 2
                    ? "bg-slate-200 text-slate-800 hover:bg-slate-200"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {currentActiveStyle === 2 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>مفعّل حالياً في الكاشير</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>تفعيل واعتماد الشكل 2</span>
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleTestPrintStyle(2)}
                  variant="outline"
                  size="sm"
                  className="text-[11px] font-bold gap-1 text-slate-700 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>طباعة تجريبية</span>
                </Button>

                <Button
                  onClick={() => handleResetSpecificStyle(2)}
                  disabled={updateMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="text-[11px] font-bold gap-1 text-amber-700 hover:bg-amber-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>إعادة ضبط الشكل 2</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* ═════════ SHAPE 3: SQUARE TICKET ═════════ */}
          <Card
            className={`flex flex-col justify-between transition-all duration-200 ${
              currentActiveStyle === 3
                ? "border-2 border-emerald-600 shadow-xl ring-2 ring-emerald-500/20"
                : "border border-slate-300 dark:border-slate-800 shadow-md"
            }`}
          >
            <CardHeader className="pb-3 border-b bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <span>الشكل 3: المربع (طلب سريع)</span>
                </CardTitle>
                <Badge
                  variant={currentActiveStyle === 3 ? "default" : "outline"}
                  className={currentActiveStyle === 3 ? "bg-emerald-600 text-white font-bold" : "text-slate-600 font-bold"}
                >
                  {currentActiveStyle === 3 ? "نشط حالياً ✅" : "غير مفعّل"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                شكل مربع ممتاز قصير وواضح (أقل من 80mm) برقم طلب يومي عريض وشريط بيانات مدمج ثلاثي.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 bg-slate-100 dark:bg-slate-950 space-y-4">
              {/* Features Badge list */}
              <div className="text-[11px] space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>عرض الورق:</span>
                  <span className="font-mono font-bold">80mm</span>
                </div>
                <div className="flex justify-between">
                  <span>اقصى ارتفاع:</span>
                  <span className="font-mono font-bold text-emerald-600">≤ 80mm (مضمون)</span>
                </div>
                <div className="flex justify-between">
                  <span>نمط التنسيق:</span>
                  <span className="font-bold text-emerald-600">مربع مدمج مطابق للصورة</span>
                </div>
              </div>

              {/* Live Preview Container */}
              <div className="border rounded-xl p-2 bg-white overflow-hidden shadow-xs">
                <div id="live-preview-container-style-3">
                  <MasterReceiptSlip
                    order={sampleOrder}
                    settings={{ ...settings, receiptStyle: 3, useAlternativeReceiptStyle: false }}
                    cashierName="معمر النعماني"
                    copyLabel="فاتورة خاصة بالزبون"
                  />
                </div>
              </div>
            </CardContent>

            <div className="p-4 border-t bg-white dark:bg-slate-900 space-y-2">
              <Button
                onClick={() => handleActivateStyle(3)}
                disabled={currentActiveStyle === 3 || updateMutation.isPending}
                className={`w-full text-xs font-bold gap-1.5 cursor-pointer ${
                  currentActiveStyle === 3
                    ? "bg-slate-200 text-slate-800 hover:bg-slate-200"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {currentActiveStyle === 3 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>مفعّل حالياً في الكاشير</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>تفعيل واعتماد الشكل 3</span>
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleTestPrintStyle(3)}
                  variant="outline"
                  size="sm"
                  className="text-[11px] font-bold gap-1 text-slate-700 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>طباعة تجريبية</span>
                </Button>

                <Button
                  onClick={() => handleResetSpecificStyle(3)}
                  disabled={updateMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="text-[11px] font-bold gap-1 text-amber-700 hover:bg-amber-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>إعادة ضبط الشكل 3</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
