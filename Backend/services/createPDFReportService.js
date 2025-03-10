import PDFDocument from "pdfkit";
import fs from "fs";
import { createCanvas } from "canvas";
import Chart from "chart.js/auto";

// Date formatting helper
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

// Chart generation functions
const generatePieChart = (report) => {
  return new Promise((resolve) => {
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext("2d");

    new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Income", "Expenses"],
        datasets: [{
          data: [report.totalIncome, report.totalExpense],
          backgroundColor: ["#2ecc71", "#e74c3c"]
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    resolve(canvas.toBuffer("image/png"));
  });
};

const generateBarChart = (report) => {
  return new Promise((resolve) => {
    const canvas = createCanvas(500, 300);
    const ctx = canvas.getContext("2d");

    const labels = Object.keys(report.categoryBreakdown || {});
    const incomeData = labels.map(label => report.categoryBreakdown?.[label]?.income || 0);
    const expenseData = labels.map(label => report.categoryBreakdown?.[label]?.expense || 0);

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { 
            label: "Income", 
            data: incomeData, 
            backgroundColor: "#2ecc71",
            barThickness: 30
          },
          { 
            label: "Expense", 
            data: expenseData, 
            backgroundColor: "#e74c3c",
            barThickness: 30
          }
        ]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        scales: {
          y: { 
            beginAtZero: true,
            ticks: { callback: value => `$${value}` }
          }
        },
        plugins: {
          legend: { position: 'top' }
        }
      }
    });

    resolve(canvas.toBuffer("image/png"));
  });
};

export const createPDFReport = async (report, filePath) => {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Financial calculations
    const totalIncome = report.totalIncome ?? 0;
    const totalExpense = report.totalExpense ?? 0;
    const netBalance = report.netBalance ?? (totalIncome - totalExpense);

    // Header Section
    doc.fillColor("#2c3e50")
       .fontSize(24)
       .text("Financial Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12)
       .text(`Date Range: ${formatDate(report.startDate)} - ${formatDate(report.endDate)}`, { align: "center" });
    doc.moveDown(1.5);

    // Financial Summary
    doc.fillColor("#333333")
       .font("Helvetica-Bold")
       .fontSize(16)
       .text("Financial Summary");
    doc.moveDown(0.75);
    
    doc.font("Helvetica")
       .fontSize(12)
       .fillColor("#333333")
       .text(`Total Income:   $${totalIncome.toFixed(2)}`, { continued: true })
       .fillColor("#2ecc71")
       .text(" ▲", { continued: false })
       .moveDown(0.5);
    
    doc.fillColor("#333333")
       .text(`Total Expense:  $${totalExpense.toFixed(2)}`, { continued: true })
       .fillColor("#e74c3c")
       .text(" ▼", { continued: false })
       .moveDown(0.5);
    
    doc.fillColor("#333333")
       .text(`Net Balance:    $${netBalance.toFixed(2)}`)
       .moveDown(2);

    // Charts Section
    try {
      const pieChartBuffer = await generatePieChart(report);
      const barChartBuffer = await generateBarChart(report);

    // Pie Chart
    doc.y = 250; 
    doc.fillColor("#333333")
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("Income vs. Expenses");
    doc.moveDown(1);
    doc.image(pieChartBuffer, {
    fit: [300, 250],
    align: "center"
    });
    doc.moveDown(2);

    doc.y = doc.y + 250;
    doc.fillColor("#333333")
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("Category Breakdown");
    doc.moveDown(1);
    doc.image(barChartBuffer, {
    fit: [300, 250],
    align: "center"
    });
    doc.moveDown(2);
    } catch (chartError) {
      console.error("Chart Generation Error:", chartError);
      reject(chartError);
    }

    doc.end();
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};



export const createPDFSummary = async (report, filePath, currency) => {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
  
      // Header Section (Blue and Bold)
      doc.fillColor("#000000") // Blue color
         .font("Helvetica-Bold") // Bold font
         .fontSize(24)
         .text("Financial Summary Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(12)
         .text(`Date Range: ${formatDate(report.startDate)} - ${formatDate(report.endDate)}`, { align: "center" });
      doc.moveDown(1.5);
  
      // Financial Summary Section
      doc.fillColor("#333333")
         .font("Helvetica-Bold")
         .fontSize(16)
         .text("Financial Summary");
      doc.moveDown(0.75);
  
      doc.font("Helvetica")
         .fontSize(12)
         .fillColor("#333333")
         .text(`Total Income:   ${currency} ${report.totalIncome.toFixed(2)}`, { continued: true })
         .fillColor("#2ecc71")
         .text(" ▲", { continued: false })
         .moveDown(0.5);
  
      doc.fillColor("#333333")
         .text(`Total Expense:  ${currency} ${report.totalExpense.toFixed(2)}`, { continued: true })
         .fillColor("#e74c3c")
         .text(" ▼", { continued: false })
         .moveDown(0.5);
  
      doc.fillColor("#333333")
         .text(`Net Balance:    ${currency} ${report.netBalance.toFixed(2)}`)
         .moveDown(2);
  
      // Transaction Details Section
      doc.fillColor("#333333")
         .font("Helvetica-Bold")
         .fontSize(16)
         .text("Transaction Details");
      doc.moveDown(1);
  
      // Table Header (Bold and Blue)
      doc.font("Helvetica-Bold")
         .fontSize(10)
         .fillColor("#0000FF") // Blue color
         .text("Date", 50, doc.y, { width: 100, align: "left" })
         .text("Category", 150, doc.y, { width: 150, align: "left" })
         .text("Type", 300, doc.y, { width: 100, align: "left" })
         .text("Amount", 400, doc.y, { width: 100, align: "right" });
      doc.moveDown(0.5);
  
      // Table Rows
      doc.font("Helvetica")
         .fontSize(10)
         .fillColor("#333333");
  
      let y = doc.y; // Track the Y position for each row
      report.transactions.forEach((tx) => {
        doc.text(formatDate(tx.date), 50, y, { width: 100, align: "left" })
           .text(tx.category, 150, y, { width: 150, align: "left" })
           .text(tx.type, 300, y, { width: 100, align: "left" })
           .text(`${currency} ${tx.amount.toFixed(2)}`, 400, y, { width: 100, align: "right" });
        y += 20; // Move down for the next row
      });
  
      // End the document
      doc.end();
  
      // Resolve with the file path once the PDF is generated
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });
  };