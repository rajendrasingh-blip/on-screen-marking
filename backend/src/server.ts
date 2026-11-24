import dotenv from "dotenv";
dotenv.config();

import { connectDatabase } from "./config/db";
import app from "./app";

const PORT =
    Number(process.env.PORT) || 5001;

const startServer = async () => {
    try {
        await connectDatabase();
        app.listen(PORT, () => {
            console.log(`Server start successfully on the port:${PORT}`)
        })
    }
    catch (err) {
        console.error(err, 'failed to start server');
        process.exit(1);
    }
}

startServer();