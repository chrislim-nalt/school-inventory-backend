import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ─── Brand colours (RGB) ─────────────────────────────────────────────────────
const C = {
  navy:      [15,  23,  42],
  blue:      [79,  70,  229],
  blueLight: [165, 180, 252],
  green:     [16,  185, 129],
  amber:     [245, 158,  11],
  rose:      [239,  68,  68],
  white:     [255, 255, 255],
  offWhite:  [248, 250, 252],
  stripe:    [241, 245, 249],
  muted:     [100, 116, 139],
  dark:      [30,  41,  59],
  border:    [226, 232, 240],
};

// ─── Strip emoji / non-ASCII so jsPDF built-in fonts don't break ─────────────
const safe = (v) => {
  if (v == null) return "-";
  return String(v)
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[^\x00-\x7E]/g, "")
    .trim() || "-";
};

const fmtDate = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// ─── Set fill + draw rect ────────────────────────────────────────────────────
const fillRect = (doc, x, y, w, h, rgb) => {
  doc.setFillColor(...rgb);
  doc.rect(x, y, w, h, "F");
};

// ─── Page header ─────────────────────────────────────────────────────────────
function drawPageHeader(doc, title, subtitle, pageW) {
  // Top bar
  fillRect(doc, 0, 0, pageW, 22, C.navy);

  // Circle icon
  doc.setFillColor(...C.blue);
  doc.circle(14, 11, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  doc.text("SI", 14, 13.2, { align: "center" });

  // School name
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text("G.S AGATEKO", 24, 9.5);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.blueLight);
  doc.text("School Inventory Management System", 24, 15);

  // Date top-right
  doc.setFontSize(7);
  doc.setTextColor(...C.blueLight);
  doc.text(`${fmtDate()}  ${fmtTime()}`, pageW - 12, 12, { align: "right" });

  // Title band
  fillRect(doc, 0, 22, pageW, 11, C.blue);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text(safe(title), 14, 29.5);

  if (subtitle) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.blueLight);
    doc.text(safe(subtitle), pageW - 12, 29.5, { align: "right" });
  }
}

// ─── Page footer ─────────────────────────────────────────────────────────────
function drawPageFooter(doc, pageNum, totalPages, pageW, pageH) {
  fillRect(doc, 0, pageH - 9, pageW, 9, C.navy);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.blueLight);
  doc.text("Confidential — G.S AGATEKO School Inventory", 12, pageH - 3);
  doc.text(`Page ${pageNum} / ${totalPages}`, pageW - 12, pageH - 3, { align: "right" });
}

// ─── Summary stat boxes ───────────────────────────────────────────────────────
function drawStatBoxes(doc, stats, y, pageW) {
  const margin = 12;
  const gap = 2;
  const cols = stats.length;
  const boxW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
  const boxH = 20;

  stats.forEach((s, i) => {
    const x = margin + i * (boxW + gap);

    // Card bg
    fillRect(doc, x, y, boxW, boxH, C.offWhite);

    // Accent stripe
    doc.setFillColor(...s.color);
    doc.rect(x, y, 3, boxH, "F");

    // Border
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.rect(x, y, boxW, boxH, "S");

    // Label
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    doc.text(s.label, x + 6, y + 7);

    // Value
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text(String(s.value), x + 6, y + 16);
  });

  return y + boxH + 5;
}

// ─── Pure-jsPDF table renderer ────────────────────────────────────────────────
// No jspdf-autotable dependency — drawn manually, works with any bundler.
function drawTable(doc, { head, body, foot, startY, pageW, colWidths, colAligns = [] }) {
  const margin = 12;
  const rowH = 7;
  const headH = 8;
  const footH = 8;
  const tableW = pageW - margin * 2;
  const pageH = doc.internal.pageSize.getHeight();
  const bottomLimit = pageH - 12; // leave room for footer

  // Normalise col widths to fill table width
  const totalGiven = colWidths.reduce((a, b) => a + b, 0);
  const scale = tableW / totalGiven;
  const cw = colWidths.map((w) => w * scale);

  let y = startY;

  // ── Draw header row ────────────────────────────────────────────────────
  const drawHead = () => {
    fillRect(doc, margin, y, tableW, headH, C.navy);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    let cx = margin;
    head.forEach((cell, ci) => {
      const align = colAligns[ci] || "left";
      const textX = align === "right" ? cx + cw[ci] - 2 : align === "center" ? cx + cw[ci] / 2 : cx + 2;
      doc.text(safe(cell), textX, y + 5.5, { align });
      cx += cw[ci];
    });
    y += headH;
  };

  drawHead();

  // ── Draw body rows ─────────────────────────────────────────────────────
  body.forEach((row, ri) => {
    // New page if needed
    if (y + rowH > bottomLimit) {
      doc.addPage();
      // Re-draw page furniture on new page
      drawPageHeader(doc, "", "", pageW);
      y = 38;
      drawHead();
    }

    // Alternating stripe
    if (ri % 2 === 1) {
      fillRect(doc, margin, y, tableW, rowH, C.stripe);
    }

    // Cell border line
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.15);
    doc.line(margin, y + rowH, margin + tableW, y + rowH);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.dark);

    let cx = margin;
    row.forEach((cell, ci) => {
      // Per-cell colour overrides
      if (cell && cell.__color) doc.setTextColor(...cell.__color);
      else doc.setTextColor(...C.dark);

      if (cell && cell.__bold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");

      const text = cell && cell.__text != null ? safe(cell.__text) : safe(cell);
      const align = colAligns[ci] || "left";
      const textX = align === "right" ? cx + cw[ci] - 2 : align === "center" ? cx + cw[ci] / 2 : cx + 2;

      // Clip long text
      const maxW = cw[ci] - 3;
      const clipped = doc.getTextWidth(text) > maxW
        ? doc.splitTextToSize(text, maxW)[0] + "…"
        : text;

      doc.text(clipped, textX, y + 5, { align });
      cx += cw[ci];
    });

    y += rowH;
  });

  // ── Footer / subtotal row ──────────────────────────────────────────────
  if (foot && foot.length) {
    if (y + footH > bottomLimit) {
      doc.addPage();
      drawPageHeader(doc, "", "", pageW);
      y = 38;
    }
    fillRect(doc, margin, y, tableW, footH, C.navy);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    let cx = margin;
    foot.forEach((cell, ci) => {
      const align = colAligns[ci] || "left";
      const textX = align === "right" ? cx + cw[ci] - 2 : align === "center" ? cx + cw[ci] / 2 : cx + 2;
      doc.text(safe(cell), textX, y + 5.5, { align });
      cx += cw[ci];
    });
    y += footH;
  }

  return y;
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT: Items PDF — professional, grouped by category
// ════════════════════════════════════════════════════════════════════════════
export const exportItemsToPDF = (items, schoolName = "G.S AGATEKO") => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── Group by category ───────────────────────────────────────────────────
  const grouped = {};
  items.forEach((item) => {
    const cat = item.category?.name || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });
  const sortedCats = Object.keys(grouped).sort();

  // ── Global stats ────────────────────────────────────────────────────────
  const totalValue = items.reduce((s, i) => s + (i.unitPrice || 0) * (i.currentQuantity || 0), 0);
  const lowStock   = items.filter((i) => (i.currentQuantity || 0) <= (i.minStockLevel || 0) && (i.minStockLevel || 0) > 0).length;
  const totalPages = sortedCats.length + 1;

  // ════════════════════════════════════════════════════════════════════════
  //  PAGE 1 — Cover summary
  // ════════════════════════════════════════════════════════════════════════
  drawPageHeader(doc,
    "Items Inventory Report",
    `${items.length} items  |  ${sortedCats.length} categories  |  Generated ${fmtDate()}`,
    pageW
  );

  let y = drawStatBoxes(doc, [
    { label: "Total Items",       value: items.length,                  color: C.blue  },
    { label: "Categories",        value: sortedCats.length,             color: [20,184,166] },
    { label: "Low Stock Alerts",  value: lowStock,                      color: C.amber },
    { label: "Total Value (RWF)", value: totalValue.toLocaleString(),   color: C.green },
  ], 37, pageW);

  // Category summary table
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("CATEGORY BREAKDOWN", 12, y + 2);
  y += 6;

  const catBody = sortedCats.map((cat) => {
    const ci = grouped[cat];
    const cv = ci.reduce((s, i) => s + (i.unitPrice || 0) * (i.currentQuantity || 0), 0);
    const cl = ci.filter((i) => (i.currentQuantity || 0) <= (i.minStockLevel || 0) && (i.minStockLevel || 0) > 0).length;
    const status = cl > 0 ? { __text: `${cl} LOW`, __color: C.rose, __bold: true } : { __text: "OK", __color: C.green, __bold: true };
    return [
      safe(cat),
      { __text: String(ci.length), __bold: true },
      ci.reduce((s, i) => s + (i.currentQuantity || 0), 0),
      status,
      { __text: `${cv.toLocaleString()} RWF`, __color: C.green, __bold: true },
    ];
  });

  drawTable(doc, {
    head: ["Category", "Items", "Total Qty", "Stock Status", "Total Value (RWF)"],
    body: catBody,
    startY: y,
    pageW,
    colWidths: [55, 20, 25, 30, 50],
    colAligns: ["left", "center", "center", "center", "right"],
  });

  drawPageFooter(doc, 1, totalPages, pageW, pageH);

  // ════════════════════════════════════════════════════════════════════════
  //  PAGES 2+ — One page per category
  // ════════════════════════════════════════════════════════════════════════
  sortedCats.forEach((catName, catIdx) => {
    doc.addPage();

    const catItems = grouped[catName];
    const catValue = catItems.reduce((s, i) => s + (i.unitPrice || 0) * (i.currentQuantity || 0), 0);
    const catLow   = catItems.filter((i) => (i.currentQuantity || 0) <= (i.minStockLevel || 0) && (i.minStockLevel || 0) > 0).length;
    const catQty   = catItems.reduce((s, i) => s + (i.currentQuantity || 0), 0);

    drawPageHeader(doc,
      `Category: ${safe(catName)}`,
      `${catItems.length} items  |  Total Value: ${catValue.toLocaleString()} RWF`,
      pageW
    );

    let cy = drawStatBoxes(doc, [
      { label: "Items",         value: catItems.length,            color: C.blue  },
      { label: "Low Stock",     value: catLow,                     color: C.amber },
      { label: "Total Qty",     value: catQty,                     color: [20,184,166] },
      { label: "Value (RWF)",   value: catValue.toLocaleString(),  color: C.green },
    ], 37, pageW);

    const tableBody = catItems.map((item, idx) => {
      const total  = (item.unitPrice || 0) * (item.currentQuantity || 0);
      const isLow  = (item.currentQuantity || 0) <= (item.minStockLevel || 0) && (item.minStockLevel || 0) > 0;
      const qtyCell = isLow
        ? { __text: String(item.currentQuantity || 0), __color: C.rose, __bold: true }
        : String(item.currentQuantity || 0);
      const condCell = isLow
        ? { __text: "LOW STOCK", __color: C.rose, __bold: true }
        : safe(item.condition);

      return [
        idx + 1,
        { __text: safe(item.name), __bold: true },
        safe(item.assetType?.replace(/_/g, " ")),
        qtyCell,
        safe(item.unit),
        condCell,
        safe(item.location),
        item.unitPrice ? `${(item.unitPrice).toLocaleString()}` : "-",
        total > 0 ? { __text: `${total.toLocaleString()}`, __color: C.green, __bold: true } : "-",
      ];
    });

    const totalQtyFoot = catItems.reduce((s, i) => s + (i.currentQuantity || 0), 0);

    drawTable(doc, {
      head: ["#", "Item Name", "Type", "Qty", "Unit", "Condition", "Location", "Unit Price", "Total Value"],
      body: tableBody,
      foot: ["", "TOTAL", "", totalQtyFoot, "", "", "", "", `${catValue.toLocaleString()} RWF`],
      startY: cy,
      pageW,
      colWidths: [8, 46, 28, 13, 13, 32, 28, 24, 28],
      colAligns: ["center", "left", "left", "center", "center", "left", "left", "right", "right"],
    });

    drawPageFooter(doc, catIdx + 2, totalPages, pageW, pageH);
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Items_Report_${dateStr}.pdf`);
};

// ════════════════════════════════════════════════════════════════════════════
//  Generic PDF (for other pages)
// ════════════════════════════════════════════════════════════════════════════
export const exportToPDF = (data, columns, title, filename) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  drawPageHeader(doc, title, `${data.length} records`, pageW);

  const body = data.map((row) => columns.map((col) => safe(row[col.key])));
  const colW  = columns.map(() => (pageW - 24) / columns.length);

  drawTable(doc, {
    head: columns.map((c) => c.label),
    body,
    startY: 38,
    pageW,
    colWidths: colW,
  });

  drawPageFooter(doc, 1, 1, pageW, pageH);
  doc.save(`${filename}.pdf`);
};

// ════════════════════════════════════════════════════════════════════════════
//  Excel
// ════════════════════════════════════════════════════════════════════════════
export const exportToExcel = (data, columns, filename) => {
  const worksheetData = [
    columns.map((col) => col.label),
    ...data.map((row) => columns.map((col) => row[col.key] || "-")),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook  = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  const maxWidth = columns.map((_, idx) => {
    let max = columns[idx].label.length;
    data.forEach((row) => {
      const val = String(row[columns[idx].key] || "-").length;
      if (val > max) max = val;
    });
    return { wch: Math.min(max + 2, 30) };
  });
  worksheet["!cols"] = maxWidth;
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// ════════════════════════════════════════════════════════════════════════════
//  CSV
// ════════════════════════════════════════════════════════════════════════════
export const exportToCSV = (data, columns, filename) => {
  const headers = columns.map((col) => col.label).join(",");
  const rows = data.map((row) =>
    columns.map((col) => {
      let value = row[col.key] || "-";
      if (typeof value === "string" && value.includes(",")) value = `"${value}"`;
      return value;
    }).join(",")
  );
  const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${filename}.csv`);
};