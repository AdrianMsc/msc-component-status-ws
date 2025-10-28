# MSC Component Status Creation

![MSC LOGO](https://adrianmsc.github.io/msc-tailwind-theme/assets/msc-logo.svg) <span style="font-size:2.3rem">**| FUEL DESIGN SYSTEM**</span>

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)

Backend API to manage Design System component status: components CRUD, platform/resources handling (Figma, Guidelines, CDN, Storybook), feedback inbox, image storage on S3, and Neon Postgres database. Deployable on Vercel.

## Tech stack

- **Express 4**
- **Neon Postgres** via `@neondatabase/serverless`
- **AWS S3** (`@aws-sdk/client-s3`) + image compression with `sharp`
- **multer** (memoryStorage) for `multipart/form-data`
- **express-rate-limit**, **cors**, **morgan**

## Prerequisites

- Node.js 18+ and npm
- Account/credentials for Neon Postgres and AWS S3

## Local setup and run

1. Clone the repo
2. Install dependencies: `npm install`
3. Create a `.env` file at the project root with environment variables (see below)
4. Start in development: `npm run dev`
5. Local production: `npm start`

Default server: `http://localhost:4242`

## Environment variables

- `PORT` (optional, default 4242)
- `DATABASE_URL` (Neon connection string)
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET_NAME`

## Middlewares and limits

- **JSON body**: `express.json()`
- **CORS**: enabled for all origins (adjust if needed)
- **Rate limit**: 100 requests per 15 minutes per IP
- **Logger**: `morgan("dev")`
- **Uploads**: `multer.memoryStorage()` with manual validation in controller
  - Only `image/*`
  - Max size: **5 MB**
  - Compressed to **WebP** with max width 1024px

## S3 storage

- Upload/update: images are compressed and uploaded to S3 with key `components/msc-<sanitized-name>-<id8>.webp`
- Update: if the component already has an image, it is overwritten at the same key
- Delete: when deleting a component, its image is attempted to be deleted from S3 (if present)

## Database

Using Neon Postgres via `@neondatabase/serverless` with `DATABASE_URL`.

Tables used by the code:

- **component**: `id, name, category, comment, description, image, created_at, updated_at`
- **statuses**: `comp_id, figma, guidelines, cdn, storybook`
- **platform_links**: `comp_id, figma, storybook`
- **feedback**: `id, name, email, message, status, read, created_at`

## Routes and examples

Base URL: `http://localhost:4242`

### Healthcheck

- **GET** `/handshake`
  - Response: `"👍"`

### Components

- **GET** `/allcomponents`
  - Response: `[{ "name": "Button" }, { "name": "Input" }, ... ]`

- **GET** `/count`
  - Response: `{ "count": 42 }`

- **GET** `/components`
  - Category summary with statuses and links:
  - Example response:

```json
[
  {
    "category": "Foundations",
    "components": [
      {
        "id": 1,
        "name": "Colors",
        "description": "...",
        "category": "Foundations",
        "comment": "Comment",
        "image": "https://<bucket>.s3.<region>.amazonaws.com/components/msc-colors-xxxx.webp",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "storybookLink": "https://...",
        "figmaLink": "https://...",
        "statuses": [
          { "guidelines": "✅", "figma": "✅", "storybook": "✅", "cdn": "✅" }
        ]
      }
    ]
  }
]
```

- **POST** `/categories/:category/components`
  - Creates a component. Supports `multipart/form-data` with file field `image` (optional).
  - URL param: `category`
  - Body fields (text):
    - `name` (required)
    - `comment` (optional)
    - `description` (optional)
    - `figma`, `guidelines`, `cdn`, `storybook` (optional, string/emoji values)
    - `figmaLink`, `storybookLink` (optional)
  - Image rules: `image/*`, max 5MB
  - Responses:
    - 201: `{ "message": "Component created successfully.", "componentId": <number>, "imageUrl": "https://..." | null }`
    - 400: `{ "error": "Required fields: name and category." }` or `{ "error": "Only image files are allowed." }` or `{ "error": "Image size exceeds 5MB." }`

`curl` example with image:

```bash
curl -X POST "http://localhost:4242/categories/Foundations/components" \
  -F "name=Colors" \
  -F "description=Brand colors" \
  -F "figma=✅" -F "guidelines=✅" -F "cdn=✅" -F "storybook=✅" \
  -F "figmaLink=https://figma.com/file/..." \
  -F "storybookLink=https://storybook.example.com/?path=/story/..." \
  -F "image=@/path/to/image.png"
```

- **PUT** `/categories/:category/components/:id`
  - Updates a component. Accepts `multipart/form-data` and may include `image` to overwrite/create the S3 image.
  - Requires: `name`, `category`, `id`
  - Supported fields: `comment`, `description`, `figma`, `guidelines`, `cdn`, `storybook`, `figmaLink`, `storybookLink`
  - Responses:
    - 200: `{ "message": "Component, statuses, and platform links updated successfully." }`
    - 400: `{ "error": "Required fields: name, category, and id." }`
    - 404: `{ "error": "Component not found." }`

- **PUT** `/components/resources/:id`
  - Partial update for resources/links only (JSON body). Any omitted field is not modified.
  - Optional body: `figma`, `guidelines`, `cdn`, `storybook`, `figmaLink`, `storybookLink`
  - Responses:
    - 200: `{ "message": "Component resources updated successfully.", "updated": { "statuses": true|false, "links": true|false } }`
    - 400: `{ "error": "No valid fields provided to update." }`

- **DELETE** `/components/:id`
  - Deletes the component, its related statuses/links, and if present, its image in S3.
  - Responses:
    - 200: `{ "message": "Component, related records, and image erased successfully." }`
    - 404: `{ "message": "Component not found." }` or `{ "message": "Component not found or could not be erased." }`

### Inbox (feedback)

- **GET** `/inbox`
  - Lists feedback. Response: array of `feedback` records.

- **POST** `/message`
  - Creates a feedback record.
  - JSON body:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "message": "Great DS!",
  "status": "pending", // optional
  "read": false // optional
}
```

- Responses:
  - 201: `{ "success": true, "message": "Message successfully added!", "data": { ... } }`
  - 400: `{ "success": false, "error": "Name, email, and message are required." }`

- **DELETE** `/message/:id`
  - Responses:
    - 200: `{ "response": "Message deleted successfully", "id": "<id>" }`
    - 404: `{ "error": "Message not found" }`

## Deployment notes (Vercel)

- Configured in `vercel.json` using `@vercel/node` with `index.js`
- Ensure environment variables are set in the Vercel project

## Scripts

- `npm run dev` — starts with nodemon
- `npm start` — starts with Node

## Troubleshooting

- 429 Too Many Requests: rate limiter exceeded (100/15min)
- 400 errors: validate required fields and types (e.g., invalid image or >5MB)
- 500 errors: check server logs and configuration for `DATABASE_URL` and AWS credentials
