# MSC Component Status Creation

![MSC LOGO](https://adrianmsc.github.io/msc-tailwind-theme/assets/msc-logo.svg) <span style="font-size:2.3rem">**| FUEL DESIGN SYSTEM**</span>

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)![Render](https://adrianmsc.github.io/msc-tailwind-theme/assets/Render.svg)![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)

This API allows managing categories and components within a JSON file. Below are the available routes and how to make each request.

## Installation

<ol>
    <li>Clone the repository.</li>
    <li>Install dependencies with npm install.</li>
    <li>Start the server with node app.js.</li> 
</ol>

## Routes

### Create a New Category

**URL:**/categories

**Method:** POST

**Description:** Creates a new category.

#### Request Body:

```json
{
  "category": "NewCategory"
}
```

### Create a New Category

```json
{
  "category": "NewCategory",
  "components": []
}
```

### Create a New Component within a Category

**URL:** `/categories/:category/components`

**Method:** POST

**Description:** Creates a new component within an existing category.

#### URL Parameters:

`category:` The name of the category where the component will be added.

#### Request Body:

```json
{
  "name": "NewComponent",
  "statuses": [
    {
      "platform": "Figma",
      "status": "✅"
    },
    {
      "platform": "Guidelines",
      "status": "✅"
    },
    {
      "platform": "CDN",
      "status": "✅"
    },
    {
      "platform": "Storybook",
      "status": "✅"
    }
  ],
  "comment": "This is a new component"
}
```

#### Request Body:

```json
{
  "name": "NewComponent",
  "statuses": [
    {
      "platform": "Figma",
      "status": "✅"
    },
    {
      "platform": "Guidelines",
      "status": "✅"
    },
    {
      "platform": "CDN",
      "status": "✅"
    },
    {
      "platform": "Storybook",
      "status": "✅"
    }
  ],
  "comment": "This is a new component",
  "id": 1
}
```

### Read All Categories and Components

**URL:** `/components`
**Method:** GET
**Description:** Retrieves all categories and their components.

#### Successful Response:

```json
[
  {
    "category": "Foundations",
    "components": [
      {
        "name": "Colors",
        "statuses": [
          {
            "platform": "Figma",
            "status": "✅"
          },
          {
            "platform": "Guidelines",
            "status": "✅"
          },
          {
            "platform": "CDN",
            "status": "✅"
          },
          {
            "platform": "Storybook",
            "status": "✅"
          }
        ],
        "comment": "Comment",
        "id": 1
      }
    ]
  }
]
```

### Update a Component

**URL:** `/categories/:category/components/:id`

**Method:** PUT

**Description:** Updates an existing component within a category.

#### URL Parameters:

`category:` The name of the category.

`id:` The ID of the component to update.

#### Request Body:

```json
{
  "name": "UpdatedComponent",
  "statuses": [
    {
      "platform": "Figma",
      "status": "✅"
    },
    {
      "platform": "Guidelines",
      "status": "✅"
    }
  ],
  "comment": "Comment"
}
```

#### Successful Response:

```json
{
  "name": "UpdatedComponent",
  "statuses": [
    {
      "platform": "Figma",
      "status": "✅"
    },
    {
      "platform": "Guidelines",
      "status": "✅"
    }
  ],
  "comment": "Updated comment", // Coment updated
  "id": 1
}
```

### Delete a Component

**URL:** /categories/:category/components/:id

**Method:** DELETE

**Description:** Deletes a component from a category.

#### URL Parameters:

`category:` The name of the category.

`id:` The ID of the component to delete.

#### Successful Response:

```json
// No content
```
