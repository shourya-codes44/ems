const XLSX = require("xlsx");

/**
 * Generate an Excel (.xlsx) buffer from JSON data
 * @param {Array<Object>} data - array of row objects
 * @param {string} sheetName - worksheet name
 * @returns {Buffer} - Excel file buffer
 */
const generateExcel = (data, sheetName = "Report") => {
  if (!data || data.length === 0) {
    data = [{ Message: "No data available" }];
  }

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

/**
 * Generate a CSV string from JSON data
 * @param {Array<Object>} data - array of row objects
 * @returns {string} - CSV content
 */
const generateCSV = (data) => {
  if (!data || data.length === 0) return "No data available";

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
};

/**
 * Send file download response
 * @param {Object} res - Express response
 * @param {Buffer|string} content - file content
 * @param {string} filename - download filename
 * @param {string} mimeType - content-type
 */
const sendFile = (res, content, filename, mimeType) => {
  res.set({
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Type": mimeType,
  });
  res.send(content);
};

module.exports = { generateExcel, generateCSV, sendFile };
