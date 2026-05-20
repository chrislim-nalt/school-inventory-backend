import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ← correct named import for v3+
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ─── Helpers ────────────────────────────────────────────────────────────────

// Strip emojis so jsPDF (which uses built-in fonts) doesn't render boxes
const clean = (val) => {
  if (val == null) return "-";
  return String(val)
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")  // emoji ranges
    .replace(/[^\x00-\x7F]/g, "")             // any remaining non-ASCII
    .trim() || "-";
};

const fmtDate = () =>
  new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

const fmtTime = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// ─── Brand colours ───────────────────────────────────────────────────────────
const BRAND = {
  navy:       [15,  23,  42],   // slate-900
  blue:       [99,  102, 241],  // indigo-500
  blueLight:  [165, 180, 252],  // indigo-300
  teal:       [20,  184, 166],  // teal-500
  green:      [16,  185, 129],  // emerald-500
  amber:      [245, 158,  11],  // amber-500
  rose:       [244,  63,  94],  // rose-500
  white:      [255, 255, 255],
  offWhite:   [248, 250, 252],  // slate-50
  stripe:     [241, 245, 249],  // slate-100
  muted:      [100, 116, 139],  // slate-500
  dark:       [30,  41,  59],   // slate-800
};

// ─── Draw the page header (logo bar + report title) ─────────────────────────
function drawHeader(doc, title, subtitle, pageW) {
  // Top colour bar
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, pageW, 22, "F");

  // School icon placeholder (filled circle)
  doc.setFillColor(...BRAND.blue);
  doc.circle(14, 11, 6, "F");
  doc.setTextColor(...BRAND.white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("SI", 14, 13, { align: "center" }); // "School Inventory"

  // School name
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.white);
  doc.text("G.S AGATEKO", 25, 9);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.blueLight);
  doc.text("School Inventory Management System", 25, 15);

  // Date / time — right side
  doc.setFontSize(7);
  doc.setTextColor(...BRAND.blueLight);
  doc.text(`${fmtDate()}  •  ${fmtTime()}`, pageW - 14, 11, { align: "right" });

  // Report title band
  doc.setFillColor(...BRAND.blue);
  doc.rect(0, 22, pageW, 12, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.white);
  doc.text(title, 14, 30);

  if (subtitle) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.blueLight);
    doc.text(subtitle, pageW - 14, 30, { align: "right" });
  }
}

// ─── Draw page footer ────────────────────────────────────────────────────────
function drawFooter(doc, pageNum, totalPages, pageW, pageH) {
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, pageH - 10, pageW, 10, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.blueLight);
  doc.text("Confidential — G.S AGATEKO School Inventory", 14, pageH - 3.5);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageW - 14, pageH - 3.5, { align: "right" });
}

// ─── Summary stat box ────────────────────────────────────────────────────────
function drawSummaryBox(doc, stats, startY, pageW) {
  const boxH = 22;
  const margin = 14;
  const cols = stats.length;
  const boxW = (pageW - margin * 2) / cols;

  stats.forEach((s, i) => {
    const x = margin + i * boxW;

    // Background
    doc.setFillColor(...BRAND.offWhite);
    doc.roundedRect(x + 1, startY, boxW - 2, boxH, 2, 2, "F");

    // Accent left stripe
    doc.setFillColor(...s.color);
    doc.roundedRect(x + 1, startY, 3, boxH, 1, 1, "F");

    // Label
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    doc.text(s.label, x + 7, startY + 7);

    // Value
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.dark);
    doc.text(String(s.value), x + 7, startY + 17);
  });

  return startY + boxH + 6;
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN: Export Items to PDF  (grouped by category, professional layout)
// ════════════════════════════════════════════════════════════════════════════
export const exportItemsToPDF = (items, schoolName = "G.S AGATEKO") => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── Group items by category ──────────────────────────────────────────────
  const grouped = {};
  items.forEach((item) => {
    const cat = item.category?.name || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });
  const sortedCats = Object.keys(grouped).sort();

  // ── Global stats ─────────────────────────────────────────────────────────
  const totalValue = items.reduce(
    (s, i) => s + (i.unitPrice || 0) * (i.currentQuantity || 0), 0
  );
  const lowStock = items.filter(
    (i) => (i.currentQuantity || 0) <= (i.minStockLevel || 0)
  ).length;

  const globalStats = [
    { label: "Total Items",      value: items.length,                          color: BRAND.blue  },
    { label: "Categories",       value: sortedCats.length,                     color: BRAND.teal  },
    { label: "Low Stock Alerts", value: lowStock,                              color: BRAND.amber },
    { label: "Total Value (RWF)",value: totalValue.toLocaleString(),           color: BRAND.green },
  ];

  // ════════════════════════════════════════════════════════════════════════
  //  PAGE 1 — Cover / Summary
  // ════════════════════════════════════════════════════════════════════════
  drawHeader(doc, "Items Inventory Report", `${items.length} items across ${sortedCats.length} categories`, pageW);

  let y = 40;

  // Summary stats
  y = drawSummaryBox(doc, globalStats, y, pageW);

  // Category breakdown table
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.dark);
  doc.text("CATEGORY BREAKDOWN", 14, y);
  y += 4;

  const catTableData = sortedCats.map((cat) => {
    const catItems = grouped[cat];
    const catValue = catItems.reduce(
      (s, i) => s + (i.unitPrice || 0) * (i.currentQuantity || 0), 0
    );
    const catLow = catItems.filter(
      (i) => (i.currentQuantity || 0) <= (i.minStockLevel || 0)
    ).length;
    return [
      clean(cat),
      catItems.length,
      catItems.reduce((s, i) => s + (i.currentQuantity || 0), 0),
      catLow > 0 ? `${catLow} LOW` : "OK",
      `${catValue.toLocaleString()} RWF`,
    ];
  });

  autoTable(doc, {
    head: [["Category", "Items", "Total Qty", "Stock Status", "Total Value"]],
    body: catTableData,
    startY: y,
    margin: { left: 14, right: 14 },
    theme: "grid",
    headStyles: {
      fillColor: BRAND.navy,
      textColor: BRAND.white,
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: BRAND.stripe },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "center", cellWidth: 25 },
      3: { halign: "center", cellWidth: 30,
           textColor: BRAND.amber },
      4: { halign: "right", cellWidth: 45, fontStyle: "bold", textColor: BRAND.green },
    },
    didParseCell: (data) => {
      if (data.column.index === 3 && data.section === "body") {
        const v = String(data.cell.raw);
        data.cell.styles.textColor = v.includes("LOW") ? BRAND.rose : BRAND.green;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Footer page 1
  drawFooter(doc, 1, sortedCats.length + 1, pageW, pageH);

  // ════════════════════════════════════════════════════════════════════════
  //  PAGES 2+ — One page per category
  // ════════════════════════════════════════════════════════════════════════
  sortedCats.forEach((catName, catIdx) => {
    doc.addPage();

    const catItems = grouped[catName];
    const catValue = catItems.reduce(
      (s, i) => s + (i.unitPrice || 0) * (i.currentQuantity || 0), 0
    );
    const catLow = catItems.filter(
      (i) => (i.currentQuantity || 0) <= (i.minStockLevel || 0)
    ).length;

    drawHeader(
      doc,
      `Category: ${clean(catName)}`,
      `${catItems.length} items  •  Total Value: ${catValue.toLocaleString()} RWF`,
      pageW
    );

    // Per-category mini stats
    const catStats = [
      { label: "Items in Category", value: catItems.length,              color: BRAND.blue  },
      { label: "Low Stock",         value: catLow,                       color: BRAND.amber },
      { label: "Total Quantity",    value: catItems.reduce((s, i) => s + (i.currentQuantity || 0), 0), color: BRAND.teal },
      { label: "Category Value",    value: `${catValue.toLocaleString()} RWF`, color: BRAND.green },
    ];

    let cy = drawSummaryBox(doc, catStats, 40, pageW);

    // Items table for this category
    const tableData = catItems.map((item, idx) => {
      const total = (item.unitPrice || 0) * (item.currentQuantity || 0);
      const isLow = (item.currentQuantity || 0) <= (item.minStockLevel || 0);
      return [
        idx + 1,
        clean(item.name),
        clean(item.assetType?.replace(/_/g, " ")),
        item.currentQuantity || 0,
        clean(item.unit),
        isLow ? "LOW STOCK" : clean(item.condition),
        clean(item.location),
        item.unitPrice ? `${(item.unitPrice || 0).toLocaleString()}` : "-",
        total > 0 ? `${total.toLocaleString()}` : "-",
      ];
    });

    autoTable(doc, {
      head: [["#", "Item Name", "Type", "Qty", "Unit", "Condition / Status", "Location", "Unit Price", "Total Value"]],
      body: tableData,
      startY: cy,
      margin: { left: 14, right: 14 },
      theme: "striped",
      headStyles: {
        fillColor: BRAND.blue,
        textColor: BRAND.white,
        fontSize: 7.5,
        fontStyle: "bold",
        cellPadding: 3,
      },
      bodyStyles: { fontSize: 7.5, cellPadding: 2.5, textColor: BRAND.dark },
      alternateRowStyles: { fillColor: BRAND.stripe },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { cellWidth: 48, fontStyle: "bold" },
        2: { cellWidth: 28 },
        3: { halign: "center", cellWidth: 14 },
        4: { halign: "center", cellWidth: 14 },
        5: { cellWidth: 32 },
        6: { cellWidth: 28 },
        7: { halign: "right", cellWidth: 24 },
        8: { halign: "right", cellWidth: 28, fontStyle: "bold" },
      },
      didParseCell: (data) => {
        if (data.section === "body") {
          // Low stock → red qty
          if (data.column.index === 3) {
            const row = catItems[data.row.index];
            if (row && (row.currentQuantity || 0) <= (row.minStockLevel || 0)) {
              data.cell.styles.textColor = BRAND.rose;
              data.cell.styles.fontStyle = "bold";
            }
          }
          // Condition / status col
          if (data.column.index === 5) {
            const v = String(data.cell.raw);
            if (v === "LOW STOCK") {
              data.cell.styles.textColor = BRAND.rose;
              data.cell.styles.fontStyle = "bold";
            } else if (v === "Good condition" || v === "New") {
              data.cell.styles.textColor = BRAND.green;
            }
          }
          // Total value col — green
          if (data.column.index === 8 && data.cell.raw !== "-") {
            data.cell.styles.textColor = BRAND.green;
          }
        }
      },
      // Sub-total row
      foot: [[
        "", "TOTAL", "", 
        catItems.reduce((s, i) => s + (i.currentQuantity || 0), 0),
        "", "", "", "",
        `${catValue.toLocaleString()} RWF`,
      ]],
      footStyles: {
        fillColor: BRAND.navy,
        textColor: BRAND.white,
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 3,
      },
    });

    drawFooter(doc, catIdx + 2, sortedCats.length + 1, pageW, pageH);
  });

  // ── Save ─────────────────────────────────────────────────────────────────
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Items_Report_${dateStr}.pdf`);
};

// ════════════════════════════════════════════════════════════════════════════
//  Generic PDF  (kept for other pages in your system)
// ════════════════════════════════════════════════════════════════════════════
export const exportToPDF = (data, columns, title, filename) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  drawHeader(doc, title, `${data.length} records`, pageW);

  const tableData = data.map((row) =>
    columns.map((col) => clean(row[col.key]))
  );

  autoTable(doc, {
    head: [columns.map((col) => col.label)],
    body: tableData,
    startY: 40,
    margin: { left: 14, right: 14 },
    theme: "striped",
    headStyles: { fillColor: BRAND.blue, textColor: BRAND.white, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: BRAND.stripe },
  });

  drawFooter(doc, 1, 1, pageW, pageH);
  doc.save(`${filename}.pdf`);
};

// ════════════════════════════════════════════════════════════════════════════
//  Excel & CSV  (unchanged logic, kept for compatibility)
// ════════════════════════════════════════════════════════════════════════════
export const exportToExcel = (data, columns, filename) => {
  const worksheetData = [
    columns.map((col) => col.label),
    ...data.map((row) => columns.map((col) => row[col.key] || "-")),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
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

export const exportToCSV = (data, columns, filename) => {
  const headers = columns.map((col) => col.label).join(",");
  const rows = data.map((row) =>
    columns
      .map((col) => {
        let value = row[col.key] || "-";
        if (typeof value === "string" && value.includes(",")) value = `"${value}"`;
        return value;
      })
      .join(",")
  );
  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${filename}.csv`);
};