import express from "express";
import cors from "cors";
import path from "path";
import router from "./routes/index";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.RONTEND_URL || "http://osm.indiaresults.com/",
    credentials: true
}))

app.use(express.json())

const pdfjsWasmPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "wasm"
);

app.use(
    "/pdfjs/wasm",
    express.static(pdfjsWasmPath)
);


app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(cookieParser());
app.get("/api/health", (_req, res) => { res.json({ sucess: true, message: "OSM API is running" }) });

app.use(
    "/api",
    router
);

export default app;