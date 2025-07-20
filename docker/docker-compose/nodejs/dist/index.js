"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const app = (0, express_1.default)();
const MONGO_URI = process.env.MONGO_URI;
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => console.log('Successfull'))
    .catch((err) => console.log(err));
app.get('/ping', (req, res) => {
    res.send('pong');
});
app.listen(3000, () => console.log('Server has started'));
