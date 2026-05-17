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
import { useAppState } from "../state/AppState";
import { useBodyForm } from "../hooks/useBodyForm";
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

const BodyMeasurements = () => {
  const { bodyMeasurements, deleteBodyMeasurement } = useAppState();
  const {
    form,
    weightUnit,
    setWeightUnit,
    lengthUnit,
    setLengthUnit,
    isLoading,
    submitMeasurement,
  } = useBodyForm();
  const [showForm, setShowForm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<BodyMeasurementId | null>(null);

  const displayWeight = (kg: number) => (weightUnit === "lb" ? `${kgToLb(kg)} lb` : `${kg} kg`);
  const displayLength = (cm: number) => (lengthUnit === "in" ? `${cmToIn(cm)}"` : `${cm} cm`);

  const weightEntries = useMemo(
    () => bodyMeasurements.filter((m) => m.weight !== undefined),
    [bodyMeasurements],
  );

  const weightChartData = useMemo(
    () =>
      weightEntries.map((m) => ({
        label: m.measuredAt.slice(5),
        weight: weightUnit === "lb" ? kgToLb(m.weight!) : m.weight!,
      })),
    [weightEntries, weightUnit],
  );

  const axisTickStyle = {
    fill: "var(--ink-soft)",
    fontSize: chartTheme.axisFontSize,
    fontFamily: chartTheme.axisFontFamily,
  };

  return (
    <div className="space-y-6">
      {/* Unit toggles + Log Measurement dialog */}
      <div className="flex flex-wrap gap-4 items-center">
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
            <Form {...form}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await submitMeasurement();
                  if (ok) setShowForm(false);
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
                  {isLoading ? "Saving..." : "Save Measurement"}
                </Button>
              </form>
            </Form>
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
              <YAxis tick={axisTickStyle} unit={` ${weightUnit}`} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="weight"
                name={`Weight (${weightUnit})`}
                stroke={BODY_CHART_COLOR.weight}
                fill={BODY_CHART_COLOR.weight}
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
                <th className="py-2" />
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
                  <td className="py-2">
                    {pendingDeleteId === m.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (m.id) void deleteBodyMeasurement(m.id);
                            setPendingDeleteId(null);
                          }}
                          className="px-1.5 py-0.5 bg-persimmon text-paper font-mono text-[9px] uppercase tracking-wider hover:opacity-90 transition-opacity"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setPendingDeleteId(null)}
                          aria-label="Cancel delete"
                          className="font-mono text-[9px] text-ink-soft hover:text-ink transition-colors"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => m.id && setPendingDeleteId(m.id)}
                        aria-label={`Delete
                      measurement from
                      ${m.measuredAt}`}
                        className="text-ink-soft hover:text-persimmon transition-colors opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-rule px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-display italic text-ink-soft text-lg">No measurements logged yet.</p>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Log one above
          </span>
        </div>
      )}
    </div>
  );
};

export default BodyMeasurements;
