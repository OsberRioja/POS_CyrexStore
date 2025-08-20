import express from "express";
import router from "./routes";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());
app.use("/api", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening http://localhost:${PORT}/api`));
