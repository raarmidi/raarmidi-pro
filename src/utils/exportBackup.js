import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * Excel Backup Export
 * products + reservations
 */


export const exportBackup = (products, reservations) => {
  try {
    // PRODUCTS SHEET
    const productSheet = XLSX.utils.json_to_sheet(
      products.map((p) => ({
        ID: p.id,
        Ürün: p.name,
        // Beden: p.size,
        // Durum: p.status,
        // Oluşturulma: p.created_at,
      }))
    );

    // RESERVATIONS SHEET
    const reservationSheet = XLSX.utils.json_to_sheet(
      reservations.map((r) => ({
        ID: r.id,
        ÜrünID: r.product_id,
        Müşteri: r.customer_name,
        Telefon: r.phone,
        TC: r.tc_no,
        Başlangıç: r.start_date,
        Bitiş: r.end_date,
        Deposito: r.deposit_amount,
        Durum: r.status,
      }))
    );
// PRODUCTS SHEET için sütun genişlikleri (Sırasıyla: ID, Ürün)
productSheet["!cols"] = [
  { wch: 10 }, // A sütunu (ID) genişliği
  { wch: 30 }  // B sütunu (Ürün) genişliği
];

// RESERVATIONS SHEET için sütun genişlikleri (Sırasıyla tablodaki başlıkların)
reservationSheet["!cols"] = [
  { wch: 10 }, // ID
  { wch: 10 }, // ÜrünID
  { wch: 25 }, // Müşteri
  { wch: 15 }, // Telefon
  { wch: 15 }, // TC
  { wch: 15 }, // Başlangıç
  { wch: 15 }, // Bitiş
  { wch: 12 }, // Deposito
  { wch: 15 }  // Durum
];
    // Workbook
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, productSheet, "Ürünler");
    XLSX.utils.book_append_sheet(workbook, reservationSheet, "Rezervasyonlar");

    // Excel oluştur
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(data, `backup-${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (err) {
    console.error("Backup error:", err);
    alert("Yedek alınamadı!");
  }
};