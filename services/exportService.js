import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Export to PDF
export const exportToPDF = (data, columns, title, filename) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  
  // Add header
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text(title, 14, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  
  // Prepare table data
  const tableData = data.map(row => columns.map(col => row[col.key] || "-"));
  
  // Add table
  doc.autoTable({
    head: [columns.map(col => col.label)],
    body: tableData,
    startY: 40,
    theme: "striped",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 10,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [240, 248, 255],
    },
    margin: { top: 40, left: 14, right: 14 },
  });
  
  doc.save(`${filename}.pdf`);
};

// Export to Excel
export const exportToExcel = (data, columns, filename) => {
  const worksheetData = [
    columns.map(col => col.label),
    ...data.map(row => columns.map(col => row[col.key] || "-"))
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  
  // Auto-size columns
  const maxWidth = columns.map((_, idx) => {
    let max = columns[idx].label.length;
    data.forEach(row => {
      const val = String(row[columns[idx].key] || "-").length;
      if (val > max) max = val;
    });
    return { wch: Math.min(max + 2, 30) };
  });
  worksheet["!cols"] = maxWidth;
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Export to CSV
export const exportToCSV = (data, columns, filename) => {
  const headers = columns.map(col => col.label).join(",");
  const rows = data.map(row => 
    columns.map(col => {
      let value = row[col.key] || "-";
      if (typeof value === "string" && value.includes(",")) {
        value = `"${value}"`;
      }
      return value;
    }).join(",")
  );
  
  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${filename}.csv`);
};