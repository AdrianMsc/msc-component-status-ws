import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import dotenv from "dotenv";
import { nanoid } from "nanoid";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadCompressedImage = async (buffer, componentName) => {
  if (!process.env.AWS_S3_BUCKET_NAME) {
    throw new Error("No S3 bucket defined in environment variables");
  }

  const compressedBuffer = await sharp(buffer)
    .resize({ width: 1024 })
    .toFormat("webp", { quality: 80 })
    .toBuffer();

  const shortId = nanoid(8);
  const sanitizedComponentName = componentName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/gi, "");

  const key = `components/msc-${sanitizedComponentName}-${shortId}.webp`;

  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: compressedBuffer,
    ContentType: "image/webp",
  });

  await s3.send(uploadCommand);

  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

export const overwriteImage = async (buffer, key) => {
  if (!process.env.AWS_S3_BUCKET_NAME) {
    throw new Error("No S3 bucket defined in environment variables");
  }

  const compressedBuffer = await sharp(buffer)
    .resize({ width: 1024 })
    .toFormat("webp", { quality: 80 })
    .toBuffer();

  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: compressedBuffer,
    ContentType: "image/webp",
  });

  await s3.send(uploadCommand);

  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

export const deleteImageFromS3 = async (key) => {
  if (!process.env.AWS_S3_BUCKET_NAME) {
    throw new Error("No S3 bucket defined in environment variables");
  }

  const deleteCommand = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  });

  await s3.send(deleteCommand);

  return `Image with key '${key}' has been deleted.`;
};
