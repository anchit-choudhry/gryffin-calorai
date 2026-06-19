const CARD_W = 1200;
const CARD_H = 630;

const C = {
  paper: "oklch(0.975 0.012 80)",
  ink: "oklch(0.18 0.020 60)",
  inkSoft: "oklch(0.42 0.020 60)",
  rule: "oklch(0.85 0.015 75)",
  persimmon: "oklch(0.65 0.190 38)",
  persimmonFaint: "oklch(0.92 0.050 40)",
} as const;

function makeCanvas(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = CARD_W;
  c.height = CARD_H;
  return c;
}

function drawBase(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, CARD_W - 2, CARD_H - 2);
  ctx.strokeStyle = C.rule;
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, CARD_W - 20, CARD_H - 20);
}

function drawBrand(ctx: CanvasRenderingContext2D, subtitle: string): void {
  ctx.fillStyle = C.inkSoft;
  ctx.font = "500 22px 'JetBrains Mono', monospace";
  ctx.letterSpacing = "3px";
  ctx.fillText(`GRYFFIN CALORAI  ·  ${subtitle.toUpperCase()}`, 52, 56);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = C.rule;
  ctx.fillRect(52, 64, CARD_W - 104, 1);
}

function drawFooter(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = C.rule;
  ctx.fillRect(52, CARD_H - 72, CARD_W - 104, 1);

  ctx.fillStyle = C.inkSoft;
  ctx.font = "500 18px 'JetBrains Mono', monospace";
  ctx.letterSpacing = "2px";
  ctx.fillText("FIELD JOURNAL  ·  2026", 52, CARD_H - 42);
  ctx.letterSpacing = "0px";
}

export interface StreakCardData {
  currentStreak: number;
  longestStreak: number;
  loggedDates: Set<string>;
}

export async function renderStreakCard(data: StreakCardData): Promise<Blob> {
  const canvas = makeCanvas();
  const ctx = canvas.getContext("2d")!;
  drawBase(ctx);
  drawBrand(ctx, "Logging Streak");

  const today = new Date().toISOString().slice(0, 10);
  const days: string[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const dotSize = 44;
  const dotGap = 14;
  const cols = 7;
  const rows = 4;
  const gridW = cols * dotSize + (cols - 1) * dotGap;
  const gridStartX = (CARD_W - gridW) / 2;
  const gridStartY = 110;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dayIdx = row * cols + col;
      const day = days[dayIdx]!;
      const isToday = day === today;
      const isLogged = data.loggedDates.has(day);

      const x = gridStartX + col * (dotSize + dotGap) + dotSize / 2;
      const y = gridStartY + row * (dotSize + dotGap) + dotSize / 2;

      ctx.beginPath();
      ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);

      if (isToday) {
        ctx.fillStyle = C.persimmon;
      } else if (isLogged) {
        ctx.fillStyle = C.persimmonFaint;
      } else {
        ctx.fillStyle = C.rule;
      }
      ctx.fill();
    }
  }

  const statsY = gridStartY + rows * (dotSize + dotGap) + 40;

  ctx.fillStyle = C.rule;
  ctx.fillRect(52, statsY, CARD_W - 104, 1);

  const leftX = CARD_W / 2 - 140;
  const rightX = CARD_W / 2 + 140;
  const numY = statsY + 80;
  const lblY = statsY + 112;

  ctx.textAlign = "center";
  ctx.font = "300 90px 'Spectral', Georgia, serif";
  ctx.fillStyle = C.persimmon;
  ctx.fillText(String(data.currentStreak), leftX, numY);

  ctx.font = "300 90px 'Spectral', Georgia, serif";
  ctx.fillStyle = C.inkSoft;
  ctx.fillText(String(data.longestStreak), rightX, numY);

  ctx.font = "500 18px 'JetBrains Mono', monospace";
  ctx.letterSpacing = "2px";
  ctx.fillStyle = C.inkSoft;
  ctx.fillText("CURRENT STREAK", leftX, lblY);
  ctx.fillText("BEST", rightX, lblY);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = C.rule;
  ctx.fillRect(CARD_W / 2 - 1, statsY + 16, 2, lblY - statsY - 16 + 20);

  ctx.textAlign = "left";
  drawFooter(ctx);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob returned null"));
    }, "image/png");
  });
}

export interface HarvestCardData {
  averageCalories: number;
  daysOnTarget: number;
  consistency: number;
  currentStreak: number;
  calorieGoal: number;
}

export async function renderHarvestCard(data: HarvestCardData): Promise<Blob> {
  const canvas = makeCanvas();
  const ctx = canvas.getContext("2d")!;
  drawBase(ctx);
  drawBrand(ctx, "The Harvest");

  const topY = 100;
  const statBoxW = (CARD_W - 104) / 4;

  const stats = [
    {
      value: data.averageCalories.toLocaleString(),
      label: "AVG DAILY KCAL",
      sub: `GOAL ${data.calorieGoal.toLocaleString()}`,
    },
    { value: `${data.daysOnTarget}/7`, label: "DAYS ON TARGET", sub: "" },
    { value: `${data.consistency}%`, label: "CONSISTENCY", sub: "" },
    { value: String(data.currentStreak), label: "STREAK", sub: "DAYS" },
  ];

  stats.forEach((stat, i) => {
    const boxX = 52 + i * statBoxW;

    if (i > 0) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(boxX, topY, 1, 280);
    }

    const valY = topY + 130;
    const lblY = topY + 175;
    const subY = topY + 205;

    ctx.textAlign = "center";
    const cx = boxX + statBoxW / 2;

    ctx.font = "300 80px 'Spectral', Georgia, serif";
    ctx.fillStyle = i === 3 ? C.persimmon : C.ink;
    ctx.fillText(stat.value, cx, valY);

    ctx.font = "500 17px 'JetBrains Mono', monospace";
    ctx.letterSpacing = "2px";
    ctx.fillStyle = C.inkSoft;
    ctx.fillText(stat.label, cx, lblY);

    if (stat.sub) {
      ctx.font = "400 14px 'JetBrains Mono', monospace";
      ctx.letterSpacing = "1px";
      ctx.fillStyle = C.inkSoft;
      ctx.fillText(stat.sub, cx, subY);
    }
    ctx.letterSpacing = "0px";
  });

  ctx.fillStyle = C.rule;
  ctx.fillRect(52, topY + 290, CARD_W - 104, 1);

  const note =
    data.daysOnTarget >= 5
      ? "Strong week. Your consistency is building a lasting habit."
      : data.daysOnTarget >= 3
        ? "A decent start. A few more days on target would lift your average."
        : "Every logged meal counts. Tomorrow is a fresh page.";

  ctx.textAlign = "left";
  ctx.font = "400 22px 'JetBrains Mono', monospace";
  ctx.fillStyle = C.inkSoft;
  ctx.fillText(note, 52, topY + 334);

  drawFooter(ctx);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob returned null"));
    }, "image/png");
  });
}

/** Shares a PNG blob via Web Share API or falls back to download. */
export async function shareOrDownloadCard(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.canShare !== undefined && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: "Gryffin Calorai" });
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
