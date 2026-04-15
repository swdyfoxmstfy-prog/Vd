console.log("server starting...");

const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

// فولدر الرفع
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// multer setup
const upload = multer({
    dest: uploadDir,
    limits: {
        fileSize: 200 * 1024 * 1024 // 200MB
    }
});

// API تحويل فيديو لصوت
app.post("/convert", upload.single("video"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded");
    }

    const inputPath = req.file.path;
    const outputName = Date.now() + ".mp3";
    const outputPath = path.join(uploadDir, outputName);

    ffmpeg(inputPath)
        .toFormat("mp3")
        .on("end", () => {
            res.download(outputPath, "audio.mp3", (err) => {
                // تنظيف الملفات بعد التحميل
                fs.unlink(inputPath, () => {});
                fs.unlink(outputPath, () => {});
            });
        })
        .on("error", (err) => {
            console.log("FFmpeg error:", err);

            fs.unlink(inputPath, () => {});
            res.status(500).send("Conversion error");
        })
        .save(outputPath);
});

// تشغيل السيرفر
const PORT = 3000;
app.listen(PORT, () => {
    console.log("server running on http://localhost:" + PORT);
});