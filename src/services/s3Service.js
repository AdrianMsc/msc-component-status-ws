import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadCompressedImage = async (buffer, filename, mimetype) => {
  if (!process.env.AWS_S3_BUCKET_NAME) {
    throw new Error("No S3 bucket defined in environment variables");
  }

  const compressedBuffer = await sharp(buffer)
    .resize({ width: 1024 })
    .toFormat("jpeg", { quality: 80 })
    .toBuffer();

  const key = `components/${uuidv4()}-${filename.replace(/\s+/g, "_")}`;

  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: compressedBuffer,
    ContentType: "image/jpeg",
  });

  await s3.send(uploadCommand);

  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
