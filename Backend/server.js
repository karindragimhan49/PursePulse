import "express-async-errors";
import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();

// modules
import express from "express";
const app = express();
import morgan from "morgan";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import path from "path";
import helmet from "helmet";
import cron from "node-cron";

//import routers
import authRouter from "./routers/authRouter.js";
import transactionRouter from "./routers/transactionRouter.js"
import goalRouter from "./routers/goalRouter.js"
import adminRouter from "./routers/adminRouter.js"
import settingsRouter from "./routers/settingRouter.js"
import budgetRouter from "./routers/budgetRouter.js"
import reportRouter from "./routers/reportRouter.js"

//public
import { dirname } from "path";
import { fileURLToPath } from "url";

//middleware
import errorHandelerMiddleware from "./middleware/errorHandlerMiddleware.js";

//services
import { renewBudgets } from "./services/budgetService.js"; 
import { processRecurringTransactions, notifyUpcomingTransactions, notifyMissedTransactions } from "./services/recurringTransactionService.js";


const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(express.static(path.resolve(__dirname, "./Client/dist")));

app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(express.urlencoded({extended:true}));

//api routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/transaction",transactionRouter);
app.use("/api/v1/goal",goalRouter);
app.use("/api/v1/admin",adminRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/budget", budgetRouter);
app.use("/api/v1/report", reportRouter);

app.use("/api/v1/test", (req, res) => {
    res.status(200).json({ msg: "route test done" });
});

app.use(errorHandelerMiddleware);

const port = process.env.PORT || 5100;


(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database Connected");

        // Schedule Budget Renewal Task (Runs at 12:00 AM Daily)
        cron.schedule("0 0 * * *", async () => {
            console.log("Running Budget Renewal Task...");
            await renewBudgets();
        });

        // Process recurring transactions daily at 12:05 AM
        cron.schedule("5 0 * * *", async () => {
            console.log("Running Recurring Transaction Processing...");
            await processRecurringTransactions();
        });
        
        // Notify users of upcoming transactions daily at 9 AM
        cron.schedule("0 9 * * *", async () => {
            console.log("Sending Upcoming Transaction Notifications...");
            await notifyUpcomingTransactions();
        });
        
        // Notify users of missed transactions daily at 10 AM
        cron.schedule("0 10 * * *", async () => {
            console.log("Sending Missed Transaction Notifications...");
            await notifyMissedTransactions();
        });

        // (async () => {
        //     await processRecurringTransactions();
        //     await notifyUpcomingTransactions();
        //     await notifyMissedTransactions();
        //     console.log("Recurring transaction services executed.");
        // })();

        // Start Express Server
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

    } catch (error) {
        console.error("Database Connection Error:", error);
        process.exit(1);
    }
})();

