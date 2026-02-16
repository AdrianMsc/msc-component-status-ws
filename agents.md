# MSC Component Status API - Agent Configuration

## Project Overview

This is an **Express.js API** for managing Design System component status, built with the **Model-Service-Controller (MSC)** architecture pattern. The API provides CRUD operations for components, platform resource handling (Figma, Guidelines, CDN, Storybook), feedback inbox management, and integrates with Neon Postgres database and Vercel Blob storage.

## Architecture

### Model-Service-Controller (MSC) Pattern

- **Model Layer** (`src/models/`): Direct database interactions using Neon Postgres
- **Service Layer** (`src/services/`): Business logic, data transformation, and external service integrations
- **Controller Layer** (`src/controllers/`): HTTP request/response handling and validation

### Tech Stack

- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js 4.21.2
- **Database**: Neon Postgres via `@neondatabase/serverless`
- **File Storage**: Vercel Blob for image uploads
- **Security**: CORS, rate limiting, input validation
- **Deployment**: Vercel serverless functions
- **Development**: Nodemon for hot reloading

## Agent Skills Configuration

### Primary Skill: Express Production

**Skill File**: `.agents/skills/express-production/SKILL.md`

**Capabilities**:
- Production-ready Express.js development patterns
- Comprehensive middleware architecture
- Security hardening (Helmet, CORS, rate limiting)
- Error handling and logging strategies
- Testing frameworks and deployment patterns
- Environment-based configuration
- Graceful shutdown and zero-downtime deployments

**Reference Materials**:
- `references/middleware-patterns.md` - Middleware composition and architecture
- `references/security-hardening.md` - Security best practices and implementation
- `references/testing-strategies.md` - Comprehensive testing approaches
- `references/production-deployment.md` - Deployment and monitoring strategies

## API Endpoints

### Core Component Management

#### Component CRUD Operations
- `GET /components` - Get all components grouped by category with detailed status
- `GET /allcomponents` - Get simplified component names list
- `GET /count` - Get total component count
- `POST /categories/:category/components` - Create new component with image upload
- `PUT /categories/:category/components/:id` - Update component details
- `DELETE /components/:id` - Delete component and related records

#### Resource Management
- `PUT /components/resources/:id` - Update component status and platform links
- `POST /uploads/images` - Direct image upload to Vercel Blob

### Feedback System
- `GET /inbox` - Retrieve all feedback messages
- `POST /message` - Submit new feedback message
- `DELETE /message/:id` - Delete specific message

### System Health
- `GET /handshake` - Server health check

## Data Models

### Component Structure
```javascript
{
  id: number,
  name: string,
  description: string,
  category: string,
  atomicType: string,
  comment: string,
  image: string | null,
  statuses: [{
    guidelines: string,
    figma: string,
    storybook: string,
    cdn: string
  }],
  figmaLink: string,
  storybookLink: string,
  createdAt: string,
  updatedAt: string
}
```

### Status Convention
The API uses flexible string-based status values:
- `"✅"` - Complete/Available
- `"construction"` - In Progress
- `"deprecated"` - Deprecated
- Custom status strings supported

## Security & Production Features

### Implemented (Current)
- **CORS**: Enabled via `cors()` (default permissive configuration)
- **Rate Limiting**: Enabled globally via `express-rate-limit`
- **Input Validation**: Basic manual checks in controllers for required fields
- **File Upload**: Multer in-memory storage for `multipart/form-data` uploads
- **Environment Variables**: Loaded via `dotenv`
- **Logging**: `morgan("dev")`
- **Image Processing**: WebP conversion via `sharp` before storing in Vercel Blob

### Not Yet Implemented (Recommended for Production Hardening)
- **Centralized error handling** middleware (`app.use((err, req, res, next) => ...)`) with consistent error responses
- **Stricter CORS** configuration (allowed origins, methods, headers)
- **Security headers** (e.g. Helmet)
- **Request size limits** for `express.json()` / `express.urlencoded()`
- **Upload restrictions** (file type filtering, size limits)
- **Structured logging** (prod-safe format, request correlation)
- **Graceful shutdown** / process-level handlers (`SIGTERM`, `unhandledRejection`, `uncaughtException`) where applicable

## Development Workflow

### Local Development
```bash
npm install
npm run dev  # Starts server on http://localhost:4242
```

### Environment Variables
- `DATABASE_URL` - Neon Postgres connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `PORT` - Server port (default: 4242)

## Deployment Configuration

### Vercel Deployment
- **Serverless Functions**: Automatic deployment via `vercel.json`
- **File Storage**: Vercel Blob for image assets
- **Database**: Neon Postgres serverless
- **Environment**: Production environment variables configured

### Deployment Pipeline
1. Code push to main branch
2. Automatic Vercel build and deployment
3. Database migrations (if required)
4. Health checks and monitoring

## Agent Capabilities

### Code Generation
- Generate new CRUD endpoints following MSC pattern
- Create middleware for authentication, validation, logging
- Implement database models and service layers
- Add comprehensive error handling and validation

### Database Operations
- Design and implement SQL queries for complex data operations
- Create database migration scripts
- Optimize query performance and connection handling
- Implement data transformation and aggregation logic

### API Development
- RESTful API design and implementation
- Request/response validation and transformation
- File upload handling with security measures
- Rate limiting and throttling implementation

### Production Readiness
- Security hardening and vulnerability assessment
- Performance optimization and caching strategies
- Monitoring and logging implementation
- Graceful shutdown and error recovery

## Integration Points

### External Services
- **Neon Database**: Serverless Postgres for data persistence
- **Vercel Blob**: Scalable file storage for component images
- **Vercel Platform**: Serverless deployment and hosting

### Potential Extensions
- **Authentication**: JWT-based user authentication
- **Real-time Updates**: WebSocket integration for live status updates
- **Analytics**: Component usage tracking and reporting
- **CI/CD**: Automated testing and deployment pipelines

## Agent Usage Guidelines

### When to Engage This Agent
- Building Express.js APIs with MSC architecture
- Implementing CRUD operations with complex data relationships
- Setting up production-ready middleware stacks
- Integrating with serverless databases and storage
- Designing RESTful APIs with comprehensive error handling

### Best Practices
- Follow the established MSC pattern for consistency
- Implement comprehensive input validation
- Use environment-based configuration
- Add proper error handling and logging
- Test all endpoints with various scenarios
- Monitor performance and security metrics

### Code Style Standards
- ES6+ modules with async/await patterns
- Consistent naming conventions (camelCase for variables, PascalCase for classes)
- Comprehensive JSDoc documentation
- Proper error handling with meaningful messages
- Security-first approach to all implementations
