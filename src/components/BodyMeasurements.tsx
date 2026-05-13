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

  return (
    <div className="space-y-6">
      {/* Unit toggles + Log Measurement dialog */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-soft">Weight:</span>
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
          <span className="text-sm text-ink-soft">Length:</span>
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
        <div className="h-[300px] text-gray-600 dark:text-gray-300">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
              <XAxis dataKey="label" tick={{ fill: "currentColor", fontSize: 12 }} />
              <YAxis tick={{ fill: "currentColor", fontSize: 12 }} unit={` ${weightUnit}`} />
              <Tooltip
                content={({ payload }) => {
                  const entry = payload?.[0];
                  if (!entry) return null;
                  return (
                    <div className="rounded border border-border bg-background p-2 text-xs shadow-sm">
                      <p className="mb-1">{entry.payload.label}</p>
                      <p style={{ color: entry.color ?? undefined }}>
                        Weight: {entry.value} {weightUnit}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="weight"
                name={`Weight (${weightUnit})`}
                stroke="rgb(168,85,247)"
                fill="rgba(168,85,247,0.1)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Measurement history */}
      {bodyMeasurements.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
            <thead className="text-xs uppercase text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
              <tr>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Weight</th>
                <th className="py-2 pr-4">Body Fat</th>
                <th className="py-2 pr-4">Waist</th>
                <th className="py-2 pr-4">Chest</th>
                <th className="py-2 pr-4">Hips</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {[...bodyMeasurements].reverse().map((m) => (
                <tr key={m.id} className="border-b dark:border-gray-700 last:border-0">
                  <td className="py-2 pr-4 font-medium dark:text-gray-200">{m.measuredAt}</td>
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
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-ink-soft hover:text-destructive transition-colors"
                      onClick={() => m.id && deleteBodyMeasurement(m.id)}
                      aria-label={`Delete
                    measurement from
                    ${m.measuredAt}`}
                    >
                      ✕
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 italic text-sm">
          No measurements logged yet. Click "Log Measurement" to start tracking.
        </p>
      )}
    </div>
  );
};

export default BodyMeasurements;
