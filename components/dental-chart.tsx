'use client';

import { useCallback, useState } from 'react';
import {
  Activity,
  BadgeCheck,
  Ban,
  CircleDot,
  Crown,
  Eraser,
  Info,
  RotateCcw,
  Save,
  Scissors,
  Smile,
  Stethoscope,
  X,
  type LucideIcon,
} from 'lucide-react';

export type ToothStatus = 'healthy' | 'treatment' | 'extraction' | 'filling' | 'crown' | 'missing' | 'root_canal';

export interface ToothData {
  status: ToothStatus;
  note?: string;
}

export interface TeethMap {
  [toothId: number]: ToothData;
}

type StatusConfig = {
  label: string;
  color: string;
  fill: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
};

const TOOTH_STATUS_CONFIG: Record<ToothStatus, StatusConfig> = {
  healthy: {
    label: 'تەندروست',
    color: '#059669',
    fill: '#d1fae5',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    icon: BadgeCheck
  },
  treatment: {
    label: ' چارەسەری پێویست',
    color: '#f59e0b',
    fill: '#fffbeb',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Stethoscope
  },
  extraction: {
    label: 'هەڵقەندن',
    color: '#ef4444',
    fill: '#fef2f2',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: Scissors
  },
  filling: {
    label: 'پڕکردنەوە',
    color: '#3b82f6',
    fill: '#eff6ff',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: CircleDot
  },
  crown: {
    label: 'تاج',
    color: '#8b5cf6',
    fill: '#f5f3ff',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    icon: Crown
  },
  missing: {
    label: 'چاندنەوە',
    color: '#6b7280',
    fill: '#f3f4f6',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: Ban
  },
  root_canal: {
    label: ' دەمار بڕین',
    color: '#06b6d4',
    fill: '#ecfeff',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    icon: Activity
  },
};

const UPPER_ARCH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const LOWER_ARCH = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

const MOLARS = new Set([1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32]);
const PREMOLARS = new Set([4, 5, 12, 13, 20, 21, 28, 29]);
const CANINES = new Set([6, 11, 22, 27]);

const ARCH_LAYOUT = [
  { x: 5.5, y: 60, rotate: -26 },
  { x: 11, y: 65, rotate: -22 },
  { x: 17, y: 71, rotate: -18 },
  { x: 23.5, y: 77, rotate: -13 },
  { x: 30.5, y: 83, rotate: -8 },
  { x: 37.5, y: 88, rotate: -5 },
  { x: 44, y: 91, rotate: -2 },
  { x: 48.5, y: 93, rotate: 0 },
  { x: 51.5, y: 93, rotate: 0 },
  { x: 56, y: 91, rotate: 2 },
  { x: 62.5, y: 88, rotate: 5 },
  { x: 69.5, y: 83, rotate: 8 },
  { x: 76.5, y: 77, rotate: 13 },
  { x: 83, y: 71, rotate: 18 },
  { x: 89, y: 65, rotate: 22 },
  { x: 94.5, y: 60, rotate: 26 },
];

const ARCH_VIEWBOX_HEIGHT = 122;

function getToothType(id: number) {
  if (MOLARS.has(id)) return 'مۆڵار';
  if (PREMOLARS.has(id)) return 'پریمۆڵار';
  if (CANINES.has(id)) return 'نیشکە';
  return 'پێشەوە';
}

function getToothName(id: number) {
  const jaw = id <= 16 ? 'شێویلگەی سەرەوە' : 'شێویلگەی خوارەوە';
  const side = id <= 8 || id >= 25 ? 'لای ڕاست' : 'لای چەپ';
  return `ددانی ${getToothType(id)} - ${jaw} - ${side}`;
}

function getToothMetrics(id: number) {
  if (MOLARS.has(id)) return { width: 24, height: 44 };
  if (CANINES.has(id)) return { width: 20, height: 46 };
  return { width: 18, height: 44 };
}

function getPosition(index: number, isUpper: boolean) {
  const position = ARCH_LAYOUT[index];
  if (isUpper) {
    return {
      x: position.x,
      y: 120 - position.y,
      rotate: position.rotate,
    };
  }

  return {
    x: position.x,
    y: position.y,
    rotate: -position.rotate,
  };
}

function ToothShape({
  id,
  status,
  isUpper,
  selected,
}: {
  id: number;
  status: ToothStatus;
  isUpper: boolean;
  selected: boolean;
}) {
  const cfg = TOOTH_STATUS_CONFIG[status];
  const isMolar = MOLARS.has(id);
  const isCanine = CANINES.has(id);
  const stroke = selected ? 'var(--primary)' : cfg.color;
  const strokeWidth = selected ? 2.2 : status === 'healthy' ? 1.2 : 1.6;
  const transform = isUpper ? 'rotate(180 22 34)' : undefined;

  return (
    <svg
      viewBox="0 0 44 68"
      className="block h-full w-full overflow-visible"
      aria-hidden="true"
      style={{
        filter: selected
          ? 'drop-shadow(0 3px 8px rgba(15, 23, 42, 0.15))'
          : 'drop-shadow(0 2px 4px rgba(15, 23, 42, 0.10))',
      }}
    >
      <g transform={transform}>
        {isMolar ? (
          <>
            <path
              d="M9 25 C9 18 35 18 35 25 L38 43 C39.5 54 33 61 27.5 54 C24.8 50.8 19.2 50.8 16.5 54 C11 61 4.5 54 6 43 Z"
              fill={cfg.fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <path
              d="M13 25 C12 16 14 7 19 4 C21 11 20.5 18 19 25"
              fill={cfg.fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <path
              d="M25 25 C25.5 17 29 8 34 5 C35 13 34 19 31 25"
              fill={cfg.fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {status !== 'missing' && (
              <>
                <path d="M15 36 C19 34 25 34 29 36" fill="none" stroke={stroke} strokeWidth="0.7" opacity="0.4" />
                <path d="M22 29 L22 47" fill="none" stroke={stroke} strokeWidth="0.7" opacity="0.3" />
              </>
            )}
          </>
        ) : isCanine ? (
          <>
            <path
              d="M22 5 C27 11 30 18 29.5 26 C35 30 36 41 31 49 C27 56 22 63 22 63 C22 63 17 56 13 49 C8 41 9 30 14.5 26 C14 18 17 11 22 5 Z"
              fill={cfg.fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {status !== 'missing' && (
              <path d="M22 28 C20 35 20 42 22 51" fill="none" stroke={stroke} strokeWidth="0.7" opacity="0.38" />
            )}
          </>
        ) : (
          <>
            <path
              d="M22 5 C26 12 27 19 26 26 C31 30 33 39 29.5 48 C27 55 22 62 22 62 C22 62 17 55 14.5 48 C11 39 13 30 18 26 C17 19 18 12 22 5 Z"
              fill={cfg.fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            {status !== 'missing' && (
              <path d="M17 36 C20 34 24 34 27 36" fill="none" stroke={stroke} strokeWidth="0.7" opacity="0.35" />
            )}
          </>
        )}

        {status === 'extraction' && (
          <>
            <path d="M14 31 L30 49" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M30 31 L14 49" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" />
          </>
        )}

        {status === 'root_canal' && <path d="M22 27 L22 51" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" />}

        {status === 'crown' && (
          <path
            d="M14 34 L18 29 L22 34 L26 29 L30 34"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </g>
    </svg>
  );
}

interface ToothProps {
  id: number;
  data?: ToothData;
  isSelected: boolean;
  isUpper: boolean;
  readOnly: boolean;
  onClick: (id: number) => void;
}

function ToothButton({ id, data, isSelected, isUpper, readOnly, onClick }: ToothProps) {
  const status = data?.status || 'healthy';
  const cfg = TOOTH_STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;
  const metrics = getToothMetrics(id);

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      aria-pressed={isSelected}
      title={`${getToothName(id)} - ${cfg.label}`}
      className={`group/tooth relative flex flex-col items-center justify-center rounded-full outline-none transition-all duration-200 ${
        readOnly
          ? 'cursor-default'
          : 'cursor-pointer hover:-translate-y-0.5 hover:scale-105 focus-visible:-translate-y-0.5 focus-visible:scale-105'
      }`}
      style={{ width: metrics.width, height: metrics.height }}
    >
      <ToothShape id={id} status={status} isUpper={isUpper} selected={isSelected} />

      <span
        className={`absolute left-1/2 top-1/2 flex h-4 min-w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white/95 px-0.5 text-[8px] font-extrabold shadow-sm backdrop-blur dark:bg-slate-950/95 ${
          isSelected
            ? 'border-primary text-primary'
            : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300'
        }`}
      >
        {id}
      </span>

      {status !== 'healthy' && (
        <span
          className="absolute -right-0.5 top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm"
        >
          <StatusIcon className="h-2.5 w-2.5" />
        </span>
      )}
    </button>
  );
}

interface JawArchProps {
  label: string;
  sideLabel: string;
  ids: number[];
  value: TeethMap;
  selectedTeeth: number[];
  isUpper: boolean;
  readOnly: boolean;
  onToothClick: (id: number) => void;
}

function JawArch({ label, sideLabel, ids, value, selectedTeeth, isUpper, readOnly, onToothClick }: JawArchProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-background via-muted/5 to-muted/10 p-3 sm:p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-primary/12 px-3 py-1 text-[11px] sm:text-xs font-bold text-primary ring-1 ring-primary/20 shadow-sm">
          {label}
        </span>
        <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
          {sideLabel}
        </span>
      </div>
      <div className="overflow-visible pb-1">
        <div
          className="relative mx-auto h-[120px] w-full max-w-[600px] origin-center scale-100 sm:h-[110px] sm:max-w-[680px]"
          dir="ltr"
        >
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 660 122" aria-hidden="true">
            <path
              d={
                isUpper
                  ? 'M31 99 C126 14 534 14 629 99'
                  : 'M31 23 C126 108 534 108 629 23'
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="16"
              strokeLinecap="round"
              className="text-muted/70"
            />
            <path
              d={
                isUpper
                  ? 'M34 99 C128 18 532 18 626 99'
                  : 'M34 23 C128 104 532 104 626 23'
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="6 9"
              className="text-border/80"
            />
            <line
              x1="330"
              x2="330"
              y1={isUpper ? 34 : 50}
              y2={isUpper ? 106 : 90}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="5 7"
              className="text-border/70"
            />
          </svg>

          {ids.map((id, index) => {
            const position = getPosition(index, isUpper);
            const metrics = getToothMetrics(id);

            return (
              <div
                key={id}
                className="absolute"
                style={{
                  left: `calc(${position.x}% - ${metrics.width / 2}px)`,
                  top: `calc(${(position.y / ARCH_VIEWBOX_HEIGHT) * 100}% - ${metrics.height / 2}px)`,
                  transform: `rotate(${position.rotate}deg)`,
                  transformOrigin: '50% 50%',
                }}
              >
                <ToothButton
                  id={id}
                  data={value[id]}
                  isSelected={selectedTeeth.includes(id)}
                  onClick={onToothClick}
                  isUpper={isUpper}
                  readOnly={readOnly}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface DentalChartProps {
  value: TeethMap;
  onChange: (teeth: TeethMap) => void;
  readOnly?: boolean;
}

export function DentalChart({ value, onChange, readOnly = false }: DentalChartProps) {
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [pendingStatus, setPendingStatus] = useState<ToothStatus>('treatment');

  const handleToothClick = useCallback((id: number) => {
    if (readOnly) return;

    setSelectedTeeth((current) => {
      const alreadySelected = current.includes(id);
      const next = alreadySelected ? current.filter((toothId) => toothId !== id) : [...current, id];

      if (next.length === 0) {
        setNoteInput('');
        setPendingStatus('treatment');
        return next;
      }

      const latestData = value[id];
      setPendingStatus(latestData?.status || 'treatment');

      if (next.length === 1) {
        setNoteInput(latestData?.note || '');
        return next;
      }

      const selectedNotes = next
        .map((toothId) => value[toothId]?.note || '')
        .filter(Boolean);
      const sameNote = selectedNotes.length > 0 && selectedNotes.every((note) => note === selectedNotes[0]);
      setNoteInput(sameNote ? selectedNotes[0] : '');

      return next;
    });
  }, [readOnly, value]);

  const handleApply = () => {
    if (selectedTeeth.length === 0) return;

    const nextValue = { ...value };
    selectedTeeth.forEach((toothId) => {
      nextValue[toothId] = {
        status: pendingStatus,
        note: noteInput.trim() || undefined,
      };
    });

    onChange(nextValue);
    setSelectedTeeth([]);
    setNoteInput('');
  };

  const handleClearSelected = () => {
    if (selectedTeeth.length === 0) return;

    const next = { ...value };
    selectedTeeth.forEach((toothId) => {
      delete next[toothId];
    });
    onChange(next);
    setSelectedTeeth([]);
    setNoteInput('');
  };

  const handleClearAll = () => {
    onChange({});
    setSelectedTeeth([]);
    setNoteInput('');
  };

  const treatedCount = Object.keys(value).length;
  const selectedCount = selectedTeeth.length;
  const selectedSummary =
    selectedCount === 1
      ? `ددان #${selectedTeeth[0]}`
      : `${selectedCount} ددان هەڵبژێردراون`;

  return (
    <div className="flex w-full select-none flex-col gap-2 sm:gap-3" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <Smile className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">چارتی ددان</p>
            <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">دوو شێویلگەی سەرەوە و خوارەوە</p>
          </div>
          {treatedCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary ring-1 ring-primary/20">
              <BadgeCheck className="h-2.5 w-2.5" />
              {treatedCount} ددان
            </span>
          )}
        </div>

        {!readOnly && treatedCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-[9px] font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            <RotateCcw className="h-3 w-3" />
            پاککردنەوە
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-2 sm:p-3 shadow-inner">
        <div className="rounded-xl bg-gradient-to-b from-muted/20 via-background to-muted/30 p-2">
          <JawArch
            label="شێویلگەی سەرەوە"
            sideLabel="ڕاست 1-8 | چەپ 9-16"
            ids={UPPER_ARCH}
            value={value}
            selectedTeeth={selectedTeeth}
            onToothClick={handleToothClick}
            isUpper
            readOnly={readOnly}
          />

          <div className="mx-auto my-2 flex max-w-[550px] items-center gap-2 px-2 sm:my-1.5">
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-transparent" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground shadow-sm">
              <Smile className="h-3.5 w-3.5" />
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <JawArch
            label="شێویلگەی خوارەوە"
            sideLabel="ڕاست 25-32 | چەپ 17-24"
            ids={LOWER_ARCH}
            value={value}
            selectedTeeth={selectedTeeth}
            onToothClick={handleToothClick}
            isUpper={false}
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-1">
        {Object.entries(TOOTH_STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;

          return (
            <div
              key={key}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground"
            >
              <Icon className="h-2.5 w-2.5 text-primary" />
              <span>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {!readOnly && selectedTeeth.length > 0 && (
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-2.5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-primary">{selectedSummary}</p>
              {selectedTeeth.length === 1 && (
                <p className="mt-0.5 text-[9px] font-medium leading-tight text-muted-foreground">
                  {getToothName(selectedTeeth[0])}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={handleClearSelected}
                className="inline-flex h-6 items-center gap-1 rounded-lg bg-card px-2 text-[9px] font-semibold text-destructive ring-1 ring-border transition-colors hover:bg-destructive/10"
              >
                <Eraser className="h-2.5 w-2.5" />
                سڕینەوە
              </button>
              <button
                type="button"
                onClick={() => setSelectedTeeth([])}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                aria-label="داخستن"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {Object.entries(TOOTH_STATUS_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const active = pendingStatus === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPendingStatus(key as ToothStatus)}
                  className={`flex min-h-10 items-center gap-1.5 rounded-lg border px-1.5 py-1 text-right transition-all ${
                    active
                      ? 'border-primary bg-card shadow-sm ring-2 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="text-[9px] font-bold leading-tight text-slate-700 dark:text-slate-200">{cfg.label}</span>
                </button>
              );
            })}
          </div>

          <label className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-primary">
            <Info className="h-2.5 w-2.5" />
            تێبینی
          </label>
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.currentTarget.value)}
            placeholder="تێبینی تایبەت بۆ ئەم ددانە..."
            className="mt-0.5 h-8 w-full rounded-lg border border-border bg-card px-2 text-[10px] text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            dir="rtl"
          />

          <button
            type="button"
            onClick={handleApply}
            className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[10px] font-bold text-primary-foreground shadow-sm shadow-primary/25 transition-colors hover:bg-primary/90"
          >
            <Save className="h-3 w-3" />
            پاشەکەوتکردن
          </button>
        </div>
      )}

      {treatedCount > 0 && (
        <div className="rounded-lg border border-border bg-muted/20 p-2">
          <p className="mb-1.5 text-[9px] font-bold text-slate-500 dark:text-slate-400">ددانە نیشانکراوەکان</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(value).map(([toothId, data]) => {
              const cfg = TOOTH_STATUS_CONFIG[data.status];
              const Icon = cfg.icon;

              return (
                <div
                  key={toothId}
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-card px-1.5 py-0.5 text-[9px] font-semibold text-foreground"
                >
                  <Icon className="h-2.5 w-2.5 shrink-0 text-primary" />
                  <span>#{toothId}</span>
                  <span>{cfg.label}</span>
                  {data.note && <span className="truncate opacity-75">({data.note})</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function DentalChartBadge({ teethData }: { teethData: TeethMap }) {
  const count = Object.keys(teethData).length;
  if (count === 0) return null;

  const statusCounts = Object.values(teethData).reduce((acc, data) => {
    acc[data.status] = (acc[data.status] || 0) + 1;
    return acc;
  }, {} as Record<ToothStatus, number>);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {Object.entries(statusCounts).map(([status, countValue]) => {
        const cfg = TOOTH_STATUS_CONFIG[status as ToothStatus];
        const Icon = cfg.icon;

        return (
          <span
            key={status}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-1.5 py-0.5 text-[9px] font-bold text-foreground"
          >
            <Icon className="h-2.5 w-2.5 text-primary" />
            {Number(countValue)} {cfg.label}
          </span>
        );
      })}
    </div>
  );
}
