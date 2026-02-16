import sharp from "sharp";

const DEFAULT_QUALITY = 80;

export const convertImageBufferToWebp = async (buffer, { quality } = {}) => {
  if (!buffer) {
    throw new Error("Image buffer is required.");
  }

  const webpBuffer = await sharp(buffer)
    .webp({ quality: quality ?? DEFAULT_QUALITY })
    .toBuffer();

  return {
    buffer: webpBuffer,
    contentType: "image/webp",
    extension: "webp",
  };
};
