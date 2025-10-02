import express, { Request, Response } from "express";
import helmet, { contentSecurityPolicy } from "helmet";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import indexRoutes from "./routes/index.js";

const app = express();
const port = process.env.PORT || 3000;

// middleware

// security headers
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      ...contentSecurityPolicy.getDefaultDirectives(),
      // self and redoc cdn
      "script-src": ["'self'", "cdn.jsdelivr.net"],
      // self, google fonts, and inline styles for redoc
      "style-src": ["'self'", "fonts.googleapis.com", "'unsafe-inline'"],
      // self and google fonts
      "font-src": ["'self'", "fonts.gstatic.com"],
      // redoc cdn
      "img-src": ["'self'", "data:", "cdn.redoc.ly"],
      // allow self and redoc cdn
      "worker-src": ["'self'", "blob:"],
      // allow self and redoc cdn to fetch source maps
      "connect-src": ["'self'", "cdn.jsdelivr.net"],
    }
  }
};
app.use(helmet(helmetConfig));


// logger ('combined' - apache style)
app.use(morgan("combined"));

// cors config
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));

// parse JSON
app.use(express.json());

// parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// serve static files from public dir
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "..", 'public')));

// routes
app.use("/api", indexRoutes);

// health check
app.get("/", (_: Request, res: Response) => {
  res.send("Talento App is Running!");
});

// global error handler
app.use((err: any, _: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
  next();
});

app.listen(port, () => {
  console.log(`Server listening at port ${port}`);
});
