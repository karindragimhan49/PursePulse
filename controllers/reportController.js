import { StatusCodes } from "http-status-codes";
import Transaction from "../models/transactionModel.js";
import Report from "../models/reportModel.js";
import { createPDFReport,  createPDFSummary  } from "../services/createPDFReportService.js";
import { convertToBaseCurrency, convertFromBaseCurrency } from "../services/currencyService.js";
import path from "path";
import fs from "fs";

/**
 * Generate Financial Report with charts summery
 */
export const generateReport = async (req, res) => {
    try {
      const { startDate, endDate, format = "json" } = req.query;
      const userId = req.user.userId;
  
      // Build query filter
      let filter = { userId };
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }
  
      // Fetch transactions
      const transactions = await Transaction.find(filter);
  
      // Ensure financial values have default values if transactions are empty
      const totalIncome = transactions.length
        ? transactions.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0)
        : 0;
  
      const totalExpense = transactions.length
        ? transactions.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0)
        : 0;
  
      const netBalance = totalIncome - totalExpense;
  
      // Category-wise spending breakdown
      const categoryBreakdown = {};
      transactions.forEach((tx) => {
        if (!categoryBreakdown[tx.category]) {
          categoryBreakdown[tx.category] = { income: 0, expense: 0 };
        }
        categoryBreakdown[tx.category][tx.type] += tx.amount;
      });
  
      // Save report in DB
      const report = await Report.create({
        userId,
        reportType: "custom",
        startDate,
        endDate,
        totalIncome,
        totalExpense,
        netBalance,
        categoryBreakdown,
      });
  
      // Return JSON report
      if (format === "json") {
        return res.status(StatusCodes.OK).json({
          msg: "Report generated successfully",
          data: { totalIncome, totalExpense, netBalance, categoryBreakdown },
        });
      }
  
      // Generate PDF report
      const pdfPath = path.join("reports", `report_${report._id}.pdf`);
      await createPDFReport(report, pdfPath);
  
      // Send PDF as response
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=report_${report._id}.pdf`);
      fs.createReadStream(pdfPath).pipe(res);
  
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: "Error generating report", error: error.message });
    }
  };

//------------------------ generate report with filter----------------------------
export const generateSummaryReport = async (req, res) => {
    try {
      const { startDate, endDate, category, tags, currency = "USD", format = "json" } = req.query;
      const userId = req.user.userId;
  
      // Build query filter
      let filter = { userId };
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }
      if (category) filter.category = category;
      if (tags) filter.tags = { $in: tags.split(",") };
  
      // Fetch transactions
      const transactions = await Transaction.find(filter);
  
      // Compute financial summary
      let totalIncome = transactions
        .filter((tx) => tx.type === "income")
        .reduce((sum, tx) => sum + tx.amount, 0);
  
      let totalExpense = transactions
        .filter((tx) => tx.type === "expense")
        .reduce((sum, tx) => sum + tx.amount, 0);
  
      let netBalance = totalIncome - totalExpense;
  
      // Convert amounts to the desired currency (if needed)
      if (currency !== "LKR") {
        totalIncome = await convertFromBaseCurrency(totalIncome, currency);
        totalExpense = await convertFromBaseCurrency(totalExpense, currency);
        netBalance = await convertFromBaseCurrency(netBalance, currency);
      }
  
      // Prepare report data
      const reportData = {
        startDate,
        endDate,
        totalIncome,
        totalExpense,
        netBalance,
        transactions: await Promise.all(
          transactions.map(async (tx) => ({
            date: tx.date,
            category: tx.category,
            type: tx.type,
            amount: currency === "LKR" ? tx.amount : await convertFromBaseCurrency(tx.amount, currency),
          }))
        ),
      };
  
      // Generate PDF if requested
      if (format === "pdf") {
        const reportDir = path.resolve("reports");
        if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);
        const pdfFilePath = path.join(reportDir, `summary_report_${Date.now()}.pdf`);
  
        await createPDFSummary(reportData, pdfFilePath, currency); // Pass currency here
  
        // Send PDF as response
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=summary_report_${Date.now()}.pdf`);
        fs.createReadStream(pdfFilePath).pipe(res);
      } else {
        // Return JSON report
        res.status(StatusCodes.OK).json({
          msg: "Summary report generated successfully",
          data: reportData,
        });
      }
    } catch (error) {
      console.error("Error generating summary report:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        msg: "Error generating summary report",
        error: error.message,
      });
    }
  };