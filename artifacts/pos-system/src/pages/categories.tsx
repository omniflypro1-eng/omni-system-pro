import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { useGetCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useGetProducts } from "@workspace/api-client-react";
import type { Category, CategoryInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Pencil, Trash2, Tags, Package, ArrowRight, ShoppingBag, 
  Warehouse, Info, Layers, AlertTriangle, ShieldAlert, RotateCcw, 
  Power, CheckCircle2, History, X, Search, Check
} from "lucide-react";

export default function Categories() {
  const { data: categories = [], isLoading } = useGetCategories();
  const { data: products = [] } = useGetProducts();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryInput & { is_active?: boolean }>({ name: "", color: "#f59e0b", is_active: true });

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  // Impact Warning Modal State
  const [impactModalOpen, setImpactModalOpen] = useState(false);
  const [targetCategoryForDelete, setTargetCategoryForDelete] = useState<Category | null>(null);
  const [impactData, setImpactData] = useState<any>(null);
  const [isImpactLoading, setIsImpactLoading] = useState(false);

  // Undo (التراجع عن الحذف) State
  const [undoBanner, setUndoBanner] = useState<{ id: number; name: string; secondsLeft: number } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Trash Bin (سلة المحذوفات) State
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [trashCategories, setTrashCategories] = useState<any[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);

  const invalidateData = () => {
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.refetchQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.refetchQueries({ queryKey: ["products"] });
  };

  const openAdd = () => { 
    setEditing(null); 
    setForm({ name: "", color: "#f59e0b", is_active: true }); 
    setShowDialog(true); 
  };

  const openEdit = (cat: Category) => { 
    setEditing(cat); 
    setForm({ 
      name: cat.name, 
      color: cat.color ?? "#f59e0b", 
      is_active: (cat as any).is_active !== false 
    }); 
    setShowDialog(true); 
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى كتابة اسم التصنيف أو القسم" });
      return;
    }
    
    if (editing) {
      const token = localStorage.getItem("pos_token") ?? "";
      fetch(`/api/categories/${editing.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: form.name.trim(),
          color: form.color,
          is_active: form.is_active !== false
        })
      })
      .then(res => {
        if (!res.ok) throw new Error();
        invalidateData();
        setShowDialog(false);
        toast({ title: "تم تحديث التصنيف / القسم بنجاح" });
      })
      .catch(() => toast({ variant: "destructive", title: "فشل في التحديث" }));
    } else {
      createMutation.mutate({ data: { ...form, name: form.name.trim() } }, {
        onSuccess: () => { 
          invalidateData(); 
          setShowDialog(false); 
          toast({ title: "تمت إضافة التصنيف / القسم بنجاح" }); 
        },
        onError: () => toast({ variant: "destructive", title: "فشل في الإضافة" })
      });
    }
  };

  // Toggle active/inactive status (إيقاف أو تفعيل القسم لمنع ظهوره في POS)
  const handleToggleStatus = async (cat: Category) => {
    const currentActive = (cat as any).is_active !== false;
    const nextStatus = !currentActive;
    const token = localStorage.getItem("pos_token") ?? "";

    try {
      const res = await fetch(`/api/categories/${cat.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: nextStatus })
      });

      if (!res.ok) throw new Error("فشل تغيير حالة القسم");

      invalidateData();
      toast({
        title: nextStatus ? "تم تفعيل القسم بنجاح" : "تم إيقاف القسم بنجاح",
        description: nextStatus 
          ? `القسم "${cat.name}" أصبح متاحاً ويظهر الآن في شاشة نقطة المبيعات POS.`
          : `تم إيقاف القسم "${cat.name}" ومنع ظهوره في شاشة الكاشير POS كبديل آمن للحذف.`,
      });
    } catch {
      toast({ variant: "destructive", title: "حدث خطأ أثناء تعديل حالة القسم" });
    }
  };

  // Pre-deletion check & modal
  const handleRequestDelete = async (cat: Category) => {
    setTargetCategoryForDelete(cat);
    setImpactModalOpen(true);
    setIsImpactLoading(true);

    try {
      const token = localStorage.getItem("pos_token") ?? "";
      const res = await fetch(`/api/categories/${cat.id}/impact`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setImpactData(data);
      } else {
        setImpactData(null);
      }
    } catch {
      setImpactData(null);
    } finally {
      setIsImpactLoading(false);
    }
  };

  // Confirm safe soft-delete with undo timer
  const executeDelete = async () => {
    if (!targetCategoryForDelete) return;
    const cat = targetCategoryForDelete;
    const token = localStorage.getItem("pos_token") ?? "";

    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("فشل الحذف");

      setImpactModalOpen(false);
      setTargetCategoryForDelete(null);
      invalidateData();

      // Trigger 60-second Undo banner
      if (timerRef.current) clearInterval(timerRef.current);
      setUndoBanner({ id: cat.id, name: cat.name, secondsLeft: 60 });

      timerRef.current = setInterval(() => {
        setUndoBanner(prev => {
          if (!prev || prev.secondsLeft <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return null;
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        });
      }, 1000);

      toast({
        title: `تم نقل قسم "${cat.name}" لسلة المحذوفات`,
        description: "يمكنك التراجع عن الحذف فوراً عبر شريط التراجع أدناه أو من سلة المحذوفات.",
      });
    } catch {
      toast({ variant: "destructive", title: "فشل في حذف القسم" });
    }
  };

  // Undo / Restore Category
  const handleRestore = async (id: number, name?: string) => {
    const token = localStorage.getItem("pos_token") ?? "";
    try {
      const res = await fetch(`/api/categories/${id}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("فشل التراجع عن الحذف");

      if (timerRef.current) clearInterval(timerRef.current);
      setUndoBanner(null);
      invalidateData();

      if (showTrashModal) {
        loadTrashCategories();
      }

      toast({
        title: "تم التراجع عن الحذف واستعادة القسم بنجاح",
        description: `أصبح قسم "${name || ''}" نشطاً ومتاحاً للعمل وشاشات الكاشير مجدداً.`,
      });
    } catch {
      toast({ variant: "destructive", title: "فشل استعادة القسم" });
    }
  };

  // Load deleted categories for Trash Modal
  const loadTrashCategories = async () => {
    setIsLoadingTrash(true);
    try {
      const token = localStorage.getItem("pos_token") ?? "";
      const res = await fetch(`/api/categories?show_deleted=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrashCategories(data);
      }
    } catch {
      setTrashCategories([]);
    } finally {
      setIsLoadingTrash(false);
    }
  };

  const openTrash = () => {
    setShowTrashModal(true);
    loadTrashCategories();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Filter categories
  const filteredCategories = categories.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = (c as any).is_active !== false;
    if (filterStatus === "active") return matchesSearch && isActive;
    if (filterStatus === "inactive") return matchesSearch && !isActive;
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        {/* Top Header Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-100 text-amber-800 rounded-lg"><Tags className="w-5 h-5" /></span>
              <h1 className="text-2xl font-black text-slate-800">إضافة تصنيفات أو أقسام</h1>
              <Badge variant="outline" className="text-xs bg-slate-50 font-bold border-slate-300">
                إجمالي: {categories.length}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              إدارة أقسام وتصنيفات المبيعات مع إمكانية التفعيل والإيقاف الفوري لمنع الظهور في شاشة الكاشير POS والحذف الآمن مع التراجع وسجل الرقابة.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="outline" 
              onClick={openTrash}
              className="border-slate-300 text-slate-700 hover:text-amber-700 font-bold gap-1.5 text-xs h-9 bg-slate-50 hover:bg-amber-50"
              title="عرض الأقسام المحذوفة مع إمكانية التراجع عن الحذف"
            >
              <History className="w-4 h-4 text-amber-600" />
              سلة المحذوفات والتراجع
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/products"} 
              className="border-slate-300 text-slate-700 hover:text-blue-700 font-bold gap-1.5 text-xs h-9"
            >
              <Package className="w-4 h-4 text-blue-600" />
              بطاقة وقائمة المنتجات
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/pos"} 
              className="border-slate-300 text-slate-700 hover:text-emerald-700 font-bold gap-1.5 text-xs h-9"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              شاشة الكاشير POS
            </Button>
            <Button 
              onClick={openAdd} 
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black gap-2 h-9 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              إضافة تصنيف أو قسم جديد
            </Button>
          </div>
        </div>

        {/* Guidance and Workflow Info Card */}
        <div className="bg-gradient-to-l from-blue-50 to-amber-50/50 p-4 rounded-xl border border-blue-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5"><Info className="w-4 h-4" /></span>
            <div className="text-xs space-y-2 text-slate-700">
              <div className="font-bold text-slate-900 text-sm">💡 حماية البيانات والتحكم في ظهور الأقسام:</div>
              <p className="leading-relaxed">
                إذا كان القسم مرتبطاً بمنتجات أو فواتير سابقة، يمكنك استخدام زر <strong>إيقاف القسم</strong> لإخفائه فوراً من شاشة نقطة البيع والكاشير POS بدون حذفه أو التأثير على التقارير المالية. كما يمكنك الحذف مع إمكانية <strong>التراجع واستعادة القسم</strong> في أي وقت، وتسجيل هوية المستخدم المنفذ في سجل الرقابة والتدقيق.
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <Input 
              placeholder="البحث باسم القسم أو التصنيف..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">تصفية العرض:</span>
            <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1 rounded-md transition-all ${filterStatus === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                الكل ({categories.length})
              </button>
              <button
                onClick={() => setFilterStatus("active")}
                className={`px-3 py-1 rounded-md transition-all ${filterStatus === "active" ? "bg-emerald-600 text-white shadow-xs" : "text-emerald-700 hover:text-emerald-800"}`}
              >
                النشطة / معروضة بالـ POS ({categories.filter(c => (c as any).is_active !== false).length})
              </button>
              <button
                onClick={() => setFilterStatus("inactive")}
                className={`px-3 py-1 rounded-md transition-all ${filterStatus === "inactive" ? "bg-rose-600 text-white shadow-xs" : "text-rose-700 hover:text-rose-800"}`}
              >
                المتوقفة / مخفية ({categories.filter(c => (c as any).is_active === false).length})
              </button>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              الأقسام والتصنيفات المسجلة في النظام ({filteredCategories.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground bg-white rounded-xl border">جاري التحميل...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredCategories.map(cat => {
                const linkedProducts = products.filter(p => p.categoryId === cat.id);
                const catColor = cat.color ?? "#f59e0b";
                const isActive = (cat as any).is_active !== false;

                return (
                  <div 
                    key={cat.id} 
                    className={`bg-white rounded-xl border p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-3 relative overflow-hidden ${!isActive ? 'border-dashed border-rose-300 bg-rose-50/20' : 'border-slate-200'}`}
                  >
                    <div className="absolute top-0 right-0 left-0 h-1.5" style={{ backgroundColor: isActive ? catColor : '#94a3b8' }} />
                    
                    <div className="flex items-start justify-between gap-3 pt-1">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white font-bold shadow-xs border border-black/10" 
                          style={{ backgroundColor: isActive ? catColor : '#94a3b8' }}
                        >
                          <Tags className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-extrabold text-slate-900 block truncate text-sm">{cat.name}</span>
                          <span className="text-[11px] text-slate-500 block">
                            {linkedProducts.length} صنف / منتج مرتبط
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] shrink-0 font-bold ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'}`}
                      >
                        {isActive ? "نشط بالـ POS" : "متوقف / مخفي"}
                      </Badge>
                    </div>

                    {/* Active/Inactive Toggle Button */}
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Power className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="text-[11px] font-bold text-slate-700">
                          {isActive ? "ظهور في واجهة POS" : "إيقاف ومنع الظهور"}
                        </span>
                      </div>
                      <Switch 
                        checked={isActive} 
                        onCheckedChange={() => handleToggleStatus(cat)}
                        title={isActive ? "انقر لإيقاف القسم ومنع ظهوره في شاشة POS" : "انقر لتفعيل القسم والسماح بظهوره في شاشة POS"}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button 
                        onClick={() => window.location.href = `/products?categoryId=${cat.id}`}
                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 text-[11px]"
                      >
                        <span>أصناف القسم</span>
                        <ArrowRight className="w-3 h-3 rotate-180" />
                      </button>
                      
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => openEdit(cat)} 
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="تعديل هذا القسم"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleRequestDelete(cat)} 
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف هذا القسم مع خيارات التحذير والتراجع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredCategories.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-muted-foreground space-y-2">
                  <Tags className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-bold">لا توجد نتائج مطابقة للتصفية</p>
                  <p className="text-xs">تأكد من شروط البحث أو اضغط على إضافة تصنيف جديد</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Undo Banner (التراجع عن الحذف لمدة معينة) */}
      {undoBanner && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-lg w-full mx-4">
          <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
            <RotateCcw className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm flex items-center gap-2">
              <span>تم حذف قسم "{undoBanner.name}"</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-bold">
                {undoBanner.secondsLeft} ثانية
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              يمكنك التراجع الآن واستعادة القسم بجميع ارتباطاته فوراً
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleRestore(undoBanner.id, undoBanner.name)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-8 px-3.5 gap-1.5 shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              تراجع عن الحذف
            </Button>
            <button
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current);
                setUndoBanner(null);
              }}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Impact & Consequence Warning Modal before Category Deletion */}
      <Dialog open={impactModalOpen} onOpenChange={setImpactModalOpen}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <DialogTitle className="text-lg font-black text-slate-900">
                تحذير مهم قبل حذف قسم: "{targetCategoryForDelete?.name}"
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              فحص الارتباطات والتأثيرات الناتجة عن حذف هذا القسم من قاعدة البيانات
            </DialogDescription>
          </DialogHeader>

          {isImpactLoading ? (
            <div className="py-8 text-center text-slate-500 text-sm">جاري فحص ارتباطات القسم والمنتجات...</div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Linked items breakdown */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>الارتباطات الحالية في النظام لهذا القسم:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-amber-200">
                    <span className="text-slate-500 block text-[11px]">الأصناف والمنتجات المرتبطة:</span>
                    <span className="font-black text-amber-800 text-base">{impactData?.linkedProductsCount || 0} صنف</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-amber-200">
                    <span className="text-slate-500 block text-[11px]">فواتير المبيعات السابقة:</span>
                    <span className="font-black text-amber-800 text-base">{impactData?.ordersCount || 0} فاتورة</span>
                  </div>
                </div>

                {impactData?.linkedProductsSample && impactData.linkedProductsSample.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] text-slate-600 font-bold block mb-1">عينات من الأصناف التابعة لهذا القسم:</span>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {impactData.linkedProductsSample.slice(0, 6).map((p: any) => (
                        <span key={p.id} className="text-[10px] bg-white border border-amber-200 text-slate-700 px-2 py-0.5 rounded">
                          {p.name}
                        </span>
                      ))}
                      {impactData.linkedProductsCount > 6 && (
                        <span className="text-[10px] text-slate-500 px-1 py-0.5">
                          + {impactData.linkedProductsCount - 6} صنف آخر
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Consequences Explanation */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-xs text-rose-900 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>الآثار والنتائج المحتملة لحذف القسم:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800/90 pr-1">
                  <li>سيتم نقل القسم لسلة المحذوفات وإخفاؤه تماماً من واجهات الكاشير والـ POS.</li>
                  <li>الأصناف التابعة لهذا القسم قد تفقد تصنيفها السريع في شاشة الكاشير.</li>
                  <li>يتم تسجيل عملية الحذف وحساب المستخدم وتاريخ العملية بالكامل في سجل الرقابة والتدقيق (Audit Log).</li>
                  <li>يمكنك التراجع عن الحذف في أي وقت من خلال سلة المحذوفات.</li>
                </ul>
              </div>

              {/* Recommended Safe Alternative */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 space-y-1.5 text-xs text-emerald-900">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>الحل الآمن الموصى به بدلاً من الحذف:</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  نوصي بالضغط على زر <strong>إيقاف القسم فقط</strong>، حيث يمنع ظهوره في شاشة الكاشير POS مع الحفاظ على سلامة المنتجات والتقارير المالية دون أي ضرر.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setImpactModalOpen(false)}
              className="text-xs h-9"
            >
              إلغاء الأمر
            </Button>

            {/* Safe Alternative Action Button */}
            <Button
              onClick={() => {
                if (targetCategoryForDelete) {
                  handleToggleStatus(targetCategoryForDelete);
                  setImpactModalOpen(false);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 gap-1.5"
            >
              <Power className="w-3.5 h-3.5" />
              إيقاف القسم فقط (بديل آمن موصى به)
            </Button>

            {/* Soft Delete with Undo Action Button */}
            <Button
              variant="destructive"
              onClick={executeDelete}
              className="font-bold text-xs h-9 gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف مع إمكانية التراجع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trash Bin Modal (سلة المحذوفات والتراجع) */}
      <Dialog open={showTrashModal} onOpenChange={setShowTrashModal}>
        <DialogContent dir="rtl" className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              <DialogTitle className="text-base font-black text-slate-800">
                سلة المحذوفات وسجل الأقسام المحذوفة مع إمكانية التراجع
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              قائمة بالأقسام التي تم حذفها مؤقتاً، مع تفاصيل حساب المستخدم وتاريخ الحذف وخيار الاستعادة الفورية.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {isLoadingTrash ? (
              <div className="text-center py-8 text-xs text-slate-500">جاري تحميل سجل المحذوفات...</div>
            ) : trashCategories.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 space-y-1">
                <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500" />
                <p className="font-bold text-xs text-slate-700">سلة المحذوفات فارغة تماماً</p>
                <p className="text-[11px] text-slate-400">لا توجد أقسام أو تصنيفات محذوفة في الوقت الحالي</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">اسم القسم</th>
                      <th className="p-2.5">تاريخ الحذف</th>
                      <th className="p-2.5">حساب المستخدم الذي حذف</th>
                      <th className="p-2.5 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trashCategories.map(cat => (
                      <tr key={cat.id} className="hover:bg-slate-50/80">
                        <td className="p-2.5 font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#f59e0b' }} />
                          <span>{cat.name}</span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-500">
                          {cat.deleted_at ? new Date(cat.deleted_at).toLocaleString("ar-SA") : "غير محدد"}
                        </td>
                        <td className="p-2.5">
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-normal text-[10px]">
                            {cat.deleted_by_user_name || "مستخدم النظام"}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-center">
                          <Button
                            size="sm"
                            onClick={() => handleRestore(cat.id, cat.name)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-7 px-3 gap-1 shadow-xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            استعادة القسم
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrashModal(false)} className="text-xs h-9">
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog for Category Add / Edit */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="w-5 h-5 text-amber-500" />
              {editing ? "تعديل التصنيف أو القسم" : "إضافة تصنيف أو قسم جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">اسم التصنيف أو القسم *</label>
              <Input 
                placeholder="مثال: وجبات سريعة، مشروبات ساخنة، مقبلات، مواد تموينية..." 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                className="h-10 text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">لون تمييز القسم (لشاشة الكاشير والطباعة)</label>
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <input 
                  type="color" 
                  value={form.color ?? "#f59e0b"} 
                  onChange={e => setForm({ ...form, color: e.target.value })} 
                  className="w-10 h-10 rounded cursor-pointer border border-border shrink-0" 
                />
                <div className="text-xs">
                  <span className="font-mono font-bold text-slate-800">{form.color}</span>
                  <p className="text-[11px] text-slate-500">يظهر هذا اللون كشريط تمييز لمنتجات القسم في شاشة POS</p>
                </div>
              </div>
            </div>

            {/* Active toggle inside form */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-slate-800">حالة القسم (الظهور في كاشير POS)</label>
                <p className="text-[11px] text-slate-500">عند إلغاء التفعيل يتم إخفاء القسم ومنتجاته من شاشة نقطة البيع</p>
              </div>
              <Switch
                checked={form.is_active !== false}
                onCheckedChange={checked => setForm({ ...form, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            >
              {createMutation.isPending || updateMutation.isPending ? "جاري الحفظ..." : "حفظ القسم"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
