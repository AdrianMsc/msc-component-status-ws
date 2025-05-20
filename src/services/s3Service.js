import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
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

export const uploadCompressedImage = async (buffer, filename) => {
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

export const overwriteImage = async (buffer, key) => {
  if (!process.env.AWS_S3_BUCKET_NAME) {
    throw new Error("No S3 bucket defined in environment variables");
  }

  const compressedBuffer = await sharp(buffer)
    .resize({ width: 1024 }) // puedes ajustar el tamaño si lo deseas
    .toFormat("jpeg", { quality: 80 }) // también puedes ajustar la calidad
    .toBuffer();

  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: compressedBuffer,
    ContentType: "image/jpeg",
  });

  await s3.send(uploadCommand);

  // Devolvemos la URL para confirmación o log (opcional)
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
