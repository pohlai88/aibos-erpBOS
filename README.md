# AI-BOS ERP System

A modern, comprehensive Enterprise Resource Planning (ERP) system built with Next.js, TypeScript, and PostgreSQL, designed for enterprise-grade financial management, reporting, and business operations.

## 🏗️ Architecture Overview

This is a **monorepo** built with modern tooling and best practices:

- **Frontend**: Next.js 14.2.15 with React 19
- **Backend**: Next.js API routes with TypeScript
- **Database**: PostgreSQL 15 with Drizzle ORM
- **Package Manager**: pnpm with workspace management
- **Build System**: Turbo for monorepo builds
- **Containerization**: Docker & Docker Compose
- **Type Safety**: Full TypeScript coverage across all packages

## 📦 Package Structure

```
aibos-erpBOS/
├── apps/
│   ├── web/          # Frontend web application
│   ├── bff/          # Backend for Frontend (API)
│   └── worker/       # Background job processor
├── packages/
│   ├── api-client/   # Type-safe API client
│   ├── contracts/    # Shared data contracts & schemas
│   ├── services/     # Business logic services
│   ├── ports/        # Interface definitions
│   ├── policies/     # Business rules & policies
│   ├── posting-rules/ # Accounting posting rules
│   ├── db-adapter/   # Database abstraction layer
│   ├── sdk/          # Software Development Kit
│   ├── testing/      # Testing utilities
│   └── utils/        # Shared utilities
└── docker-compose.yml
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: Latest version
- **Docker**: For database and containerized builds
- **Git**: For version control

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/pohlai88/aibos-erpBOS.git
   cd aibos-erpBOS
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start the database**

   ```bash
   docker-compose up -d db
   ```

4. **Build all packages**

   ```bash
   pnpm build
   ```

5. **Start development servers**

   ```bash
   # Terminal 1: Start BFF API server
   pnpm --filter @aibos/bff dev

   # Terminal 2: Start Web frontend
   pnpm --filter @aibos/web dev
   ```

## 🐳 Docker Configuration

### Services

- **Database**: PostgreSQL 15 with persistent storage
- **BFF**: Backend API service with database connectivity
- **Health Checks**: Automatic service health monitoring

### Docker Commands

```bash
# Start all services
docker-compose up --build

# Start only database
docker-compose up -d db

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Environment Variables

The system uses the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode (development/production)

## 📋 Package Details

### Apps

#### `@aibos/web` - Frontend Application

- **Framework**: Next.js 14.2.15 with App Router
- **UI**: React 19 with TypeScript
- **Port**: 3001 (development)
- **Features**:
  - Static page generation
  - Client-side routing
  - API integration
  - Responsive design

#### `@aibos/bff` - Backend API

- **Framework**: Next.js 14.2.15 API Routes
- **Port**: 3000 (development)
- **Features**:
  - RESTful API endpoints
  - Database integration
  - Authentication & authorization
  - Business logic processing
  - 148+ API routes covering:
    - Financial reporting
    - Invoice management
    - Payment processing
    - Tax calculations
    - Budget management
    - Cash flow analysis

#### `@aibos/worker` - Background Jobs

- **Purpose**: Asynchronous task processing
- **Features**: Background job processing for heavy operations

### Packages

#### `@aibos/api-client` - API Client

- **Purpose**: Type-safe API communication
- **Features**: Generated TypeScript types, request/response handling

#### `@aibos/contracts` - Data Contracts

- **Purpose**: Shared data schemas and types
- **Features**: Zod schemas, TypeScript types, API contracts

#### `@aibos/services` - Business Logic

- **Purpose**: Core business operations
- **Features**:
  - Ledger management
  - Invoice posting
  - Financial calculations
  - Report generation

#### `@aibos/ports` - Interfaces

- **Purpose**: Dependency inversion interfaces
- **Features**: Repository patterns, service contracts

#### `@aibos/policies` - Business Rules

- **Purpose**: Business policy enforcement
- **Features**: Tax calculations, FX policies, validation rules

#### `@aibos/posting-rules` - Accounting Rules

- **Purpose**: Chart of accounts and posting logic
- **Features**: Account mapping, debit/credit rules

#### `@aibos/db-adapter` - Database Layer

- **Purpose**: Database abstraction
- **Features**: Drizzle ORM integration, transaction management

## 🔧 Configuration Files

### TypeScript Configuration

- **Base Config**: `tsconfig.base.json` - Shared compiler options
- **Module Resolution**: `Bundler` for Next.js compatibility
- **Strict Mode**: Enabled for type safety
- **Path Mapping**: Configured for monorepo imports

### Build Configuration

- **Turbo**: `turbo.json` - Monorepo build orchestration
- **Next.js**: `next.config.js` - Framework configuration
- **Package Manager**: `pnpm-workspace.yaml` - Workspace definition

### Docker Configuration

- **Compose**: `docker-compose.yml` - Multi-service orchestration
- **Dockerfile**: `apps/bff/Dockerfile` - Container build instructions
- **Ignore**: `.dockerignore` - Build context optimization

## 🏗️ Build System

### Package Build Process

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @aibos/web build

# Build with Docker (recommended)
docker-compose up --build
```

### Build Features

- **TypeScript Compilation**: Full type checking
- **Module Bundling**: Optimized for production
- **Static Generation**: Pre-rendered pages
- **Code Splitting**: Optimized bundle sizes
- **Tree Shaking**: Dead code elimination

## 🧪 Development Workflow

### Code Quality

- **TypeScript**: Strict type checking
- **ESLint**: Code linting (disabled during builds for speed)
- **Prettier**: Code formatting
- **Git Hooks**: Pre-commit validation

### Testing Strategy

- **Unit Tests**: Package-level testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user journey testing
- **Type Tests**: TypeScript type validation

### Version Management

- **Syncpack**: Monorepo version synchronization
- **Semantic Versioning**: Standard versioning scheme
- **Workspace Dependencies**: Internal package linking

## 📊 ERP Features

### Financial Management

- **General Ledger**: Complete accounting system
- **Accounts Receivable**: Customer invoice management
- **Accounts Payable**: Vendor invoice processing
- **Cash Management**: Bank reconciliation and forecasting
- **Fixed Assets**: Asset tracking and depreciation

### Reporting & Analytics

- **Financial Reports**: P&L, Balance Sheet, Cash Flow
- **Management Reports**: Budget vs Actual analysis
- **Tax Reports**: Compliance and filing support
- **Custom Reports**: Flexible reporting engine

### Business Operations

- **Invoice Processing**: Sales and purchase invoices
- **Payment Processing**: Automated payment workflows
- **Budget Management**: Planning and variance analysis
- **Multi-currency**: Foreign exchange handling
- **Audit Trail**: Complete transaction history

### Integration Capabilities

- **API-First**: RESTful API for all operations
- **Webhook Support**: Event-driven integrations
- **Import/Export**: Data migration tools
- **Third-party APIs**: External service integration

## 🔒 Security Features

- **Authentication**: JWT-based user authentication
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: API protection
- **Data Validation**: Input sanitization
- **Audit Logging**: Security event tracking

## 🚀 Deployment

### Production Build

```bash
# Build for production
docker-compose -f docker-compose.prod.yml up --build

# Or build locally
NODE_ENV=production pnpm build
```

### Environment Configuration

- **Development**: Local development with hot reload
- **Staging**: Pre-production testing environment
- **Production**: Optimized for performance and security

## 📈 Performance

### Optimization Features

- **Static Generation**: Pre-rendered pages for speed
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Next.js image optimization
- **Caching**: Strategic caching strategies
- **Database Indexing**: Optimized query performance

### Monitoring

- **Health Checks**: Service availability monitoring
- **Performance Metrics**: Response time tracking
- **Error Tracking**: Comprehensive error logging
- **Audit Logs**: Complete operation history

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and build
5. Submit a pull request

### Code Standards

- **TypeScript**: Strict typing required
- **Naming**: Clear, descriptive names
- **Documentation**: Comprehensive code comments
- **Testing**: Test coverage for new features

## 📚 Documentation

- **API Documentation**: Available at `/api/docs` (when running)
- **Type Definitions**: Full TypeScript coverage
- **Code Comments**: Inline documentation
- **Architecture Decisions**: Documented in `/docs`

## 🆘 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
pnpm clean
pnpm install
pnpm build
```

#### Database Connection Issues

```bash
# Restart database
docker-compose restart db

# Check database status
docker-compose ps
```

#### Type Errors

   ```bash
# Regenerate types
pnpm --filter @aibos/api-client build:types
```

### Getting Help

- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Documentation**: Check inline code documentation

## 🎯 Roadmap

### Phase 1: Core ERP (Current)

- ✅ Financial management
- ✅ Invoice processing
- ✅ Basic reporting
- ✅ User authentication

### Phase 2: Advanced Features

- 🔄 Advanced analytics
- 🔄 Workflow automation
- 🔄 Mobile application
- 🔄 Advanced integrations

### Phase 3: Enterprise Features

- 📋 Multi-tenant support
- 📋 Advanced security
- 📋 Custom reporting
- 📋 AI-powered insights

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Team

- **Development**: AI-BOS Development Team
- **Architecture**: Modern ERP Architecture
- **Technology**: Next.js, TypeScript, PostgreSQL

---

**Ready to build the future of ERP? Let's continue developing this state-of-the-art system!** 🚀

For questions or support, please contact the development team or create an issue in this repository.
