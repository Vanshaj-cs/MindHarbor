import multer from "multer";
import { ApiError } from "../utils/apiError.js";

const ALLOWED_MIMETYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_SIZE_MB = 10;

// Store in memory (buffer) — we pipe straight to Cloudinary, no disk write
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Unsupported file type: ${file.mimetype}. Allowed: JPG, PNG, WEBP, PDF`,
      ),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

// Single file field named "syllabusImage"
export const uploadSyllabusImage = upload.single("syllabusImage");

// Error wrapper — converts multer errors to ApiError
export const handleUploadError = (err, _req, _res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(
        new ApiError(400, `File too large. Max size is ${MAX_SIZE_MB}MB.`),
      );
    }
    return next(new ApiError(400, `Upload error: ${err.message}`));
  }
  next(err);
};
