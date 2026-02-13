"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, Check, AlertTriangle, XCircle, ArrowDownToLine, Search } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- Types ---
export interface BulkTransactionRow {
    id: string;
    site: string;
    siteId?: string;
    depositAmount: number;
    depositCount: number;
    withdrawalAmount: number;
    withdrawalCount: number;
    financier: string;
    financierId?: string;
}

interface EditableTransactionGridProps {
    data: BulkTransactionRow[];
    setData: (data: BulkTransactionRow[]) => void;
    errors?: string[];
    sites: { id: string; name: string; code: string; is_active: boolean }[];
    financiers: { id: string; name: string; code: string; is_active: boolean }[];
}

// --- Simple Searchable Dropdown (NO cmdk) ---
function SearchableDropdown({
    value,
    valueId,
    onChange,
    options,
    placeholder = "Seçiniz...",
    error,
    warning
}: {
    value: string;
    valueId?: string;
    onChange: (val: { name: string; id: string }) => void;
    options: { id: string; name: string; code: string; is_active: boolean }[];
    placeholder?: string;
    error?: boolean;
    warning?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const isMatched = !!valueId;
    const matchedOption = options.find(o => o.id === valueId);
    const isActive = matchedOption?.is_active ?? true;

    const filtered = options.filter(o => {
        if (!search) return true;
        const s = search.toLocaleLowerCase("tr");
        return o.name.toLocaleLowerCase("tr").includes(s) || o.code.toLocaleLowerCase("tr").includes(s);
    });

    // Focus search input when popover opens
    useEffect(() => {
        if (open) {
            setSearch("");
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    return (
        <div className="relative w-full h-full group">
            {/* Warning/Error overlay icon */}
            {(warning || !isActive) && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {warning ? (
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                )}
                            </TooltipTrigger>
                            <TooltipContent side="left" className="bg-white text-xs border shadow-lg text-black p-2">
                                <p>{warning || "Bu kayıt pasif durumda!"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full h-9 justify-between rounded-none border-none hover:bg-muted/50 px-2 font-normal text-left text-xs",
                            !value && "text-muted-foreground",
                            error && "bg-red-50 hover:bg-red-100 ring-1 ring-inset ring-red-300",
                            warning && !error && "bg-amber-50 hover:bg-amber-100 ring-1 ring-inset ring-amber-300"
                        )}
                    >
                        <span className={cn("truncate", !isMatched && value && "text-red-600 font-semibold")}>
                            {value || placeholder}
                        </span>
                        <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50 absolute right-1" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                    {/* Search Input */}
                    <div className="flex items-center border-b px-3 py-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            ref={inputRef}
                            placeholder="Ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                    {/* Results List */}
                    <div className="max-h-[250px] overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                                {options.length === 0 ? "Veri yüklenemedi" : "Sonuç bulunamadı."}
                            </div>
                        ) : (
                            filtered.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => {
                                        onChange({ name: option.name, id: option.id });
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                                        valueId === option.id && "bg-accent/50"
                                    )}
                                >
                                    <Check
                                        className={cn(
                                            "h-3 w-3 shrink-0",
                                            valueId === option.id ? "opacity-100 text-primary" : "opacity-0"
                                        )}
                                    />
                                    <div className={cn("flex flex-col min-w-0", !option.is_active && "opacity-50 line-through")}>
                                        <span className="font-medium truncate">{option.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{option.code}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

// --- Bulk Financier Selector in Header ---
function BulkFinancierSelector({
    financiers,
    onSelect,
}: {
    financiers: { id: string; name: string; code: string; is_active: boolean }[];
    onSelect: (f: { name: string; id: string }) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = financiers.filter(f => {
        if (!search) return true;
        const s = search.toLocaleLowerCase("tr");
        return f.name.toLocaleLowerCase("tr").includes(s) || f.code.toLocaleLowerCase("tr").includes(s);
    });

    useEffect(() => {
        if (open) {
            setSearch("");
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-200" title="Tüm satırlara uygula">
                    <ArrowDownToLine className="h-3 w-3 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0" align="end">
                <div className="flex items-center border-b px-3 py-2">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        ref={inputRef}
                        placeholder="Toplu finansör seç..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1">
                    <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tümüne Uygula</div>
                    {filtered.map(f => (
                        <div
                            key={f.id}
                            onClick={() => {
                                onSelect({ name: f.name, id: f.id });
                                setOpen(false);
                            }}
                            className="flex flex-col rounded-sm px-2 py-1.5 text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            <span className="font-medium">{f.name}</span>
                            <span className="text-[10px] text-muted-foreground">{f.code}</span>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="py-4 text-center text-sm text-muted-foreground">Sonuç bulunamadı.</div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

const formatMoneyInput = (val: number) => val === 0 ? "" : val.toLocaleString("tr-TR");
const parseMoney = (val: string): number => {
    if (!val) return 0;
    // Remove dots (thousands separator), replace comma with dot for parseFloat
    const clean = val.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
};

export function EditableTransactionGrid({
    data,
    setData,
    errors = [],
    sites = [],
    financiers = [],
}: EditableTransactionGridProps) {

    const createEmptyRow = (): BulkTransactionRow => ({
        id: Math.random().toString(36).substr(2, 9),
        site: "",
        depositAmount: 0,
        depositCount: 0,
        withdrawalAmount: 0,
        withdrawalCount: 0,
        financier: "",
    });

    useEffect(() => {
        if (data.length === 0) {
            setData(Array(20).fill(null).map(createEmptyRow));
        }
    }, []);

    const updateRow = (index: number, field: keyof BulkTransactionRow, value: any) => {
        const newData = [...data];
        newData[index] = { ...newData[index], [field]: value };
        setData(newData);
    };

    const updateRowMultiple = (index: number, updates: Partial<BulkTransactionRow>) => {
        const newData = [...data];
        newData[index] = { ...newData[index], ...updates };
        setData(newData);
    };

    const addRow = () => {
        setData([...data, createEmptyRow()]);
    };

    const removeRow = (index: number) => {
        const newData = data.filter((_, i) => i !== index);
        setData(newData);
    };

    // --- Apply Financier to ALL rows ---
    const applyFinancierToAll = (f: { name: string; id: string }) => {
        const newData = data.map(row => ({
            ...row,
            financier: f.name,
            financierId: f.id
        }));
        setData(newData);
    };

    // --- PASTE LOGIC ---
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        const pasteData = e.clipboardData.getData("text");
        if (!pasteData) return;

        if (!pasteData.includes("\t") && !pasteData.includes("\n")) return;

        e.preventDefault();

        const rows = pasteData.split(/\r\n|\n|\r/).filter((r) => r.trim());
        if (rows.length === 0) return;

        const newRows: BulkTransactionRow[] = rows.map((rowStr) => {
            const cols = rowStr.split("\t");

            const siteRaw = cols[0]?.trim();
            const depAmtRaw = cols[1]?.trim();
            const depCntRaw = cols[2]?.trim();
            const wdAmtRaw = cols[3]?.trim();
            const wdCntRaw = cols[4]?.trim();
            const finRaw = cols[5]?.trim();

            const parseAmount = (val?: string) => {
                if (!val) return 0;
                let clean = val.replace(/[^0-9,.-]/g, "");
                if (clean.includes(",") && clean.includes(".")) {
                    if (clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
                        clean = clean.replace(/\./g, "").replace(",", ".");
                    } else {
                        clean = clean.replace(/,/g, "");
                    }
                } else if (clean.includes(",")) {
                    clean = clean.replace(",", ".");
                }
                const num = parseFloat(clean);
                return isNaN(num) ? 0 : num;
            };

            const parseCount = (val?: string) => {
                if (!val) return 0;
                return parseInt(val.replace(/[^0-9]/g, "")) || 0;
            };

            let siteId = undefined;
            let siteName = siteRaw || "";

            if (siteRaw && sites.length > 0) {
                const search = siteRaw.toLowerCase();
                let extractedCode = "";
                const parenMatch = siteRaw.match(/\(([^)]+)\)/);
                if (parenMatch) {
                    extractedCode = parenMatch[1].toLowerCase();
                }

                let match = sites.find(s => s.code.toLowerCase() === search || (extractedCode && s.code.toLowerCase() === extractedCode));
                if (!match) {
                    match = sites.find(s => s.name.toLowerCase() === search);
                }
                if (!match) {
                    match = sites.find(s => search.includes(s.name.toLowerCase()));
                }

                if (match) {
                    siteId = match.id;
                    siteName = match.name;
                }
            }

            let finId = undefined;
            let finName = finRaw || "";
            if (finRaw && financiers.length > 0) {
                const search = finRaw.toLowerCase();
                const match = financiers.find(f => f.name.toLowerCase().includes(search) || f.code.toLowerCase().includes(search));
                if (match) {
                    finId = match.id;
                    finName = match.name;
                }
            }

            return {
                id: Math.random().toString(36).substr(2, 9),
                site: siteName,
                siteId,
                depositAmount: parseAmount(depAmtRaw),
                depositCount: parseCount(depCntRaw),
                withdrawalAmount: parseAmount(wdAmtRaw),
                withdrawalCount: parseCount(wdCntRaw),
                financier: finName,
                financierId: finId,
            };
        });

        // Replace data with only pasted rows (no extra empty rows)
        setData(newRows);
    }, [data, setData, sites, financiers]);

    return (
        <div className="border rounded-md shadow-sm overflow-hidden bg-white" onPaste={handlePaste}>
            <div className="max-h-[70vh] overflow-auto relative">
                <Table className="border-collapse w-full table-fixed">
                    <TableHeader className="bg-gray-100 sticky top-0 z-20 shadow-sm">
                        <TableRow>
                            <TableHead className="w-[40px] text-center border-r bg-gray-100 text-xs px-1">#</TableHead>
                            <TableHead className="w-[200px] border-r bg-gray-100">Site</TableHead>

                            <TableHead className="w-[120px] border-r bg-emerald-50 text-emerald-700 font-semibold">Yatırım (₺)</TableHead>
                            <TableHead className="w-[80px] border-r bg-emerald-50 text-emerald-700 font-semibold text-center">Adet</TableHead>

                            <TableHead className="w-[120px] border-r bg-rose-50 text-rose-700 font-semibold">Çekim (₺)</TableHead>
                            <TableHead className="w-[80px] border-r bg-rose-50 text-rose-700 font-semibold text-center">Adet</TableHead>

                            <TableHead className="w-[200px] border-r bg-gray-100">
                                <div className="flex items-center justify-between px-2">
                                    <span>Finansör</span>
                                    <BulkFinancierSelector
                                        financiers={financiers}
                                        onSelect={applyFinancierToAll}
                                    />
                                </div>
                            </TableHead>
                            <TableHead className="w-[40px] bg-gray-100"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, index) => {
                            const rowErrorStr = errors.find(e => e.startsWith(`Satır ${index + 1}:`));
                            const unmatchedSite = row.site && !row.siteId;
                            const unmatchedFinancier = row.financier && !row.financierId;

                            return (
                                <TableRow key={row.id} className="h-9 hover:bg-muted/30 p-0 text-xs group">
                                    <TableCell className="p-0 text-center text-muted-foreground bg-muted/20 border-r font-mono text-[10px] select-none align-middle">
                                        {index + 1}
                                    </TableCell>

                                    {/* Site */}
                                    <TableCell className="p-0 border-r align-top">
                                        <SearchableDropdown
                                            value={row.site}
                                            valueId={row.siteId}
                                            options={sites}
                                            onChange={(val) => {
                                                updateRowMultiple(index, { site: val.name, siteId: val.id });
                                            }}
                                            error={!!rowErrorStr && rowErrorStr.includes("Site")}
                                            warning={unmatchedSite ? "Eşleşmeyen site! Lütfen listeden seçin." : undefined}
                                            placeholder="Site Seç"
                                        />
                                    </TableCell>

                                    {/* Deposit Amount */}
                                    <TableCell className="p-0 border-r align-top">
                                        <Input
                                            type="text"
                                            value={formatMoneyInput(row.depositAmount)}
                                            onChange={(e) => updateRow(index, "depositAmount", parseMoney(e.target.value))}
                                            className="border-none shadow-none rounded-none h-9 px-2 focus-visible:ring-0 text-right font-mono text-emerald-700 font-medium"
                                            placeholder="0"
                                        />
                                    </TableCell>

                                    {/* Deposit Count */}
                                    <TableCell className="p-0 border-r align-top">
                                        <Input
                                            type="text"
                                            value={formatMoneyInput(row.depositCount)}
                                            onChange={(e) => updateRow(index, "depositCount", parseMoney(e.target.value))}
                                            className="border-none shadow-none rounded-none h-9 px-2 focus-visible:ring-0 text-center text-emerald-600"
                                            placeholder="0"
                                        />
                                    </TableCell>

                                    {/* Withdrawal Amount */}
                                    <TableCell className="p-0 border-r align-top">
                                        <Input
                                            type="text"
                                            value={formatMoneyInput(row.withdrawalAmount)}
                                            onChange={(e) => updateRow(index, "withdrawalAmount", parseMoney(e.target.value))}
                                            className="border-none shadow-none rounded-none h-9 px-2 focus-visible:ring-0 text-right font-mono text-rose-700 font-medium"
                                            placeholder="0"
                                        />
                                    </TableCell>

                                    {/* Withdrawal Count */}
                                    <TableCell className="p-0 border-r align-top">
                                        <Input
                                            type="text"
                                            value={formatMoneyInput(row.withdrawalCount)}
                                            onChange={(e) => updateRow(index, "withdrawalCount", parseMoney(e.target.value))}
                                            className="border-none shadow-none rounded-none h-9 px-2 focus-visible:ring-0 text-center text-rose-600"
                                            placeholder="0"
                                        />
                                    </TableCell>

                                    {/* Financier */}
                                    <TableCell className="p-0 border-r align-top">
                                        <SearchableDropdown
                                            value={row.financier}
                                            valueId={row.financierId}
                                            options={financiers}
                                            onChange={(val) => {
                                                updateRowMultiple(index, { financier: val.name, financierId: val.id });
                                            }}
                                            error={!!rowErrorStr && rowErrorStr.includes("Finansör")}
                                            warning={unmatchedFinancier ? "Eşleşmeyen finansör!" : undefined}
                                            placeholder="Finansör Seç"
                                        />
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="p-0 text-center align-middle">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeRow(index)}
                                            className="h-6 w-6 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                <div className="p-2 border-t bg-muted/10">
                    <Button variant="ghost" size="sm" onClick={addRow} className="w-full text-xs text-muted-foreground hover:text-primary border border-dashed border-muted-foreground/30 h-8">
                        <Plus className="h-3 w-3 mr-2" /> Satır Ekle
                    </Button>
                </div>
            </div>
        </div>
    );
}
