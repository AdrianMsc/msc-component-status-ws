# MSC Component Status Creation

![MSC LOGO](https://adrianmsc.github.io/msc-tailwind-theme/assets/msc-logo.svg) <span style="font-size:2.3rem">**| FUEL DESIGN SYSTEM**</span>

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)

Backend API to manage Design System component status: components CRUD, platform/resources handling (Figma, Guidelines, CDN, Storybook), feedback inbox, and Neon Postgres database. Deployable on Vercel.

## Prerequisites

- **Node.js**: Version 18 or higher.
- **Neon Postgres**: A database instance on Neon.
- **Vercel**: Account for Blob storage (optional for local, but needed for image uploads).
- **Auth0**: Account for authentication.

## Local setup and run

1. Clone the repo
2. Navigate to `fds-dev-back/`
3. Install dependencies: `npm install`
4. Set up environment variables:
   - Create `.env` file based on `.env.example`
   - Provide a valid `DATABASE_URL`
5. Start the development server: `npm run dev`

Base URL: `http://localhost:4242`

## Scripts

- **`npm run dev`**: start the API in development mode (hot reload)
- **`npm start`**: start the API in production mode

## Database migrations

This project stores SQL migrations under `migrations/`.

- `001_users_sessions.sql`: users + sessions auth foundation.
- `002_activity_logs.sql`: component activity changelog (create/update/delete events).

`002_activity_logs.sql` is additive-only (`CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS`) and does not remove existing data.

## Environment variables

Create a `.env` file based on `.env.example`. The following variables are supported:

### Required
- `DATABASE_URL`: Neon Postgres connection string.
- `OIDC_ISSUER_URL`: The discovery URL for your OIDC provider (e.g., Auth0).
- `OIDC_CLIENT_ID`: Your OIDC client ID.
- `OIDC_REDIRECT_URI`: The callback URL (e.g., `http://localhost:4242/auth/callback`).
- `OIDC_ISSUER`: Base URL of the OIDC issuer (used for JWKS).
- `OIDC_AUDIENCE`: The API identifier/audience.

### Optional (with defaults)
- `PORT`: Server port (defaults to `4242`).
- `NODE_ENV`: `development` or `production`.
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed origins.
- `CORS_ALLOW_CREDENTIALS`: Allow credentials in CORS (defaults to `true`).
- `SESSION_COOKIE_NAME`: Name of the session cookie (defaults to `sid`).
- `SESSION_COOKIE_SAMESITE`: `lax`, `strict`, or `none` (defaults to `lax`). **Note:** Must be `none` if the frontend and backend are on different domains.
- `SESSION_TTL_DAYS`: Session duration in days (defaults to `7`).
- `OIDC_CLIENT_SECRET`: Client secret for OIDC (if needed).
- `OIDC_SCOPE`: Requested scopes (defaults to `"openid profile email"`).
- `OIDC_PROVIDER_NAME`: Name used in logs/internal mapping (defaults to `"oidc"`).
- `OIDC_END_SESSION_URL`: URL to redirect for IDP logout.
- `OIDC_POST_LOGOUT_REDIRECT_URI`: Redirect after IDP logout.
- `AUTH_REDIRECT_AFTER_LOGIN`: Local redirect after successful login (defaults to `/`).
- `AUTH_REDIRECT_AFTER_LOGOUT`: Local redirect after logout (defaults to `/`).
- `BLOB_READ_WRITE_TOKEN`: Token for Vercel Blob storage (required for image uploads).

## Project structure

- **`index.js`**: Express app bootstrap (middlewares, static assets, and route mounting)
- **`src/routes/`**: Express routers
- **`src/controllers/`**: Request/response handlers (validation + orchestration)
- **`src/services/`**: Business logic + transformations + external integrations
- **`src/models/`**: Database access layer (SQL queries)
- **`src/middlewares/`**: Cross-cutting Express middleware (rate limiting, multer, etc.)
- **`public/`**: Static files served by Express

## Static HTML pages (public + lab)

This API also serves static HTML files from `public/`.

- **Static assets** are served via `express.static(publicDir)`.
- **HTML routes** are defined in `src/routes/staticHtml.routes.js` using MSC style:
  - Routes: `src/routes/staticHtml.routes.js`
  - Controller: `src/controllers/staticHtml.controller.js`
  - Service: `src/services/staticHtml.service.js`

### Available HTML routes

- **GET** `/` serves `public/index.html`
- **GET** `/lab/pdp-v2` serves `public/lab/pdp-v2/pdp.html`
- **GET** `/lab/homepage-v2` serves `public/lab/homepage-v2/homepage-v2.html`

### Add a new lab HTML route

1. Create your HTML under `public/lab/<folder>/<file>.html`
2. Add a route in `src/routes/staticHtml.routes.js`:

```js
router.get("/lab/<your-path>", getLabPage("<folder>/<file>.html"));
```

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

#### Component History (Admin only)

Returns component CRUD activity records for audit/changelog purposes.

- **GET** `/components/history`
- **Auth**: required (`admin` role)
- **Query params** (optional):
  - `page` (default: `1`)
  - `pageSize` (default: `20`, max: `100`)
  - `action` (`component.created` | `component.updated` | `component.deleted`)
  - `componentId` (number)
  - `startDate` (`YYYY-MM-DD` or ISO datetime)
  - `endDate` (`YYYY-MM-DD` or ISO datetime)

- **Response**:

```json
{
  "data": [
    {
      "id": 1,
      "entity": "component",
      "action": "component.updated",
      "component_id": 10,
      "actor_user_id": 2,
      "actor_email": "admin@company.com",
      "actor_role": "admin",
      "details": { "before": {}, "after": {} },
      "created_at": "2026-04-07T17:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
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
