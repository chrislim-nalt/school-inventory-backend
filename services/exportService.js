// jspdf@2.5.1 + jspdf-autotable@3.8.2
// Import order matters: jspdf first, then autotable side-effect patches the prototype
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ─── Colours ─────────────────────────────────────────────────────────────────
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

// Strip emoji/non-ASCII (jsPDF built-in fonts are Latin only)
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

// ─── Page header ─────────────────────────────────────────────────────────────
function drawPageHeader(doc, title, subtitle, pageW) {
  // Navy top bar
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, pageW, 22, "F");

  // Blue circle icon
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

  // Blue title band
  doc.setFillColor(...C.blue);
  doc.rect(0, 22, pageW, 11, "F");
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
  doc.setFillColor(...C.navy);
  doc.rect(0, pageH - 9, pageW, 9, "F");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.blueLight);
  doc.text("Confidential — G.S AGATEKO School Inventory", 12, pageH - 3);
  doc.text(`Page ${pageNum} / ${totalPages}`, pageW - 12, pageH - 3, { align: "right" });
}

// ─── Stat boxes ───────────────────────────────────────────────────────────────
function drawStatBoxes(doc, stats, y, pageW) {
  const margin = 12;
  const gap = 2;
  const boxW = (pageW - margin * 2 - gap * (stats.length - 1)) / stats.length;
  const boxH = 20;

  stats.forEach((s, i) => {
    const x = margin + i * (boxW + gap);
    doc.setFillColor(...C.offWhite);
    doc.rect(x, y, boxW, boxH, "F");
    doc.setFillColor(...s.color);
    doc.rect(x, y, 3, boxH, "F");
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.rect(x, y, boxW, boxH, "S");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    doc.text(s.label, x + 6, y + 7);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text(String(s.value), x + 6, y + 16);
  });

  return y + boxH + 5;
}

// ════════════════════════════════════════════════════════════════════════════
//  Items PDF  — grouped by category
// ════════════════════════════════════════════════════════════════════════════
export const exportItemsToPDF = (items) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Group by category
  const grouped = {};
  items.forEach((item) => {
    const cat = item.category?.name || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });
  const sortedCats = Object.keys(grouped).sort();
  const totalPages = sortedCats.length + 1;

  const totalValue = items.reduce((s, i) => s + (i.unitPrice || 0) * (i.currentQuantity || 0), 0);
  const lowStock   = items.filter((i) => (i.currentQuantity || 0) <= (i.minStockLevel || 0) && (i.minStockLevel || 0) > 0).length;

  // ── PAGE 1: Summary ────────────────────────────────────────────────────
  drawPageHeader(doc,
    "Items Inventory Report",
    `${items.length} items  |  ${sortedCats.length} categories  |  ${fmtDate()}`,
    pageW
  );

  let y = drawStatBoxes(doc, [
    { label: "Total Items",        value: items.length,                color: C.blue },
    { label: "Categories",         value: sortedCats.length,           color: [20, 184, 166] },
    { label: "Low Stock Alerts",   value: lowStock,                    color: C.amber },
    { label: "Total Value (RWF)",  value: totalValue.toLocaleString(), color: C.green },
  ], 37, pageW);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("CATEGORY BREAKDOWN", 12, y + 3);
  y += 7;

  // Category summary table — using doc.autoTable (patched by side-effect import)
  doc.autoTable({
    head: [["Category", "Items", "Total Qty", "Stock Status", "Total Value (RWF)"]],
    body: sortedCats.map((cat) => {
      const ci = grouped[cat];
      const cv = ci.reduce((s, i) => s + (i.unitPrice || 0) * (i.currentQuantity || 0), 0);
      const cl = ci.filter((i) => (i.currentQuantity || 0) <= (i.minStockLevel || 0) && (i.minStockLevel || 0) > 0).length;
      return [
        safe(cat),
        ci.length,
        ci.reduce((s, i) => s + (i.currentQuantity || 0), 0),
        cl > 0 ? `${cl} LOW` : "OK",
        `${cv.toLocaleString()} RWF`,
      ];
    }),
    startY: y,
    margin: { left: 12, right: 12 },
    theme: "grid",
    headStyles: { fillColor: C.navy, textColor: C.white, fontSize: 8, fontStyle: "bold", cellPadding: 3 },
    bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: C.dark },
    alternateRowStyles: { fillColor: C.stripe },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "center", cellWidth: 25 },
      3: { halign: "center", cellWidth: 30 },
      4: { halign: "right",  cellWidth: 50, fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        data.cell.styles.textColor = String(data.cell.raw).includes("LOW") ? C.rose : C.green;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.section === "body" && data.column.index === 4) {
        data.cell.styles.textColor = C.green;
      }
    },
  });

  drawPageFooter(doc, 1, totalPages, pageW, pageH);

  // ── PAGES 2+: One per category ────────────────────────────────────────
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
      { label: "Items",          value: catItems.length,            color: C.blue },
      { label: "Low Stock",      value: catLow,                     color: C.amber },
      { label: "Total Qty",      value: catQty,                     color: [20, 184, 166] },
      { label: "Value (RWF)",    value: catValue.toLocaleString(),  color: C.green },
    ], 37, pageW);

    doc.autoTable({
      head: [["#", "Item Name", "Type", "Qty", "Unit", "Condition", "Location", "Unit Price", "Total Value"]],
      body: catItems.map((item, idx) => {
        const total = (item.unitPrice || 0) * (item.currentQuantity || 0);
        const isLow = (item.currentQuantity || 0) <= (item.minStockLevel || 0) && (item.minStockLevel || 0) > 0;
        return [
          idx + 1,
          safe(item.name),
          safe(item.assetType?.replace(/_/g, " ")),
          item.currentQuantity || 0,
          safe(item.unit),
          isLow ? "LOW STOCK" : safe(item.condition),
          safe(item.location),
          item.unitPrice ? `${(item.unitPrice).toLocaleString()}` : "-",
          total > 0 ? `${total.toLocaleString()} RWF` : "-",
        ];
      }),
      foot: [["", "TOTAL", "",
        catItems.reduce((s, i) => s + (i.currentQuantity || 0), 0),
        "", "", "", "", `${catValue.toLocaleString()} RWF`
      ]],
      startY: cy,
      margin: { left: 12, right: 12 },
      theme: "striped",
      headStyles: { fillColor: C.blue, textColor: C.white, fontSize: 7.5, fontStyle: "bold", cellPadding: 3 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2.5, textColor: C.dark },
      alternateRowStyles: { fillColor: C.stripe },
      footStyles: { fillColor: C.navy, textColor: C.white, fontStyle: "bold", fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { halign: "center", cellWidth: 9 },
        1: { cellWidth: 46, fontStyle: "bold" },
        2: { cellWidth: 28 },
        3: { halign: "center", cellWidth: 14 },
        4: { halign: "center", cellWidth: 14 },
        5: { cellWidth: 32 },
        6: { cellWidth: 28 },
        7: { halign: "right", cellWidth: 25 },
        8: { halign: "right", cellWidth: 30, fontStyle: "bold" },
      },
      didParseCell: (data) => {
        if (data.section === "body") {
          const item = catItems[data.row.index];
          if (!item) return;
          const isLow = (item.currentQuantity || 0) <= (item.minStockLevel || 0) && (item.minStockLevel || 0) > 0;
          if (data.column.index === 3 && isLow) {
            data.cell.styles.textColor = C.rose;
            data.cell.styles.fontStyle = "bold";
          }
          if (data.column.index === 5 && String(data.cell.raw) === "LOW STOCK") {
            data.cell.styles.textColor = C.rose;
            data.cell.styles.fontStyle = "bold";
          }
          if (data.column.index === 5 && (String(data.cell.raw) === "Good condition" || String(data.cell.raw) === "New")) {
            data.cell.styles.textColor = C.green;
          }
          if (data.column.index === 8 && data.cell.raw !== "-") {
            data.cell.styles.textColor = C.green;
          }
        }
      },
    });

    drawPageFooter(doc, catIdx + 2, totalPages, pageW, pageH);
  });

  doc.save(`Items_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ─── Generic PDF (other pages) ────────────────────────────────────────────────
export const exportToPDF = (data, columns, title, filename) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  drawPageHeader(doc, title, `${data.length} records`, pageW);

  doc.autoTable({
    head: [columns.map((c) => c.label)],
    body: data.map((row) => columns.map((col) => safe(row[col.key]))),
    startY: 38,
    margin: { left: 12, right: 12 },
    theme: "striped",
    headStyles: { fillColor: C.blue, textColor: C.white, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: C.stripe },
  });

  drawPageFooter(doc, 1, 1, pageW, pageH);
  doc.save(`${filename}.pdf`);
};

// ─── Excel ────────────────────────────────────────────────────────────────────
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

// ─── CSV ──────────────────────────────────────────────────────────────────────
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