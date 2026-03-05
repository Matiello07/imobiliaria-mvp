"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import {
    Save,
    Image as ImageIcon,
    Home,
    Loader2,
    FileText,
    DollarSign,
    ShieldAlert,
    Star,
    Bold,
    List,
    Type,
    Undo,
    AlertCircle,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

// Module Imports
import { ImageUpload } from "@/components/ImageUpload";
import { FeatureSelector } from "@/components/admin/FeatureSelector";
import { LocationSection } from "./property/LocationSection";
import { useDraftStorage } from "./property/useDraftStorage";
import { PropertyFormData } from "./property/types";

// Constants
import {
    PROPERTY_TYPES_CATEGORIZED,
    FINALIDADES,
    TIPOS_CONTRATO,
    STATUS_MERCADO,
    TIPOS_VALOR,
    CONDICAO_IMOVEL,
    PERIODICIDADE,
} from "@/lib/constants";

// --- HELPERS ---

const formatCurrency = (value: string | number): string => {
    if (!value) return "";
    const valStr = value.toString();
    return valStr.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseCurrency = (value: string | number): number => {
    if (!value) return 0;

    const cleaned = value
        .toString()
        .replace(/[^\d,.-]/g, "") // remove R$, espaços etc
        .replace(/\./g, "")       // remove separador milhar
        .replace(",", ".");       // converte decimal

    return parseFloat(cleaned) || 0;
};

// --- TYPES ---

interface PropertyFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: (data: any) => Promise<void>;
    loading: boolean;
    submitLabel?: string;
    userRole?: string;
}

// --- MAIN COMPONENT ---

export function PropertyForm({
    initialData,
    onSubmit,
    loading,
    submitLabel = "Publicar Imóvel",
    userRole = "CORRETOR",
}: PropertyFormProps) {
    const isAdmin = userRole === "ADMIN";
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    // Initial State Setup with explicit String conversion to fix Type Errors
    const [formData, setFormData] = useState<PropertyFormData>({
        titulo: initialData?.titulo || "",
        sobreTitulo: initialData?.sobreTitulo || "",
        descricao: initialData?.descricao || "",
        tipo: initialData?.tipo || "Casa",
        finalidade: initialData?.finalidade || "Venda",

        // Formatting currency fields safely
        preco: initialData?.preco ? formatCurrency(initialData.preco) : "",
        precoLocacao: initialData?.precoLocacao ? formatCurrency(initialData.precoLocacao) : "",
        tipoValor: initialData?.tipoValor || "Preço fixo",
        valorCondominio: initialData?.valorCondominio ? formatCurrency(initialData.valorCondominio) : "",
        periodicidadeCondominio: initialData?.periodicidadeCondominio || "Mensal",
        depositoSeguranca: initialData?.depositoSeguranca ? formatCurrency(initialData.depositoSeguranca) : "",
        periodoPagamento: initialData?.periodoPagamento || "Mensal",

        tipoContrato: initialData?.tipoContrato || "Sem Exclusividade",

        // Numeric fields as strings for inputs
        quarto: initialData?.quarto?.toString() || "",
        suites: initialData?.suites?.toString() || "",
        banheiro: initialData?.banheiro?.toString() || "",
        garagem: initialData?.garagem?.toString() || "0",
        vagasCobertas: initialData?.vagasCobertas?.toString() || "",
        vagasDescobertas: initialData?.vagasDescobertas?.toString() || "",
        vagasSubsolo: !!initialData?.vagasSubsolo,
        area: initialData?.area?.toString() || "",
        areaTerreno: initialData?.areaTerreno?.toString() || "",
        anoConstrucao: initialData?.anoConstrucao?.toString() || "",

        statusMercado: initialData?.statusMercado || "Padrão",
        condicaoImovel: initialData?.condicaoImovel || "Em ótimas condições",

        // Fixing the 'split on never' error by ensuring string type safely
        fotos: initialData?.fotos
            ? Array.isArray(initialData.fotos)
                ? initialData.fotos
                : String(initialData.fotos).split(";")
            : [],

        // Fixing features similarly
        features: initialData?.features
            ? Array.isArray(initialData.features)
                ? initialData.features
                : String(initialData.features).split(",")
            : [],

        cep: initialData?.cep || "",
        cidade: initialData?.cidade || "",
        bairro: initialData?.bairro || "",
        endereco: initialData?.endereco || "",

        // Ensuring numbers for coordinates
        latitude: initialData?.latitude ? Number(initialData.latitude) : null,
        longitude: initialData?.longitude ? Number(initialData.longitude) : null,

        locationMode: initialData?.locationMode || "map",
        displayAddress: initialData?.displayAddress ?? true,
        displayDetails: initialData?.displayDetails ?? true,
        status: initialData?.status || "PENDENTE",
        destaque: !!initialData?.destaque,
    });

    // Derived State (Memoized)
    const isLand = useMemo(() => formData.tipo.includes("Terreno"), [formData.tipo]);
    const isRent = useMemo(() => formData.finalidade === "Locação", [formData.finalidade]);
    const isDual = useMemo(() => formData.finalidade === "Venda e Locação", [formData.finalidade]);
    const showRentFields = isRent || isDual;

    // Custom Hook: Draft Storage
    const { restoredFromDraft, clearDraft } = useDraftStorage(initialData, formData, setFormData);

    // --- HANDLERS (Memoized) ---

    const handleChange = useCallback((
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    }, []);

    const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: formatCurrency(value) }));
    }, []);

    const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value;
        const newIsLand = newType.includes("Terreno");

        if (newIsLand) {
            const confirmed = window.confirm(
                "Ao mudar para TERRENO, todos os dados de construção (quartos, banheiros, área construída etc.) serão removidos. Deseja continuar?"
            );

            if (!confirmed) return;

            setFormData((prev) => ({
                ...prev,
                tipo: newType,
                quarto: "",
                suites: "",
                banheiro: "",
                garagem: "0",
                vagasCobertas: "",
                vagasDescobertas: "",
                vagasSubsolo: false,
                area: "",
                anoConstrucao: "",
                condicaoImovel: "",
            }));
            toast.success("Modo terreno ativado.", { icon: "🏗️" });
        } else {
            setFormData((prev) => ({ ...prev, tipo: newType }));
        }
    }, []);

    const insertTag = useCallback((tag: "bold" | "list" | "title") => {
        const textarea = descriptionRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.descricao;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const selection = text.substring(start, end);

        let newText = "";
        if (tag === "bold") newText = `${before}**${selection || "texto em negrito"}**${after}`;
        if (tag === "list") newText = `${before}\n- ${selection || "item da lista"}${after}`;
        if (tag === "title") newText = `${before}### ${selection || "Título"}${after}`;

        setFormData((prev) => ({ ...prev, descricao: newText }));

        // Restore focus
        requestAnimationFrame(() => {
            textarea.focus();
            const newCursorPos = start + newText.length - text.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        });
    }, [formData.descricao]);

    const isValidCoordinate = (lat: unknown, lng: unknown): boolean => {
        const latNum = Number(lat);
        const lngNum = Number(lng);

        if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return false;

        if (latNum < -90 || latNum > 90) return false;
        if (lngNum < -180 || lngNum > 180) return false;

        return true;
    };

    const handleSubmitInternal = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fotos || formData.fotos.length === 0) {
            toast.error("Adicione pelo menos uma foto para o anúncio.");
            return;
        }
        if (formData.locationMode === "map") {
            if (!isValidCoordinate(formData.latitude, formData.longitude)) {
                toast.error(
                    "Coordenadas inválidas. Latitude deve ser entre -90 e 90 e longitude entre -180 e 180."
                );
                return;
            }
        }

        const vagasCalc = (Number(formData.vagasCobertas) || 0) + (Number(formData.vagasDescobertas) || 0);
        const finalGaragem = isLand
            ? "0"
            : Number(formData.garagem) > 0
                ? formData.garagem
                : vagasCalc.toString();

        // Prepare payload safely converting strings back to numbers and handling missing terrain fields
        const payload = {
            ...formData,
            preco: parseCurrency(formData.preco),
            precoLocacao: parseCurrency(formData.precoLocacao),
            valorCondominio: parseCurrency(formData.valorCondominio),
            depositoSeguranca: parseCurrency(formData.depositoSeguranca),
            garagem: finalGaragem,
            
            // Clear invalid fields for land explicitly to avoid 400 Bad Request
            area: isLand ? "0" : (formData.area || "0"),
            quarto: isLand ? "0" : (formData.quarto || "0"),
            banheiro: isLand ? "0" : (formData.banheiro || "0"),
            suites: isLand ? "0" : (formData.suites || "0"),
            vagasCobertas: isLand ? "0" : (formData.vagasCobertas || "0"),
            vagasDescobertas: isLand ? "0" : (formData.vagasDescobertas || "0"),
            anoConstrucao: isLand ? "0" : (formData.anoConstrucao || "0"),
            condicaoImovel: isLand ? "" : (formData.condicaoImovel || ""),
            
            latitude: formData.locationMode === "none" ? null : formData.latitude,
            longitude: formData.locationMode === "none" ? null : formData.longitude,
        };

        try {
            await onSubmit(payload);
            if (!initialData) clearDraft();
        } catch (error) {
            console.error("Error submitting:", error);
            toast.error("Erro ao salvar imóvel. Tente novamente.");
        }
    }, [formData, isLand, onSubmit, initialData, clearDraft]);

    return (
        <>
            <Toaster position="top-right" />
            <form onSubmit={handleSubmitInternal} className="space-y-8">

                {restoredFromDraft && (
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-blue-200 animate-in fade-in slide-in-from-top-2">
                        <Undo size={16} />
                        Você está editando um rascunho restaurado.
                        <button
                            type="button"
                            onClick={() => {
                                clearDraft();
                                window.location.reload();
                            }}
                            className="underline font-bold hover:text-blue-900"
                        >
                            Descartar
                        </button>
                    </div>
                )}

                {isAdmin && (
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl shadow-sm border border-red-100 dark:border-red-900 overflow-hidden mb-8">
                        <div className="px-6 py-4 border-b border-red-100 dark:border-red-900 flex items-center gap-2">
                            <ShieldAlert className="text-red-600 dark:text-red-400" size={24} />
                            <h2 className="font-bold text-red-800 dark:text-red-200 text-lg">Área Administrativa</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-red-800 dark:text-red-300 mb-1.5">
                                    Status do Imóvel
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full p-3 border-2 border-red-100 dark:border-red-900 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="PENDENTE">🕒 Pendente (Oculto)</option>
                                    <option value="DISPONIVEL">✅ Disponível (Visível)</option>
                                    <option value="RESERVADO">🤝 Reservado</option>
                                    <option value="VENDIDO">💰 Vendido</option>
                                </select>
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-yellow-100 dark:border-yellow-900/50 w-full cursor-pointer hover:bg-yellow-50 dark:hover:bg-gray-700 transition shadow-sm">
                                    <input
                                        type="checkbox"
                                        name="destaque"
                                        checked={formData.destaque}
                                        onChange={handleChange}
                                        className="w-6 h-6 text-yellow-500 rounded border-gray-300 focus:ring-yellow-500"
                                    />
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <Star
                                                className={formData.destaque ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}
                                                size={24}
                                            />
                                            <span className="font-bold text-gray-800 dark:text-white">Destaque na Home</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="bg-blue-50/50 dark:bg-gray-700/30 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <FileText className="text-blue-600 dark:text-blue-400" size={20} />
                        <h2 className="font-bold text-gray-800 dark:text-white">1. Dados Gerais & Contrato</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-2 relative">
                            <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                Título do Anúncio *
                            </label>
                            <input
                                required
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleChange}
                                maxLength={100}
                                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Ex: Linda Casa no Centro"
                            />
                            <span className="absolute right-3 top-9 text-xs text-gray-400">
                                {formData.titulo.length}/100
                            </span>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                Tipo do Imóvel *
                            </label>
                            <select
                                name="tipo"
                                value={formData.tipo}
                                onChange={handleTypeChange}
                                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {PROPERTY_TYPES_CATEGORIZED.map((group) => (
                                    <optgroup key={group.label} label={group.label}>
                                        {group.types.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                Finalidade *
                            </label>
                            <select
                                name="finalidade"
                                value={formData.finalidade}
                                onChange={handleChange}
                                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {FINALIDADES.map((f) => (
                                    <option key={f} value={f}>
                                        {f}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                Contrato
                            </label>
                            <select
                                name="tipoContrato"
                                value={formData.tipoContrato}
                                onChange={handleChange}
                                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {TIPOS_CONTRATO.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                Status Mercado
                            </label>
                            <select
                                name="statusMercado"
                                value={formData.statusMercado}
                                onChange={handleChange}
                                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {STATUS_MERCADO.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="bg-green-50/50 dark:bg-green-900/10 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <DollarSign className="text-green-600 dark:text-green-400" size={20} />
                        <h2 className="font-bold text-gray-800 dark:text-white">2. Valores & Custos</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                {isRent ? "Aluguel (R$)" : "Valor Venda (R$)"} *
                            </label>
                            <input
                                required
                                type="text"
                                name="preco"
                                value={formData.preco}
                                onChange={handlePriceChange}
                                placeholder="0.000"
                                className="w-full p-3 border border-green-200 dark:border-green-800 rounded-lg text-lg font-bold bg-white dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        {isDual && (
                            <div className="animate-in fade-in">
                                <label className="block text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1.5">
                                    Valor Aluguel (R$) *
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="precoLocacao"
                                    value={formData.precoLocacao}
                                    onChange={handlePriceChange}
                                    placeholder="0.000"
                                    className="w-full p-3 border border-orange-200 dark:border-orange-800 rounded-lg text-lg font-bold bg-white dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                Tipo de Valor
                            </label>
                            <select
                                name="tipoValor"
                                value={formData.tipoValor}
                                onChange={handleChange}
                                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {TIPOS_VALOR.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <div className="w-2/3">
                                <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                    Condomínio (R$)
                                </label>
                                <input
                                    type="text"
                                    name="valorCondominio"
                                    value={formData.valorCondominio}
                                    onChange={handlePriceChange}
                                    placeholder="0"
                                    className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                    Período
                                </label>
                                <select
                                    name="periodicidadeCondominio"
                                    value={formData.periodicidadeCondominio}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                >
                                    {PERIODICIDADE.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {showRentFields && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                        Pagamento
                                    </label>
                                    <select
                                        name="periodoPagamento"
                                        value={formData.periodoPagamento}
                                        onChange={handleChange}
                                        className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        {PERIODICIDADE.map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                        Depósito (R$)
                                    </label>
                                    <input
                                        type="text"
                                        name="depositoSeguranca"
                                        value={formData.depositoSeguranca}
                                        onChange={handlePriceChange}
                                        placeholder="0"
                                        className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="bg-blue-50/50 dark:bg-gray-700/30 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <Home className="text-blue-600 dark:text-blue-400" size={20} />
                        <h2 className="font-bold text-gray-800 dark:text-white">3. Detalhes Físicos</h2>
                    </div>
                    <div className="p-6">
                        {isLand ? (
                            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
                                <AlertCircle className="text-yellow-600 dark:text-yellow-400 shrink-0" size={20} />
                                <div>
                                    <h3 className="font-bold text-yellow-800 dark:text-yellow-300 text-sm">
                                        Modo Terreno
                                    </h3>
                                    <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-1">
                                        Campos de construção ocultados para este tipo de imóvel. O sistema os enviará como zero automaticamente.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                            Dormitórios
                                        </label>
                                        <input
                                            type="number"
                                            name="quarto"
                                            value={formData.quarto}
                                            onChange={handleChange}
                                            className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                            Suítes
                                        </label>
                                        <input
                                            type="number"
                                            name="suites"
                                            value={formData.suites}
                                            onChange={handleChange}
                                            className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                            Banheiros
                                        </label>
                                        <input
                                            type="number"
                                            name="banheiro"
                                            value={formData.banheiro}
                                            onChange={handleChange}
                                            className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                            Ano Const.
                                        </label>
                                        <input
                                            type="number"
                                            name="anoConstrucao"
                                            value={formData.anoConstrucao}
                                            onChange={handleChange}
                                            className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
                                    <label className="block text-sm font-bold dark:text-gray-300 mb-3">
                                        Vagas de Garagem
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                Cobertas
                                            </label>
                                            <input
                                                type="number"
                                                name="vagasCobertas"
                                                value={formData.vagasCobertas}
                                                onChange={handleChange}
                                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                Descobertas
                                            </label>
                                            <input
                                                type="number"
                                                name="vagasDescobertas"
                                                value={formData.vagasDescobertas}
                                                onChange={handleChange}
                                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                        <div className="pb-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="vagasSubsolo"
                                                    checked={formData.vagasSubsolo}
                                                    onChange={handleChange}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <span className="text-sm dark:text-gray-300">Subsolo?</span>
                                            </label>
                                        </div>
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-center border border-blue-200 dark:border-blue-800">
                                            <span className="text-xs text-blue-800 dark:text-blue-300 block uppercase tracking-wide">
                                                Total
                                            </span>
                                            <span className="font-bold text-xl text-blue-900 dark:text-white">
                                                {(Number(formData.vagasCobertas) || 0) + (Number(formData.vagasDescobertas) || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {!isLand && (
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                        Área Útil (m²) *
                                    </label>
                                    <input
                                        required={!isLand}
                                        type="number"
                                        name="area"
                                        value={formData.area}
                                        onChange={handleChange}
                                        className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            )}
                            <div className={isLand ? "col-span-2" : ""}>
                                <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                    Área Terreno (m²) {isLand && "*"}
                                </label>
                                <input
                                    required={isLand}
                                    type="number"
                                    name="areaTerreno"
                                    value={formData.areaTerreno}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder={isLand ? "Área total do lote" : "Se houver"}
                                />
                            </div>
                            {!isLand && (
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                        Condição
                                    </label>
                                    <select
                                        name="condicaoImovel"
                                        value={formData.condicaoImovel}
                                        onChange={handleChange}
                                        className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        {CONDICAO_IMOVEL.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6">
                        <h2 className="font-bold mb-4 text-gray-800 dark:text-white">4. Sobre & Descrição</h2>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                Título da Seção "Sobre" (Opcional)
                            </label>
                            <input
                                name="sobreTitulo"
                                value={formData.sobreTitulo}
                                onChange={handleChange}
                                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
                                placeholder="Ex: Vista incrível para o mar..."
                            />

                            <label className="block text-sm font-semibold mb-1.5 dark:text-gray-300">
                                Descrição Detalhada *
                            </label>

                            <div className="flex gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => insertTag("bold")}
                                    className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                                    title="Negrito"
                                >
                                    <Bold size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertTag("title")}
                                    className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                                    title="Título"
                                >
                                    <Type size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertTag("list")}
                                    className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                                    title="Lista"
                                >
                                    <List size={16} />
                                </button>
                            </div>

                            <div className="relative">
                                <textarea
                                    ref={descriptionRef}
                                    required
                                    name="descricao"
                                    value={formData.descricao}
                                    rows={8}
                                    onChange={handleChange}
                                    className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base"
                                    placeholder="Descreva os detalhes do imóvel..."
                                />
                                <span className="absolute right-3 bottom-3 text-xs text-gray-400">
                                    {formData.descricao.length} caracteres
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6">
                        <h2 className="font-bold mb-4 text-gray-800 dark:text-white">
                            5. Características & Comodidades
                        </h2>
                        <FeatureSelector
                            selectedFeatures={formData.features}
                            onChange={(newFeatures) => setFormData((prev) => ({ ...prev, features: newFeatures }))}
                        />
                    </div>
                </div>

                <LocationSection
                    formData={formData}
                    setFormData={setFormData}
                    handleChange={handleChange}
                />

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6">
                        <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
                            <ImageIcon size={20} /> 7. Fotos *
                        </h2>
                        <ImageUpload
                            value={formData.fotos}
                            onChange={(urls) => setFormData((prev) => ({ ...prev, fotos: urls }))}
                            onRemove={(url) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    fotos: prev.fotos.filter((current: string) => current !== url),
                                }))
                            }
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 pb-12">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} /> Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={20} /> {submitLabel}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </>
    );
}
