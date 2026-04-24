import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import path from "path";
import qs from "qs";
import { envVars } from "./app/config/env";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { IndexRoutes } from "./app/routes/index";
import { PaymentController } from "./app/module/payment/payment.controller";

const app: Application = express();
app.set("query parser", (str: string) => qs.parse(str));
app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`));

app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleStripeWebhookEvent,
);

// Middleware

app.use(cors({
  origin: envVars.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));



// app.use(cors({
//   origin: true,
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"]
// }));


// app.use((req, res, next) => {
//   if (req.method === 'OPTIONS') {

//     if (origin) {
//     res.header('Access-Control-Allow-Origin', origin);
//   }

//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     return res.status(200).json({});
//   }
//   next();
// });

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Routes
app.use("/api/v1", IndexRoutes);

// Basic health-check route
app.get("/", async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});

// Error handling
app.use(globalErrorHandler);
app.use(notFound);

export default app;


// don't use corn, multer, soket.io etc (scheduling, file uploader, soket) in this project as it is not required and will add unnecessary complexity to the codebase.