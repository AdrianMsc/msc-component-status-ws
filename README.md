# MSC Component Status Creation

![MSC LOGO](https://adrianmsc.github.io/msc-tailwind-theme/assets/msc-logo.svg) <span style="font-size:2.3rem">**| FUEL DESIGN SYSTEM**</span>

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)

Backend API to manage Design System component status: components CRUD, platform/resources handling (Figma, Guidelines, CDN, Storybook), feedback inbox, image storage on S3, and Neon Postgres database. Deployable on Vercel.

## Architecture: Model-Service-Controller (MSC)

This project follows the **Model-Service-Controller** architecture to ensure scalability and maintainability.

*   **Model Layer (`src/models`)**: Handles direct database interactions (SQL queries).
*   **Service Layer (`src/services`)**: Encapsulates business logic, data transformation, and external services (S3).
*   **Controller Layer (`src/controllers`)**: Manages HTTP requests and responses.

## Tech stack
- **Express 4**
- **Neon Postgres** via `@neondatabase/serverless`
- **AWS S3** (`@aws-sdk/client-s3`) + image compression with `sharp`
- **multer** (memoryStorage) for `multipart/form-data`

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
        "image": "https://bucket.s3.region.amazonaws.com/components/msc-colors-123.webp",
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
Creates a new component. Supports image upload.
- **POST** `/categories/:category/components`
- **Content-Type**: `multipart/form-data`
- **Parameters**: `category` (URL param, e.g., `Foundations`)
- **Body**:
    - `name` (required): "Button"
    - `description`: "Primary button"
    - `image`: (File, Optional, max 5MB)
    - `atomicyType`: "atom"
    - `figma`: "✅"
    - `guidelines`: "construction"
    - `figmaLink`: "https://figma.com/..."
- **Example**:
```bash
curl -X POST "http://localhost:4242/categories/Foundations/components" \
  -F "name=Button" \
  -F "description=Main CTA" \
  -F "image=@/path/to/image.png"
```

#### Update Component
Updates component details and optionally replaces the image.
- **PUT** `/categories/:category/components/:id`
- **Content-Type**: `multipart/form-data`
- **Body**: Same fields as Create.
- **Example**:
```bash
curl -X PUT "http://localhost:4242/categories/Foundations/components/1" \
  -F "name=Button Updated" \
  -F "category=Foundations" \
  -F "id=1"
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
  "figmaLink": "https://new-link.com"
}
```

#### Delete Component
Deletes component, its statuses, and its S3 image.
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
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`
