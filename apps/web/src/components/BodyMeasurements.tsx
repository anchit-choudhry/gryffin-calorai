import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "../state/AppState";
import { useBodyForm } from "../hooks/useBodyForm";
import type { BodyMeasurement } from "../db/dbService";
import type { BodyMeasurementId } from "@/types";
import { cmToIn, isLengthUnit, isWeightUnit, kgToLb } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EDITORIAL_INPUT_CLS } from "../lib/utils";
import { BODY_CHART_COLOR, chartTheme } from "@/lib/chartTheme";
import ChartTooltip from "@/components/charts/ChartTooltip";
import EditorialChartCard from "@/components/charts/EditorialChartCard";
import { EmptyState } from "@/components/EmptyState";
import { BodyScale } from "@/components/illustrations";

const MeasurementForm = ({
  measurementId,
  initialValues,
  onSuccess,
  submitLabel,
}: {
  measurementId?: BodyMeasurementId;
  initialValues?: {
    weight?: string;
    bodyFat?: string;
    waist?: string;
    chest?: string;
    hips?: string;
  };
  onSuccess: () => void;
  submitLabel: string;
}) => {
  const {
    form,
    weightUnit,
    setWeightUnit,
    lengthUnit,
    setLengthUnit,
    isLoading,
    submitMeasurement,
  } = useBodyForm({ measurementId, initialValues });

  return (
    <>
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            Weight:
          </span>
          <Tabs
            value={weightUnit}
            onValueChange={(v) => {
              if (isWeightUnit(v)) setWeightUnit(v);
            }}
          >
            <TabsList>
              <TabsTrigger value="kg">kg</TabsTrigger>
              <TabsTrigger value="lb">lb</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            Length:
          </span>
          <Tabs
            value={lengthUnit}
            onValueChange={(v) => {
              if (isLengthUnit(v)) setLengthUnit(v);
            }}
          >
            <TabsList>
              <TabsTrigger value="cm">cm</TabsTrigger>
              <TabsTrigger value="in">in</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <Form {...form}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await submitMeasurement();
            if (ok) onSuccess();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight ({weightUnit}) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="e.g. 70"
                      min="1"
                      className={EDITORIAL_INPUT_CLS}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bodyFat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body Fat (%)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="e.g. 18"
                      min="1"
                      max="99"
                      className={EDITORIAL_INPUT_CLS}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="waist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Waist ({lengthUnit})</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="e.g. 80"
                      min="1"
                      className={EDITORIAL_INPUT_CLS}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chest ({lengthUnit})</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="e.g. 95"
                      min="1"
                      className={EDITORIAL_INPUT_CLS}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hips"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hips ({lengthUnit})</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="e.g. 90"
                      min="1"
                      className={EDITORIAL_INPUT_CLS}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            type="submit"
            variant="persimmon"
            disabled={isLoading}
            className="font-mono text-sm rounded-none h-auto w-full px-4 py-2"
          >
            {isLoading ? "Saving..." : submitLabel}
          </Button>
        </form>
      </Form>
    </>
  );
};

const BodyMeasurements = () => {
  const { bodyMeasurements, deleteBodyMeasurement, addBodyMeasurement } = useAppState();
  const [showForm, setShowForm] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<BodyMeasurement | null>(null);

  const [displayWeightUnit, setDisplayWeightUnit] = useState<"kg" | "lb">("kg");
  const [displayLengthUnit, setDisplayLengthUnit] = useState<"cm" | "in">("cm");

  const displayWeight = (kg: number) =>
    displayWeightUnit === "lb" ? `${kgToLb(kg)} lb` : `${kg} kg`;
  const displayLength = (cm: number) =>
    displayLengthUnit === "in" ? `${cmToIn(cm)}"` : `${cm} cm`;

  const weightEntries = useMemo(
    () => bodyMeasurements.filter((m) => m.weight !== undefined),
    [bodyMeasurements],
  );

  const bodyFatEntries = useMemo(
    () => bodyMeasurements.filter((m) => m.bodyFat !== undefined),
    [bodyMeasurements],
  );

  const weightChartData = useMemo(
    () =>
      weightEntries.map((m) => ({
        label: m.measuredAt.slice(5),
        weight: displayWeightUnit === "lb" ? kgToLb(m.weight!) : m.weight!,
      })),
    [weightEntries, displayWeightUnit],
  );

  const bodyFatChartData = useMemo(
    () =>
      bodyFatEntries.map((m) => ({
        label: m.measuredAt.slice(5),
        bodyFat: m.bodyFat!,
      })),
    [bodyFatEntries],
  );

  const axisTickStyle = {
    fill: "var(--ink-soft)",
    fontSize: chartTheme.axisFontSize,
    fontFamily: chartTheme.axisFontFamily,
  };

  const makeInitialValues = (m: BodyMeasurement) => ({
    weight: m.weight !== undefined ? String(m.weight) : "",
    bodyFat: m.bodyFat !== undefined ? String(m.bodyFat) : "",
    waist: m.waist !== undefined ? String(m.waist) : "",
    chest: m.chest !== undefined ? String(m.chest) : "",
    hips: m.hips !== undefined ? String(m.hips) : "",
  });

  return (
    <div className="space-y-6">
      {/* Unit toggles + Log Measurement dialog */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            Weight:
          </span>
          <Tabs
            value={displayWeightUnit}
            onValueChange={(v) => {
              if (isWeightUnit(v)) setDisplayWeightUnit(v);
            }}
          >
            <TabsList>
              <TabsTrigger value="kg">kg</TabsTrigger>
              <TabsTrigger value="lb">lb</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            Length:
          </span>
          <Tabs
            value={displayLengthUnit}
            onValueChange={(v) => {
              if (isLengthUnit(v)) setDisplayLengthUnit(v);
            }}
          >
            <TabsList>
              <TabsTrigger value="cm">cm</TabsTrigger>
              <TabsTrigger value="in">in</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button
              variant="persimmon"
              className="ml-auto font-mono text-sm rounded-none h-auto px-4 py-1.5"
            >
              + Log Measurement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Measurement</DialogTitle>
            </DialogHeader>
            <MeasurementForm submitLabel="Save Measurement" onSuccess={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Weight chart */}
      {weightEntries.length >= 2 && (
        <EditorialChartCard label="Weight Trend" height={300} raised>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="label" tick={axisTickStyle} />
              <YAxis tick={axisTickStyle} unit={` ${displayWeightUnit}`} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="weight"
                name={`Weight (${displayWeightUnit})`}
                stroke={BODY_CHART_COLOR.weight}
                fill={BODY_CHART_COLOR.weight}
                fillOpacity={0.12}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </EditorialChartCard>
      )}

      {/* Body Fat chart */}
      {bodyFatEntries.length >= 2 && (
        <EditorialChartCard label="Body Fat Trend" height={260} raised>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bodyFatChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="label" tick={axisTickStyle} />
              <YAxis tick={axisTickStyle} unit="%" />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="bodyFat"
                name="Body Fat (%)"
                stroke={BODY_CHART_COLOR.bodyFat ?? BODY_CHART_COLOR.weight}
                fill={BODY_CHART_COLOR.bodyFat ?? BODY_CHART_COLOR.weight}
                fillOpacity={0.12}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </EditorialChartCard>
      )}

      {/* Measurement history */}
      {bodyMeasurements.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-ink-soft">
            <thead>
              <tr className="border-b border-rule">
                <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                  Date
                </th>
                <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                  Weight
                </th>
                <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                  Body Fat
                </th>
                <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                  Waist
                </th>
                <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                  Chest
                </th>
                <th className="py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                  Hips
                </th>
                <th className="py-2" colSpan={2} />
              </tr>
            </thead>
            <tbody>
              {[...bodyMeasurements].reverse().map((m) => (
                <tr key={m.id} className="group border-b border-rule/50 last:border-0">
                  <td className="py-2 pr-4 text-ink font-mono text-xs">{m.measuredAt}</td>
                  <td className="py-2 pr-4">
                    {m.weight !== undefined ? displayWeight(m.weight) : "-"}
                  </td>
                  <td className="py-2 pr-4">{m.bodyFat !== undefined ? `${m.bodyFat}%` : "-"}</td>
                  <td className="py-2 pr-4">
                    {m.waist !== undefined ? displayLength(m.waist) : "-"}
                  </td>
                  <td className="py-2 pr-4">
                    {m.chest !== undefined ? displayLength(m.chest) : "-"}
                  </td>
                  <td className="py-2 pr-4">
                    {m.hips !== undefined ? displayLength(m.hips) : "-"}
                  </td>
                  <td className="py-2 pr-1">
                    <button
                      onClick={() => m.id && setEditingMeasurement(m)}
                      aria-label={`Edit measurement from ${m.measuredAt}`}
                      className="text-ink-soft hover:text-ink transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Pencil size={12} />
                    </button>
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!m.id) return;
                        const snapshot = { ...m };
                        void deleteBodyMeasurement(m.id);
                        toast("Measurement removed", {
                          action: {
                            label: "Undo",
                            onClick: () => {
                              const { id: _id, ...rest } = snapshot;
                              void addBodyMeasurement(rest);
                            },
                          },
                        });
                      }}
                      aria-label={`Delete
                    measurement from
                    ${m.measuredAt}`}
                      className="text-ink-soft hover:text-persimmon transition-colors opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-rule">
          <EmptyState
            illustration={<BodyScale className="w-full h-full" />}
            eyebrow="Body Measurements"
            heading="No measurements logged yet"
            body="Record your first measurement using the form above to start tracking your progress."
            variant="illustrated"
          />
        </div>
      )}

      {/* Edit dialog */}
      <Dialog
        open={editingMeasurement !== null}
        onOpenChange={(open) => {
          if (!open) setEditingMeasurement(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Measurement</DialogTitle>
          </DialogHeader>
          {editingMeasurement && (
            <MeasurementForm
              measurementId={editingMeasurement.id}
              initialValues={makeInitialValues(editingMeasurement)}
              submitLabel="Update Measurement"
              onSuccess={() => setEditingMeasurement(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BodyMeasurements;
