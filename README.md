# MSC Component Status Creation

![MSC LOGO](https://adrianmsc.github.io/msc-tailwind-theme/assets/msc-logo.svg) <span style="font-size:2.3rem">**| FUEL DESIGN SYSTEM**</span>

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)

Backend API to manage Design System component status: components CRUD, platform/resources handling (Figma, Guidelines, CDN, Storybook), feedback inbox, and Neon Postgres database. Deployable on Vercel.

## Resource model (Statuses & Links)

Each component has:

- **Statuses** (table `statuses`): `guidelines`, `figma`, `storybook`, `cdn`
- **Platform links** (table `platform_links`): `figmaLink`, `storybookLink`

Notes:

- The API **does not validate** a strict enum for status values; they are stored as strings. The UI typically uses values like `"✅"`, `"construction"`, `"deprecated"`, etc.
- There are currently **no dedicated link fields** for Guidelines/CDN. Only **Figma** and **Storybook** links are persisted.

## Architecture: Model-Service-Controller (MSC)

This project follows the **Model-Service-Controller** architecture to ensure scalability and maintainability.

- **Model Layer (`src/models`)**: Handles direct database interactions (SQL queries).
- **Service Layer (`src/services`)**: Encapsulates business logic and data transformation.
- **Controller Layer (`src/controllers`)**: Manages HTTP requests and responses.

## Tech stack

- **Express 4**
- **Neon Postgres** via `@neondatabase/serverless`

## API Endpoints & Usage

Base URL: `http://localhost:4242`

### 1. General

#### Handshake

Checks if the server is running.

- **GET** `/handshake`
- **Response**: `"👍"`

### 2. Components

#### Get All Components (Detailed)

Fetches all components grouped by category.

- **GET** `/components`
- **Response**:

```json
[
  {
    "category": "Foundations",
    "components": [
      {
        "id": 1,
        "name": "Colors",
        "description": "Brand colors",
        "image": null,
        "statuses": [
          { "guidelines": "✅", "figma": "✅", "storybook": "✅", "cdn": "✅" }
        ]
      }
    ]
  }
]
```

#### Get Component Names

Fetches a list of just component names.

- **GET** `/allcomponents`
- **Response**: `[{"name": "Button"}, {"name": "Input"}]`

#### Get Component Count

- **GET** `/count`
- **Response**: `{"count": 42}`

#### Create Component

Creates a new component.

- **POST** `/categories/:category/components`
- **Content-Type**: `multipart/form-data`
- **Parameters**: `category` (URL param, e.g., `Foundations`)
- **Body**:
  - `name` (required): "Button"
  - `description`: "Primary button"
  - `atomicType`: "atom"
  - `comment`: "Internal notes"
  - `figma`: "✅"
  - `guidelines`: "construction"
  - `cdn`: "✅"
  - `storybook`: "✅"
  - `figmaLink`: "https://figma.com/..."
  - `storybookLink`: "https://your-storybook-url/..."
  - `image`: (optional file) image to upload to Vercel Blob
- **Example**:

```bash
curl -X POST "http://localhost:4242/categories/Foundations/components" \
  -F 'name=Button' \
  -F 'description=Main CTA' \
  -F 'image=@/path/to/image.png'
```

#### Update Component

Updates component details.

- **PUT** `/categories/:category/components/:id`
- **Content-Type**: `multipart/form-data`
- **Body**: Same fields as Create.
- **Example**:

```bash
curl -X PUT "http://localhost:4242/categories/Foundations/components/1" \
  -F 'name=Button Updated' \
  -F 'image=@/path/to/new-image.png'
```

#### Upload Image (Vercel Blob)

Uploads an image to Vercel Blob without creating a component.

- **POST** `/uploads/images`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `image` (required file)
- **Response**:

```json
{
  "message": "Image uploaded successfully.",
  "url": "https://...",
  "pathname": "uploads/....png",
  "contentType": "image/png",
  "size": 12345
}
```

- **Example**:

```bash
curl -X POST "http://localhost:4242/uploads/images" \
  -F 'image=@/path/to/image.png'
```

#### Update Resources (Status/Links)

Partially updates just the status or link fields.

- **PUT** `/components/resources/:id`
- **Content-Type**: `application/json`
- **Body**:

```json
{
  "figma": "✅",
  "storybook": "deprecated",
  "figmaLink": "https://new-link.com",
  "storybookLink": "https://new-storybook-link.com"
}
```

### 4. Storybook guidelines

This API tracks Storybook in two ways:

- **Status**: `storybook` (in `statuses`)
- **Link**: `storybookLink` (in `platform_links`)

Recommended usage pattern:

- If a component is implemented and documented in Storybook, set `storybook` to something like `"✅"` and provide `storybookLink`.
- If it is planned/in progress, set `storybook` to `"construction"` (or your chosen convention) and omit `storybookLink`.
- If it is no longer supported, set `storybook` to `"deprecated"` and optionally keep the last `storybookLink` for reference.

### 5. CDN

CDN tracking is currently **status-only** via the `cdn` field in `statuses`.

Recommended usage pattern:

- Use `cdn` to indicate whether the component/assets are published/available via your CDN.
- If you need to store a CDN URL per component, the current schema does not include a `cdnLink` field; you can either:
  - Add it to the database/schema in a future change, or
  - Store the URL in `comment`/`description` temporarily (not recommended for long term).

#### Delete Component

Deletes component and its related records.

- **DELETE** `/components/:id`
- **Response**: `{"message": "Component, related records, and image erased successfully."}`

### 3. Inbox (Feedback)

#### Get Messages

- **GET** `/inbox`
- **Response**:

```json
[
  {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com",
    "message": "Nice work!",
    "created_at": "..."
  }
]
```

#### Send Message

- **POST** `/message`
- **Content-Type**: `application/json`
- **Body**:

```json
{
  "name": "Bob",
  "email": "bob@example.com",
  "message": "Found a bug in Button",
  "status": "unread"
}
```

#### Delete Message

- **DELETE** `/message/:id`
- **Response**: `{"response": "Message deleted successfully", "id": "1"}`

## Local setup and run

1. Clone the repo
2. `npm install`
3. Create `.env` file (see Environment Variables)
4. `npm run dev`

## Environment variables

- `DATABASE_URL` (Neon Postgres)
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob)

## Postman: how to test image uploads

Base URL: `http://localhost:4242`

### Upload Image (Blob only)

- **Method**: `POST`
- **URL**: `{{baseUrl}}/uploads/images`
- **Body**:
  - Select `form-data`
  - Add key `image`
  - Change type to `File`
  - Pick an image file

### Create Component with image

- **Method**: `POST`
- **URL**: `{{baseUrl}}/categories/Foundations/components`
- **Body**:
  - Select `form-data`
  - Add key `name` (Text)
  - Optional keys like `description`, `comment`, `atomicType`, etc.
  - Add key `image` (File)

### Update Component with image

- **Method**: `PUT`
- **URL**: `{{baseUrl}}/categories/Foundations/components/:id`
- **Body**:
  - Select `form-data`
  - Include `name` (Text)
  - Add key `image` (File) to replace the current image
