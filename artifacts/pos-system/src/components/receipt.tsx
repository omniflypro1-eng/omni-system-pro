import type { Order } from "@workspace/api-client-react";
import { getEffectiveDocPrintSettings } from "@/lib/printUtils";
const omnisystemLogo = "/icon.png";

type OrderType = "dine-in" | "takeout" | "delivery";

const ORDER_TYPE_LABELS: Record<string, string> = {
  "dine-in": "محلي",
  "takeout": "سفري",
  "delivery": "توصيل",
};

interface ReceiptSettings {
  businessName?: string;
  address?: string | null;
  phone?: string | null;
  taxNumber?: string | null;
  taxRate?: number;
  currency?: string;
  receiptMessage?: string | null;
  printLogo?: boolean;
  logoUrl?: string | null;
  showCashier?: boolean;
  showCustomer?: boolean;
  showOrderNumber?: boolean;
  showDailyOrderNumber?: boolean;
  showMainInvoiceNumber?: boolean;
  showTableNumber?: boolean;
  showDateTime?: boolean;
  showOrderType?: boolean;
  showTax?: boolean;
  showDiscount?: boolean;
  showNotes?: boolean;
}

interface DeptGroup {
  dept: {
    id: number;
    categoryId?: number | null;
    categoryName?: string | null;
    printerName?: string | null;
    copies: number;
    enabled: boolean;
    printOrder: number;
  };
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    categoryId?: number | null;
    categoryName?: string | null;
  }>;
}

interface ReceiptProps {
  order: Order;
  settings?: ReceiptSettings;
  cashierName?: string;
  masterCopiesCount?: number;
  deptGroups?: DeptGroup[];
}

function formatDate(dateStr: string) {
  if (!dateStr) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hoursRaw = now.getHours();
    const ampm = hoursRaw >= 12 ? "م" : "ص";
    const hours12 = hoursRaw % 12 || 12;
    const hours = String(hours12).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");
    return { date: `${day}/${month}/${year}`, time: `${hours}:${mins} ${ampm}` };
  }
  let s = String(dateStr).trim();
  if (s.includes(" ")) {
    s = s.replace(" ", "T");
  }
  if (!s.endsWith("Z") && !s.match(/[+-]\d{2}:\d{2}$/)) {
    s += "Z"; // SQLite datetime('now') is UTC, append Z to ensure correct parsing
  }
  const d = new Date(s);
  const targetDate = isNaN(d.getTime()) ? new Date() : d;
  const day = String(targetDate.getDate()).padStart(2, "0");
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const year = targetDate.getFullYear();
  const hoursRaw = targetDate.getHours();
  const ampm = hoursRaw >= 12 ? "م" : "ص";
  const hours12 = hoursRaw % 12 || 12;
  const hours = String(hours12).padStart(2, "0");
  const mins = String(targetDate.getMinutes()).padStart(2, "0");
  return { date: `${day}/${month}/${year}`, time: `${hours}:${mins} ${ampm}` };
}

/* مساعد: يعرض أرقاماً دائماً من اليسار لليمين داخل سياق RTL */
function Num({ children }: { children: React.ReactNode }) {
  return (
    <span dir="ltr" style={{ unicodeBidi: "embed", fontVariantNumeric: "tabular-nums" }}>
      {children}
    </span>
  );
}

/**
 * دالة مساعدة معيارية لتنظيف رقم فاتورة الطلب ليكون دائماً عدداً صحيحاً يبدأ من 1 إلى ما لا نهاية
 * يزيل أي بادئات مثل '#', 'INV-', 'inv-' وأي أحرف أو أصفار بادئة
 */
export function formatOrderInvoiceNumber(inv?: string | number | null, fallbackId?: number | null): string {
  if (inv === undefined || inv === null || inv === "") {
    return String(fallbackId && fallbackId > 0 ? fallbackId : 1);
  }
  const str = String(inv).trim();
  const digitsOnly = str.replace(/[^\d]/g, "");
  if (digitsOnly && Number(digitsOnly) > 0) {
    return String(parseInt(digitsOnly, 10));
  }
  return String(fallbackId && fallbackId > 0 ? fallbackId : 1);
}

function getPrinterMargins() {
  let printerTop = 1;
  let printerBottom = 1;
  let printerLeft = 1;
  let printerRight = 1;
  let fontSize = 11;
  let lineSpacing = 2;
  let paperWidth = 80;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("pos_printer_settings_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.topMargin !== undefined && parsed.topMargin !== null && parsed.topMargin !== "") printerTop = Number(parsed.topMargin);
        if (parsed.bottomMargin !== undefined && parsed.bottomMargin !== null && parsed.bottomMargin !== "") printerBottom = Number(parsed.bottomMargin);
        if (parsed.leftMargin !== undefined && parsed.leftMargin !== null && parsed.leftMargin !== "") printerLeft = Number(parsed.leftMargin);
        if (parsed.rightMargin !== undefined && parsed.rightMargin !== null && parsed.rightMargin !== "") printerRight = Number(parsed.rightMargin);
        if (parsed.fontSize !== undefined && parsed.fontSize !== null && parsed.fontSize !== "") fontSize = Number(parsed.fontSize);
        if (parsed.lineSpacing !== undefined && parsed.lineSpacing !== null && parsed.lineSpacing !== "") lineSpacing = Number(parsed.lineSpacing);
        if (parsed.paperWidth !== undefined && parsed.paperWidth !== null && parsed.paperWidth !== "") paperWidth = Number(parsed.paperWidth);
      }
    } catch {}
  }
  return { printerTop, printerBottom, printerLeft, printerRight, fontSize, lineSpacing, paperWidth };
}

export function MasterReceiptSlip({
  order,
  settings,
  cashierName,
  copyLabel,
}: {
  order: Order;
  settings?: ReceiptSettings;
  cashierName?: string;
  copyLabel?: string;
}) {
  const eff = getEffectiveDocPrintSettings(settings);
  const { printerTop, printerBottom, printerLeft, printerRight, fontSize, lineSpacing, paperWidth } = getPrinterMargins();
  const printableWidth = paperWidth === 58 ? 48 : 72;
  const { date, time } = formatDate(order.createdAt);
  const currency = settings?.currency ?? "ريال";
  const taxRate = settings?.taxRate ?? 15;
  const orderTypeLabel = ORDER_TYPE_LABELS[order.orderType ?? "dine-in"] ?? "محلي";
  const showDaily = settings?.showDailyOrderNumber !== false;
  const showMain = settings?.showMainInvoiceNumber !== false;
  const showCopyLabel = (settings as any)?.showCopyLabel !== false && (eff as any)?.showCopyLabel !== false;
  const showInvoiceTitle = (settings as any)?.showInvoiceHeaderTitle !== false && (eff as any)?.showInvoiceHeaderTitle !== false;
  const showTaxNum = (settings as any)?.showTaxNumber !== false && (eff as any)?.showTaxNumber !== false;

  const rawDaily = (order as any).dailyOrderNumber ?? (order as any).daily_order_number;
  const cleanInvoiceNumber = formatOrderInvoiceNumber(order.invoiceNumber, order.id);
  const dailyOrderNumber = rawDaily !== undefined && rawDaily !== null ? String(rawDaily) : cleanInvoiceNumber;
  const businessName = settings?.businessName || eff.companyName || "اسم المطعم";
  const effectiveLogo =
    settings?.logoUrl && settings.logoUrl !== "null" && settings.logoUrl !== ""
      ? settings.logoUrl
      : eff.logoUrl || omnisystemLogo;
  const shouldShowLogo = settings?.printLogo !== undefined ? settings.printLogo !== false : eff.showLogo !== false;
  const footerMsg = settings?.receiptMessage || eff.invoiceFooterText;
  const termsMsg = eff.termsAndConditions || "الطلب لا يمكن استرجاعه أو إلغاؤه";
  const effAddress = settings?.address || eff.address;
  const effPhone = settings?.phone || eff.phone;
  const rawTax = settings?.taxNumber ?? (eff as any)?.taxNumber ?? "";
  const cleanTax = String(rawTax).trim();
  const hasValidTax = cleanTax !== "" && cleanTax !== "null" && cleanTax !== "undefined";
  const effTaxNumber = showTaxNum && hasValidTax ? cleanTax : "";

  const isAlternative = (settings as any)?.useAlternativeReceiptStyle === true;
  const altHideLogo = (settings as any)?.altHideLogo !== false;
  const rawSize = (settings as any)?.altDailyOrderNumberSize || "3xl";
  const dailySizeClass =
    rawSize === "4xl" ? "text-4xl font-black" :
    rawSize === "2xl" ? "text-2xl font-black" :
    rawSize === "xl" ? "text-xl font-black" : "text-3xl font-black";

  const commonSlipStyle: React.CSSProperties = {
    boxSizing: "border-box",
    width: "100%",
    maxWidth: `${printableWidth}mm`,
    fontSize: `${fontSize}px`,
    lineHeight: 1 + lineSpacing / 10,
    paddingTop: `${printerTop > 0 ? printerTop : 0}mm`,
    paddingBottom: `${printerBottom > 0 ? printerBottom : 0}mm`,
    paddingLeft: `${printerLeft > 0 ? printerLeft : 0}mm`,
    paddingRight: `${printerRight > 0 ? printerRight : 0}mm`,
    marginTop: printerTop < 0 ? `${printerTop}mm` : "0mm",
    marginBottom: printerBottom < 0 ? `${printerBottom}mm` : "0mm",
    marginLeft: printerLeft < 0 ? `${printerLeft}mm` : "auto",
    marginRight: printerRight < 0 ? `${printerRight}mm` : "auto",
  };

  const receiptStyle = Number((settings as any)?.receiptStyle ?? ((settings as any)?.useAlternativeReceiptStyle ? 2 : 1));

  // ══════════════════════════════════════════════════════════════════
  // الشكل الثالث: التصميم المربع القصير المطابق تماماً للصورة المرفقة
  // ══════════════════════════════════════════════════════════════════
  if (receiptStyle === 3) {
    const paymentLabel = order.paymentMethod === "card" ? "شبكة" : "نقد";
    return (
      <div className="receipt-slip receipt-slip-shape3" dir="rtl" style={commonSlipStyle}>
        {/* 1) اسم النشاط بالمنتصف */}
        <div className="text-center pt-0 pb-0">
          <div className="receipt-business-name font-black text-base text-black leading-tight">
            {businessName}
          </div>
        </div>

        {/* 2) عنوان الفاتورة تحته خط متصل */}
        <div className="text-center font-bold text-xs text-black underline decoration-1 underline-offset-2 my-0.5 leading-none">
          {copyLabel || "فاتورة خاصة بالزبون"}
        </div>

        {/* 3) رقم الهاتف */}
        <div className="text-center text-[10px] font-bold text-black dir-ltr my-0.5 leading-none">
          <Num>{effPhone || "780780116 - 775695953"}</Num>
        </div>

        {/* 4) شريط البيانات الثلاثي (التاريخ | رقم الطلب اليومي البارز | رقم الطاولة والوقت) */}
        <div className="flex justify-between items-center text-xs py-0.5 px-0.5 font-bold my-0.5 border-t border-b border-black">
          {/* اليسار: التاريخ */}
          <div className="flex flex-col items-start text-left min-w-0">
            <span className="font-mono font-bold text-[10px] text-black dir-ltr leading-tight">
              <Num>{date}</Num>
            </span>
          </div>

          {/* الوسط: رقم الطلب اليومي بخط كبير عريض تحته (محلي/نقد) */}
          <div className="flex flex-col items-center justify-center px-1">
            <span className="text-2xl font-black text-black leading-none tracking-tighter" style={{ fontVariantNumeric: "tabular-nums" }}>
              <Num>{dailyOrderNumber}</Num>
            </span>
            <span className="text-[10px] font-black text-black mt-0.5 leading-none">
              {orderTypeLabel}/{paymentLabel}
            </span>
          </div>

          {/* اليمين: رقم الطاولة والوقت */}
          <div className="flex flex-col items-end text-right min-w-0">
            <span className="text-[9px] text-gray-700 leading-none mb-0.5">
              رقم الطاولة {order.tableNumber ? <Num>{order.tableNumber}</Num> : ""}
            </span>
            <span className="font-mono font-bold text-[10px] text-black dir-ltr leading-tight">
              <Num>{time}</Num>
            </span>
          </div>
        </div>

        {/* 5) جدول الأصناف المطابق تماماً كالصورة: الصنف | الكمية | ت.م | الإجمالي */}
        <table className="receipt-table w-full border-collapse text-[11px] my-0.5">
          <thead>
            <tr className="border-b border-black text-gray-800">
              <th className="text-right p-0.5 font-black w-2/5">الصنف</th>
              <th className="text-center p-0.5 font-black w-1/5">الكمية</th>
              <th className="text-center p-0.5 font-black w-1/5">ت.م</th>
              <th className="text-left p-0.5 font-black w-1/5">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => {
              const uPrice = item.unitPrice ?? item.price ?? 0;
              const lTotal = uPrice * item.quantity;
              return (
                <tr key={idx} className="border-b border-gray-300">
                  <td className="text-right p-0.5 font-bold text-black" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                    {item.productName}
                  </td>
                  <td className="text-center p-0.5 font-black text-black">
                    <Num>{item.quantity}</Num>
                  </td>
                  <td className="text-center p-0.5 font-bold text-black">
                    <Num>{uPrice.toLocaleString("en-US")}</Num>
                  </td>
                  <td className="text-left p-0.5 font-black text-black">
                    <Num>{lTotal.toLocaleString("en-US")}</Num>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-black">
              <td colSpan={3} className="text-right p-0.5 font-black text-xs">
                إجمالي الفاتورة:
              </td>
              <td className="text-left p-0.5 font-black text-xs whitespace-nowrap">
                <Num>{(order.total ?? 0).toLocaleString("en-US")}</Num>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* 6) تذييل الملاحظات ورسالة الإيصال */}
        <div className="text-center text-[9px] font-bold text-black my-0.5 leading-tight">
          {footerMsg || "عزيزي العميل اطلب رقم الإيصال عند الشراء"}
        </div>
        <div className="text-center text-[8px] font-bold text-gray-600 mt-0.5">
          شكراً لزيارتكم
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // الشكل الأول: التصميم القياسي الكامل للفاتورة
  // ══════════════════════════════════════════════════════════════════
  if (receiptStyle === 1) {
    return (
      <div className="receipt-slip" dir="rtl" style={commonSlipStyle}>
        <div className="receipt-header text-center pb-1">
          <div className="receipt-business-name font-black text-xl mb-0.5">{businessName}</div>
          {copyLabel && (
            <div className="receipt-copy-label font-bold text-sm my-0.5">
              {copyLabel}
            </div>
          )}
        </div>

        <div className="receipt-divider-solid my-1 border-t border-black" />

        <div className="text-xs space-y-1 font-bold my-1">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">رقم الفاتورة:</span>
            <span className="font-mono text-black font-black"><Num>{cleanInvoiceNumber}</Num></span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">التاريخ والوقت:</span>
            <span className="text-black font-black"><Num>{date} {time}</Num></span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">نوع الطلب:</span>
            <span className="text-black font-black">{orderTypeLabel}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">المستخدم:</span>
            <span className="text-black font-black">{cashierName || order.cashierName || "معمر النعماني"}</span>
          </div>
        </div>

        <div className="receipt-divider-solid my-1 border-t border-black" />

        <table className="receipt-table w-full text-xs mb-2 border-collapse border border-black">
          <thead>
            <tr className="border-b border-black bg-gray-50">
              <th className="text-right p-1.5 border-r border-black font-black w-1/2">الصنف</th>
              <th className="text-center p-1.5 border-r border-black font-black w-1/4">الكمية</th>
              <th className="text-left p-1.5 font-black w-1/4">السعر</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={idx} className="border-b border-black">
                <td className="text-right p-1.5 border-r border-black font-bold">{item.productName}</td>
                <td className="text-center p-1.5 border-r border-black font-black"><Num>{item.quantity}</Num></td>
                <td className="text-left p-1.5 font-black"><Num>{(item.unitPrice ?? item.price ?? 0).toLocaleString("en-US")}</Num></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-b border-black">
              <td colSpan={2} className="text-right font-bold p-1.5 border-r border-black">المجموع الفرعي</td>
              <td className="text-left font-bold p-1.5"><Num>{(order.subtotal ?? order.total).toLocaleString("en-US")}</Num></td>
            </tr>
            <tr className="font-black text-sm border-t-2 border-black bg-gray-50">
              <td colSpan={2} className="text-right p-2 border-r border-black font-black">المجموع النهائي:</td>
              <td className="text-left p-2 font-black"><Num>{(order.total ?? 0).toLocaleString("en-US")}</Num> {currency}</td>
            </tr>
          </tfoot>
        </table>

        <div className="text-center text-xs font-bold my-2 text-black">
          {footerMsg || "شكرا لزيارتكم .. وننتمنى لكم إقامة سعيدة"}
        </div>

        <div className="border border-black p-1.5 text-center font-bold text-xs my-1 bg-white">
          {effAddress || "العنوان : عدن - مديرية المنصورة - السوق العام"}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // الشكل الثاني: التصميم البديل القصير الموفر للورق (مطابق تماماً للصورة)
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="receipt-slip receipt-slip-alt" dir="rtl" style={commonSlipStyle}>
      {/* ── 1) اسم المطعم مقرب تماماً إلى الخط بدون شعار وبدون نصوص ضريبية ── */}
      <div className="text-center pt-0 pb-0">
        {!altHideLogo && shouldShowLogo && effectiveLogo && (
          <div className="receipt-logo-wrap flex justify-center my-0.5">
            <img src={effectiveLogo} alt="شعار النشاط" className="receipt-logo" style={{ maxHeight: '14mm', maxWidth: '40mm', objectFit: 'contain' }} onError={(e) => { e.currentTarget.src = omnisystemLogo; }} />
          </div>
        )}
        <div className="receipt-business-name font-black text-xl tracking-wider underline decoration-2 underline-offset-2 inline-block leading-tight mb-0">
          {businessName}
        </div>
      </div>

      {/* خط فاصل متصل ملتصق بالاسم مباشرة */}
      <div className="receipt-divider-solid my-0.5" />

      {/* ── 2) خاصة بالزبون / نوع النسخة بوضوح كامل وبدون نص ضريبي ── */}
      {showCopyLabel && (
        <>
          <div className="text-center py-0.5 font-bold text-base tracking-tight text-black leading-none">
            {copyLabel || "خاصة بالزبون"}
          </div>
          <div className="receipt-divider-solid my-0.5" />
        </>
      )}

      {/* ── 3) صف البيانات الثلاثي الدقيق المطابق للصورة ── */}
      <div className="flex justify-between items-center text-xs py-0.5 px-0.5 font-bold">
        {/* اليسار: الوقت ونوع الطلب في صندوق مدور الزوايا */}
        <div className="flex flex-col items-start text-left min-w-0">
          <span className="text-[10px] text-gray-700 leading-none">الوقت</span>
          <span className="font-black text-xs text-black dir-ltr leading-tight mt-0.5">
            <Num>{time}</Num>
          </span>
          {settings?.showOrderType !== false && (
            <div className="border border-black rounded-lg px-2 py-0.5 mt-0.5 font-black text-xs bg-white text-black leading-none">
              {orderTypeLabel}
            </div>
          )}
        </div>

        {/* الوسط: طلب يومي ورقم الطلب اليومي البارز بخط كبير */}
        <div className="flex flex-col items-center justify-center px-1">
          {showDaily ? (
            <>
              <span className="text-[10px] font-bold text-gray-700 leading-none mb-0.5">طلب يومي</span>
              <span className={`${dailySizeClass} text-black leading-none tracking-tighter`} style={{ fontVariantNumeric: "tabular-nums" }}>
                <Num>{dailyOrderNumber}</Num>
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold text-gray-700 leading-none mb-0.5">رقم</span>
              <span className="text-2xl font-black text-black leading-none tracking-tighter">
                <Num>{cleanInvoiceNumber}</Num>
              </span>
            </>
          )}
        </div>

        {/* اليمين: المبيعات / المدير ورقم الفاتورة */}
        <div className="flex flex-col items-end text-right min-w-0">
          <span className="text-[10px] text-gray-700 leading-none">المبيعات/</span>
          <span className="font-black text-xs text-black leading-tight truncate">{cashierName ?? "مدير النظام"}</span>
          <span className="font-mono font-black text-[11px] text-black dir-ltr mt-0.5">
            <Num># {cleanInvoiceNumber}</Num>
          </span>
        </div>
      </div>

      {/* خط فاصل منقط */}
      <div className="receipt-divider-dots my-0.5" />

      {/* ── 4) صف الطاولة والرمز "ط" والتاريخ ── */}
      <div className="flex justify-between items-center text-xs px-1 font-bold my-0.5">
        <span className="font-mono font-black text-sm text-black dir-ltr"><Num>{date}</Num></span>
        <span className="text-base font-black text-black">ط</span>
        <span className="font-mono font-black text-sm text-black dir-ltr"><Num>{order.tableNumber || "3"}</Num></span>
      </div>

      {/* خط فاصل متصل قبل الجدول */}
      <div className="receipt-divider-solid my-0.5" />

      {/* ── 5) جدول الأصناف المحدد بإطار شبكي دقيق ومحاذاة مطابقة ── */}
      <table className="receipt-table w-full border-collapse border border-black text-xs">
        <thead>
          <tr className="border-b border-black">
            <th className="text-right p-1 border-r border-black font-black w-1/2">الصنف</th>
            <th className="text-center p-1 border-r border-black font-black w-1/6">الكمية</th>
            <th className="text-left p-1 font-black w-1/3">السعر</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, idx) => (
            <tr key={idx} className="border-b border-black">
              <td className="text-right p-1 border-r border-black font-bold" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                {item.productName}
              </td>
              <td className="text-center p-1 border-r border-black font-black text-center">
                <Num>{item.quantity}</Num>
              </td>
              <td className="text-left p-1 font-black">
                <Num>{item.unitPrice.toLocaleString("en-US")}</Num>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-black">
            <td colSpan={2} className="text-right p-1.5 border-r border-black font-black text-base">
              الإجمـــالــي:
            </td>
            <td className="text-left p-1.5 font-black text-base whitespace-nowrap">
              <Num>{order.total.toLocaleString("en-US")} {currency}</Num>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ── 6) تذييل الفاتورة المختصر والموفر للورق ── */}
      {/* اسم الكاشير في صندوق محدد */}
      <div className="border border-black p-0.5 text-center font-bold text-xs my-0.5 bg-white">
        {cashierName ?? "مدير النظام"}
      </div>

      {/* نص العنوان بدلاً من رسالة الشكر لتقليص طول الفاتورة واستهلاك الورق */}
      {(effAddress || settings?.address) ? (
        <div className="text-center text-xs font-bold my-0.5 text-black leading-tight">
          {effAddress || settings?.address}
        </div>
      ) : footerMsg ? (
        <div className="text-center text-xs font-bold my-0.5 text-black leading-tight">
          {footerMsg}
        </div>
      ) : null}

      {/* أرقام التواصل في صندوق التذييل بدلاً من نص الشروط المكرر */}
      {(effPhone || settings?.phone) && (
        <div className="border border-black p-0.5 text-center font-bold text-xs my-0.5 bg-white dir-ltr tracking-wider">
          <Num>{effPhone || settings?.phone || "777041792 - 771845734"}</Num>
        </div>
      )}
    </div>
  );
}

export function DeptReceiptSlip({
  order,
  dept,
  items,
  settings,
  cashierName,
}: {
  order: Order;
  dept: DeptGroup["dept"];
  items: DeptGroup["items"];
  settings?: ReceiptSettings;
  cashierName?: string;
}) {
  const { printerTop, printerBottom, printerLeft, printerRight, fontSize, lineSpacing, paperWidth } = getPrinterMargins();
  const printableWidth = paperWidth === 58 ? 48 : 72;
  const { date, time } = formatDate(order.createdAt);
  const orderTypeLabel = ORDER_TYPE_LABELS[order.orderType ?? "dine-in"] ?? "محلي";
  const currency = settings?.currency ?? "ريال";
  const deptTotal = items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.quantity, 0);
  const showDaily = settings?.showDailyOrderNumber !== false;
  const showMain = settings?.showMainInvoiceNumber !== false;
  const rawDaily = (order as any).dailyOrderNumber ?? (order as any).daily_order_number;
  const cleanInvoiceNumber = formatOrderInvoiceNumber(order.invoiceNumber, order.id);
  const dailyOrderNumber = rawDaily !== undefined && rawDaily !== null ? String(rawDaily) : cleanInvoiceNumber;

  return (
    <div
      className="receipt-slip receipt-dept-slip"
      dir="rtl"
      style={{
        boxSizing: "border-box",
        width: "100%",
        maxWidth: `${printableWidth}mm`,
        fontSize: `${fontSize}px`,
        lineHeight: 1 + lineSpacing / 10,
        paddingTop: `${printerTop > 0 ? printerTop : 0}mm`,
        paddingBottom: `${printerBottom > 0 ? printerBottom : 0}mm`,
        paddingLeft: `${printerLeft > 0 ? printerLeft : 0}mm`,
        paddingRight: `${printerRight > 0 ? printerRight : 0}mm`,
        marginTop: printerTop < 0 ? `${printerTop}mm` : "0mm",
        marginBottom: printerBottom < 0 ? `${printerBottom}mm` : "0mm",
        marginLeft: printerLeft < 0 ? `${printerLeft}mm` : "auto",
        marginRight: printerRight < 0 ? `${printerRight}mm` : "auto",
      }}
    >

      {/* ── اسم التصنيف في مستطيل محدد وموجز ── */}
      <div className="border border-black bg-gray-50 text-center font-black text-base py-0.5 my-0.5">
        {dept.categoryName}
      </div>

      {/* ── شريط بيانات مدمج ومختصر جداً بدون (ط 1) وبدون الشبكة الطويلة لتقليص طول الفاتورة ── */}
      <div className="flex justify-between items-center text-xs py-0.5 px-1 border border-black font-bold my-0.5 bg-white">
        <div className="flex items-center gap-1.5">
          {showMain && (
            <span className="font-mono font-black text-[11px] text-black bg-gray-100 px-1 border border-black rounded-xs">
              {cleanInvoiceNumber}
            </span>
          )}
          <span className="text-[10px] text-gray-700 dir-ltr font-bold">
            <Num>{time}</Num>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {settings?.showOrderType !== false && (
            <span className="font-black text-xs text-black border border-black px-1.5 py-0.5 rounded-xs bg-white">
              {orderTypeLabel}
            </span>
          )}
          {showDaily ? (
            <span className="text-sm font-black text-white bg-black px-2 py-0.5 rounded-xs tracking-tight">
              {dailyOrderNumber}
            </span>
          ) : (
            <span className="text-xs font-black text-black bg-gray-100 px-1.5 py-0.5 border border-black rounded-xs">
              {cleanInvoiceNumber}
            </span>
          )}
        </div>
      </div>

      {/* خط فاصل متصل */}
      <div className="receipt-divider-solid my-0.5" />

      {/* ── جدول الأصناف المطابق للصورة تماماً (عمود للكمية وعمود للصنف) ── */}
      <table className="dept-slip-table w-full border-collapse border border-black">
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-black last:border-b-0">
              
              {/* اليسار: الصنف بالكامل، المباشر، السعر */}
              <td className="p-1.5 text-right flex-1">
                <div className="font-black text-sm text-black leading-tight mb-1">{item.productName}</div>
                <div className="flex justify-between items-center text-xs text-gray-600 leading-none">
                  {/* المباشر (اسم الكاشير أو الموظف) */}
                  <span className="font-bold text-[10px]">{cashierName ?? "ايمن محمد"}</span>
                  {/* السعر */}
                  <span className="font-black"><Num>{(item.unitPrice ?? 0).toLocaleString("en-US")}</Num></span>
                </div>
              </td>

              {/* اليمين: الكمية بداخل مربع محدد بخط رأسي كما بالصورة */}
              <td className="w-[50px] text-center font-black text-3xl border-r border-black bg-gray-50 p-1">
                <Num>{item.quantity}</Num>
              </td>

            </tr>
          ))}
        </tbody>
      </table>

      {/* خط فاصل متصل */}
      <div className="receipt-divider-solid my-1" />

      {/* إجمالي القسم (اختياري/صغير للحفاظ على حجم الورق) */}
      <div className="flex justify-between items-center text-xs px-1 font-bold my-1">
        <span>الإجمالي فرعي:</span>
        <span className="font-black"><Num>{deptTotal.toLocaleString("en-US")} {currency}</Num></span>
      </div>

      {/* ── ملاحظات الطلب ── */}
      {order.note && settings?.showNotes !== false && (
        <div className="dept-slip-notes border border-black p-1 my-1 bg-gray-50 text-center">
          <div className="dept-slip-notes-label text-[9px] font-bold text-gray-500 mb-0.5">ملاحظات الطلب</div>
          <div className="text-xs font-bold text-black">{order.note}</div>
        </div>
      )}
    </div>
  );
}

export function ReceiptPrintArea({
  order,
  settings,
  cashierName,
  masterCopiesCount = 1,
  copyLabels = [],
  deptGroups = [],
}: ReceiptProps & { copyLabels?: string[] }) {
  const isDelivery = order?.orderType === "delivery";
  const effectiveMasterCopiesCount = isDelivery ? 2 : masterCopiesCount;
  const effectiveCopyLabels = isDelivery
    ? ["نسخة الكاشير", "نسخة للموصل"]
    : copyLabels;

  const slips: React.ReactNode[] = [];

  for (let i = 0; i < effectiveMasterCopiesCount; i++) {
    const label = effectiveCopyLabels[i] || (effectiveMasterCopiesCount > 1 ? `نسخة ${i + 1}` : "نسخة العميل");
    slips.push(
      <div key={`master-${i}`} className="print-page" data-slip-type="master">
        <MasterReceiptSlip
          order={order}
          settings={settings}
          cashierName={cashierName}
          copyLabel={label}
        />
      </div>
    );
  }

  for (const { dept, items } of deptGroups) {
    if (!items || items.length === 0) continue;
    const copiesToPrint = Math.max(1, dept.copies || 1);
    for (let c = 0; c < copiesToPrint; c++) {
      slips.push(
        <div key={`dept-${dept.id}-${dept.categoryName}-${c}`} className="print-page" data-slip-type="dept">
          <DeptReceiptSlip
            order={order}
            dept={dept}
            items={items}
            settings={settings}
            cashierName={cashierName}
          />
        </div>
      );
    }
  }

  return (
    <div id="receipt-print-area">
      {slips}
    </div>
  );
}

export function ReceiptPreview({
  order,
  settings,
  cashierName,
  masterCopiesCount = 1,
  copyLabels = [],
  deptGroups = [],
}: ReceiptProps & { copyLabels?: string[] }) {
  const isDelivery = order?.orderType === "delivery";
  const effectiveMasterCopiesCount = isDelivery ? 2 : masterCopiesCount;
  const effectiveCopyLabels = isDelivery
    ? ["نسخة الكاشير", "نسخة للموصل"]
    : copyLabels;

  return (
    <div dir="rtl" className="space-y-3 p-3 bg-slate-100 rounded-xl border border-slate-200">
      <div className="text-xs font-extrabold text-slate-500 tracking-wider mb-1 text-center uppercase">
        👀 معاينة شكل ومحتوى الفواتير قبل الطباعة
      </div>
      
      {/* 1) الفاتورة الرئيسية */}
      {Array.from({ length: effectiveMasterCopiesCount }).map((_, i) => {
        const label = effectiveCopyLabels[i] || `نسخة ${i + 1}`;
        return (
          <div key={`preview-master-${i}`} className="bg-white border border-slate-300 rounded-lg shadow-md max-w-sm mx-auto relative overflow-hidden">
            <div className="bg-amber-500 text-white font-extrabold text-[10px] px-3 py-1 text-center border-b border-amber-600">
              فاتورة العميل المباشرة ({label})
            </div>
            <div className="p-4 bg-white">
              <MasterReceiptSlip
                order={order}
                settings={settings}
                cashierName={cashierName}
                copyLabel={label}
              />
            </div>
          </div>
        );
      })}

      {/* 2) فواتير الأقسام */}
      {deptGroups.map(({ dept, items }) => (
        <div key={`preview-dept-${dept.id}`} className="bg-white border border-slate-300 rounded-lg shadow-md max-w-sm mx-auto relative overflow-hidden">
          <div className="bg-blue-600 text-white font-extrabold text-[10px] px-3 py-1 text-center border-b border-blue-700">
            بون تجهيز لقسم التحضير: {dept.categoryName} ({dept.copies} نسخة)
          </div>
          <div className="p-4 bg-white">
            <DeptReceiptSlip
              order={order}
              dept={dept}
              items={items}
              settings={settings}
              cashierName={cashierName}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
