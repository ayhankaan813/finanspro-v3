"use client";

import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    X,
    Search,
    Filter,
    Calendar as CalendarIcon,
    Check,
    ChevronDown,
    ArrowRightLeft,
    Building2,
    Users,
    Wallet,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Types for props
interface TransactionFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    data: {
        sites: any[];
        partners: any[];
        financiers: any[];
    };
}

export interface FilterState {
    search: string;
    type: string;
    status: string;
    site_id: string;
    partner_id: string;
    financier_id: string;
    min_amount: string;
    max_amount: string;
    start_date: string;
    end_date: string;
}

export const INITIAL_FILTERS: FilterState = {
    search: "",
    type: "",
    status: "",
    site_id: "",
    partner_id: "",
    financier_id: "",
    min_amount: "",
    max_amount: "",
    start_date: "",
    end_date: "",
};

// Helper Component for Searchable Select (Combobox equivalent)
function SearchableSelect({
    value,
    onChange,
    options,
    placeholder,
    icon: Icon
}: {
    value: string;
    onChange: (val: string) => void;
    options: { id: string; name: string; code?: string; group?: string }[];
    placeholder: string;
    icon?: any;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredOptions = useMemo(() => {
        let filtered = options;
        if (search) {
            filtered = options.filter(opt =>
                opt.name.toLowerCase().includes(search.toLowerCase()) ||
                (opt.code && opt.code.toLowerCase().includes(search.toLowerCase()))
            );
        }

        // Group logic
        const grouped: Record<string, typeof options> = {};
        const noGroup: typeof options = [];

        filtered.forEach(opt => {
            if (opt.group) {
                if (!grouped[opt.group]) grouped[opt.group] = [];
                grouped[opt.group].push(opt);
            } else {
                noGroup.push(opt);
            }
        });

        return { grouped, noGroup, hasGroups: Object.keys(grouped).length > 0 };
    }, [options, search]);

    const selectedLabel = options.find(o => o.id === value)?.name;

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-11 bg-white border-twilight-200 hover:bg-twilight-50 text-twilight-700 font-normal"
                >
                    <div className="flex items-center gap-2 truncate">
                        {Icon && <Icon className="h-4 w-4 text-twilight-400 shrink-0" />}
                        <span className={cn("truncate", !value && "text-twilight-400")}>
                            {selectedLabel || placeholder}
                        </span>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="p-2 border-b border-twilight-100">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-twilight-400" />
                        <Input
                            placeholder="Ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 pl-8 text-xs border-twilight-200 focus-visible:ring-1 bg-twilight-50/50"
                        />
                    </div>
                </div>
                <ScrollArea className="h-[300px] p-1">
                    {filteredOptions.noGroup.length === 0 && Object.keys(filteredOptions.grouped).length === 0 ? (
                        <div className="py-6 text-center text-xs text-twilight-400">Sonuç bulunamadı.</div>
                    ) : (
                        <>
                            {filteredOptions.noGroup.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => {
                                        onChange(option.id === value ? "" : option.id);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer text-sm transition-colors",
                                        value === option.id ? "bg-twilight-100 text-twilight-900 font-medium" : "hover:bg-twilight-50 text-twilight-700"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{option.name}</span>
                                        {option.code && <span className="text-[10px] text-twilight-400 bg-twilight-100 px-1.5 py-0.5 rounded ml-1">{option.code}</span>}
                                    </div>
                                    {value === option.id && <Check className="h-3.5 w-3.5 text-twilight-600" />}
                                </div>
                            ))}

                            {Object.entries(filteredOptions.grouped).map(([group, groupOptions]) => (
                                <div key={group}>
                                    <div className="px-2 py-1.5 text-[10px] font-bold text-twilight-400 uppercase tracking-wider mt-2 first:mt-0 border-b border-twilight-50 mb-1">
                                        {group}
                                    </div>
                                    {groupOptions.map((option) => (
                                        <div
                                            key={option.id}
                                            onClick={() => {
                                                onChange(option.id === value ? "" : option.id);
                                                setOpen(false);
                                            }}
                                            className={cn(
                                                "flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer text-sm transition-colors ml-1",
                                                value === option.id ? "bg-twilight-100 text-twilight-900 font-medium" : "hover:bg-twilight-50 text-twilight-700"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{option.name}</span>
                                                {option.code && <span className="text-[10px] text-twilight-400 bg-twilight-100 px-1.5 py-0.5 rounded ml-1">{option.code}</span>}
                                            </div>
                                            {value === option.id && <Check className="h-3.5 w-3.5 text-twilight-600" />}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

export function TransactionFilters({ isOpen, onClose, filters, setFilters, data }: TransactionFiltersProps) {
    const activeCount = Object.values(filters).filter(Boolean).length - (filters.search ? 1 : 0); // Subtract search from count if present

    const handleClear = () => {
        setFilters({ ...INITIAL_FILTERS, search: filters.search }); // Keep search term
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:w-[400px] md:w-[450px] overflow-y-auto p-0 flex flex-col bg-white">
                <SheetHeader className="px-6 py-5 border-b border-twilight-100 bg-twilight-50/50">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg font-bold text-twilight-900 flex items-center gap-2">
                            <Filter className="h-5 w-5 text-twilight-500" />
                            Gelişmiş Filtreleme
                        </SheetTitle>
                        {activeCount > 0 && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0">
                                {activeCount} Aktif
                            </Badge>
                        )}
                    </div>
                    <SheetDescription className="text-twilight-500">
                        İşlemleri detaylı filtreleyerek aradığınızı bulun.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 p-6 space-y-8">
                    {/* Transaction Type Section */}
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-twilight-500 uppercase tracking-wider">İşlem Türü</Label>
                        <SearchableSelect
                            value={filters.type}
                            onChange={(v) => setFilters({ ...filters, type: v })}
                            options={[
                                // Ana İşlemler
                                { id: "DEPOSIT", name: "Yatırım", group: "Ana İşlemler" },
                                { id: "WITHDRAWAL", name: "Çekim", group: "Ana İşlemler" },
                                { id: "DELIVERY", name: "Teslimat", group: "Ana İşlemler" },
                                { id: "TOP_UP", name: "Takviye", group: "Ana İşlemler" },
                                // Ödeme & Borç
                                { id: "PAYMENT", name: "Genel Ödeme", group: "Ödeme & Borç" },
                                { id: "PARTNER_PAYMENT", name: "Partner Ödemesi", group: "Ödeme & Borç" },
                                { id: "EXTERNAL_DEBT_IN", name: "Dış Borç Al (Borç)", group: "Ödeme & Borç" },
                                { id: "EXTERNAL_DEBT_OUT", name: "Dış Borç Ver (Alacak)", group: "Ödeme & Borç" },
                                { id: "EXTERNAL_PAYMENT", name: "Borç Kapama / Dış Ödeme", group: "Ödeme & Borç" },
                                // Organizasyon
                                { id: "ORG_EXPENSE", name: "Organizasyon Gideri", group: "Organizasyon" },
                                { id: "ORG_INCOME", name: "Organizasyon Geliri", group: "Organizasyon" },
                                { id: "ORG_WITHDRAW", name: "Hak Ediş Çekimi", group: "Organizasyon" },
                                { id: "FINANCIER_TRANSFER", name: "Kasa Transferi", group: "Organizasyon" },
                            ]}
                            placeholder="İşlem Türü Seçiniz"
                            icon={ArrowRightLeft}
                        />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-twilight-500 uppercase tracking-wider">İşlem Durumu</Label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: "COMPLETED", label: "Tamamlandı", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
                                { value: "PENDING", label: "Beklemede", color: "bg-amber-100 text-amber-700 border-amber-200" },
                                { value: "FAILED", label: "Başarısız", color: "bg-gray-100 text-gray-700 border-gray-200" },
                                { value: "REVERSED", label: "İptal Edildi", color: "bg-rose-100 text-rose-700 border-rose-200" },
                            ].map((status) => (
                                <button
                                    key={status.value}
                                    onClick={() => setFilters({ ...filters, status: filters.status === status.value ? "" : status.value })}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                        filters.status === status.value
                                            ? "bg-twilight-900 text-white border-twilight-900 shadow-md transform scale-105"
                                            : "bg-white border-twilight-200 text-twilight-600 hover:border-twilight-300 hover:bg-twilight-50"
                                    )}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range Section */}
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-twilight-500 uppercase tracking-wider">Tarih Aralığı</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-twilight-400">Başlangıç</Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-twilight-400" />
                                    <Input
                                        type="date"
                                        value={filters.start_date}
                                        onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                        className="pl-9 h-10 text-xs bg-white border-twilight-200"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-twilight-400">Bitiş</Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-twilight-400" />
                                    <Input
                                        type="date"
                                        value={filters.end_date}
                                        onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                        className="pl-9 h-10 text-xs bg-white border-twilight-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Amount Range */}
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-twilight-500 uppercase tracking-wider">Tutar Aralığı</Label>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-twilight-400 font-bold">₺</span>
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.min_amount}
                                    onChange={(e) => setFilters({ ...filters, min_amount: e.target.value })}
                                    className="pl-7 h-10 text-xs bg-white border-twilight-200"
                                />
                            </div>
                            <span className="text-twilight-400">-</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-twilight-400 font-bold">₺</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.max_amount}
                                    onChange={(e) => setFilters({ ...filters, max_amount: e.target.value })}
                                    className="pl-7 h-10 text-xs bg-white border-twilight-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Site & Partner & Financier */}
                    <div className="space-y-4 pt-4 border-t border-twilight-100">
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-twilight-500 uppercase tracking-wider">İlişkili Kayıtlar</Label>

                            <div className="space-y-4">
                                <SearchableSelect
                                    value={filters.site_id}
                                    onChange={(v) => setFilters({ ...filters, site_id: v })}
                                    options={data.sites}
                                    placeholder="Site Seçiniz"
                                    icon={Building2}
                                />

                                <SearchableSelect
                                    value={filters.partner_id}
                                    onChange={(v) => setFilters({ ...filters, partner_id: v })}
                                    options={data.partners}
                                    placeholder="Partner Seçiniz"
                                    icon={Users}
                                />

                                <SearchableSelect
                                    value={filters.financier_id}
                                    onChange={(v) => setFilters({ ...filters, financier_id: v })}
                                    options={data.financiers}
                                    placeholder="Finansör (Kasa) Seçiniz"
                                    icon={Wallet}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-6 border-t border-twilight-100 bg-twilight-50/30 gap-3 sm:gap-3">
                    <Button
                        variant="outline"
                        onClick={handleClear}
                        className="flex-1 h-12 rounded-xl border-twilight-200 hover:bg-white hover:text-rose-600 hover:border-rose-200 transition-colors"
                    >
                        Temizle
                    </Button>
                    <SheetClose asChild>
                        <Button className="flex-[2] h-12 rounded-xl bg-twilight-900 hover:bg-twilight-800 text-white shadow-lg shadow-twilight-900/10">
                            Uygula ve Göster
                        </Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
