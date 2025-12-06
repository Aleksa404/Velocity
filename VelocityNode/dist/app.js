"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const users_1 = __importDefault(require("./routes/users"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const videos_1 = __importDefault(require("./routes/videos"));
const trainerRequests_1 = __importDefault(require("./routes/trainerRequests"));
const trainers_1 = __importDefault(require("./routes/trainers"));
const workshops_1 = __importDefault(require("./routes/workshops"));
require("./YoutubeUploadMQ/videoWorker");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
const PORT = process.env.PORT || 5000;
// Middleware
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
//routes
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/videos", videos_1.default);
app.use("/api/trainer-requests", trainerRequests_1.default);
app.use("/api/trainers", trainers_1.default);
app.use("/api/workshops", workshops_1.default);
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map