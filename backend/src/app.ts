import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;

// middleware

// security headers
app.use(helmet());

// logger ('combined' - apache style)
app.use(morgan("combined"));

// cors config
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));

// parse JSON
app.use(express.json());

// parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

import index from "./routes/index.js";

// routes
app.use("/api", index);

// health check
app.get("/", (_: Request, res: Response) => {
  res.send("Talento App is Running!");
});

// global error handler
app.use((err: any, _: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
  next();
});

app.listen(port, () => {
  console.log(`Server listening at port ${port}`);
});
