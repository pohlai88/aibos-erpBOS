# 🏗️ AIBOS Clean Architecture Runbook Template

## 📋 Module: `<MODULE_NAME>` (M<MODULE_ID>)

**Status**: 🚧 **In Development**  
**Architecture Compliance**: ✅ **8-Layer Clean Architecture**  
**Last Updated**: `<DATE>`  
**Owner**: `<OWNER_NAME>`  

---

## 🎯 Executive Summary

### Business Value
- **Primary Function**: `<MODULE_DESCRIPTION>`
- **Business Impact**: `<BUSINESS_IMPACT>`
- **User Personas**: `<USER_PERSONAS>`
- **Success Metrics**: `<SUCCESS_METRICS>`

### Architecture Compliance
This module **strictly follows** the AIBOS 8-layer clean architecture:

```
DB → Adapters → Ports → Services → Policies → Contracts → API → UI
```

**✅ Zero architectural violations allowed**

---

## 🏗️ 8-Layer Architecture Implementation

### Layer 1: Database (DB)
**Location**: `packages/adapters/db/<module>/`
**Responsibility**: Data persistence, schema, migrations

```typescript
// packages/adapters/db/<module>/schema.ts
export const <entity>Table = pgTable('<entity>', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  // ... other fields
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// packages/adapters/db/<module>/migrations/
// 001_create_<entity>_table.sql
```

### Layer 2: Adapters
**Location**: `packages/adapters/<module>/`
**Responsibility**: External system integration, data transformation

```typescript
// packages/adapters/<module>/<entity>-adapter.ts
export class <Entity>Adapter {
  constructor(private db: Database) {}
  
  async create(data: Create<Entity>Data): Promise<<Entity>> {
    // Database operations
  }
  
  async findById(id: number): Promise<<Entity> | null> {
    // Database queries
  }
  
  async update(id: number, data: Update<Entity>Data): Promise<<Entity>> {
    // Database updates
  }
}
```

### Layer 3: Ports
**Location**: `packages/ports/<module>/`
**Responsibility**: Interface definitions, dependency inversion

```typescript
// packages/ports/<module>/<entity>-port.ts
export interface <Entity>Repository {
  create(data: Create<Entity>Data): Promise<<Entity>>;
  findById(id: number): Promise<<Entity> | null>;
  update(id: number, data: Update<Entity>Data): Promise<<Entity>>;
  delete(id: number): Promise<void>;
}

export interface <Entity>Service {
  create<Entity>(data: Create<Entity>Request): Promise<<Entity>Response>;
  get<Entity>(id: number): Promise<<Entity>Response>;
  update<Entity>(id: number, data: Update<Entity>Request): Promise<<Entity>Response>;
  delete<Entity>(id: number): Promise<void>;
}
```

### Layer 4: Services
**Location**: `packages/services/<module>/`
**Responsibility**: Business logic, domain rules

```typescript
// packages/services/<module>/<entity>-service.ts
export class <Entity>Service implements <Entity>Service {
  constructor(
    private repository: <Entity>Repository,
    private validator: <Entity>Validator
  ) {}
  
  async create<Entity>(data: Create<Entity>Request): Promise<<Entity>Response> {
    // 1. Validate input
    await this.validator.validateCreate(data);
    
    // 2. Business logic
    const entity = await this.repository.create(data);
    
    // 3. Return response
    return this.mapToResponse(entity);
  }
  
  private mapToResponse(entity: <Entity>): <Entity>Response {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      // ... other fields
    };
  }
}
```

### Layer 5: Policies
**Location**: `packages/policies/<module>/`
**Responsibility**: Business rules, validation, constraints

```typescript
// packages/policies/<module>/<entity>-policies.ts
export class <Entity>Policies {
  static validateCreate(data: Create<Entity>Data): void {
    if (!data.code || data.code.length < 3) {
      throw new ValidationError('Code must be at least 3 characters');
    }
    
    if (!data.name || data.name.length < 5) {
      throw new ValidationError('Name must be at least 5 characters');
    }
    
    // Business rule: Code must be unique
    // Business rule: Name cannot contain special characters
    // Business rule: Parent account must exist
  }
  
  static validateUpdate(data: Update<Entity>Data): void {
    // Update-specific validation rules
  }
}
```

### Layer 6: Contracts
**Location**: `packages/contracts/<module>/`
**Responsibility**: API contracts, types, schemas

```typescript
// packages/contracts/<module>/types.ts
export interface Create<Entity>Request {
  code: string;
  name: string;
  parentId?: number;
  // ... other fields
}

export interface <Entity>Response {
  id: number;
  code: string;
  name: string;
  parentId?: number;
  createdAt: string;
  updatedAt: string;
}

// packages/contracts/<module>/schemas.ts
export const create<Entity>Schema = z.object({
  code: z.string().min(3).max(50),
  name: z.string().min(5).max(255),
  parentId: z.number().optional(),
});

export const <entity>ResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  parentId: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

### Layer 7: API (BFF)
**Location**: `apps/bff/app/api/<module>/`
**Responsibility**: HTTP endpoints, request/response handling

```typescript
// apps/bff/app/api/<module>/route.ts
import { <Entity>Service } from '@aibos/services/<module>/<entity>-service';
import { <Entity>Adapter } from '@aibos/adapters/<module>/<entity>-adapter';
import { create<Entity>Schema } from '@aibos/contracts/<module>/schemas';

export async function POST(request: Request) {
  try {
    // 1. Parse and validate request
    const body = await request.json();
    const validatedData = create<Entity>Schema.parse(body);
    
    // 2. Initialize service with dependencies
    const adapter = new <Entity>Adapter(db);
    const service = new <Entity>Service(adapter, validator);
    
    // 3. Execute business logic
    const result = await service.create<Entity>(validatedData);
    
    // 4. Return response
    return Response.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  // Similar pattern for GET operations
}
```

### Layer 8: UI
**Location**: `apps/web/app/(dashboard)/<module>/`
**Responsibility**: User interface, user experience

```typescript
// apps/web/app/(dashboard)/<module>/page.tsx
'use client';

import { use<Entity>Query, useCreate<Entity> } from '@/hooks/<module>/<entity>-hooks';
import { <Entity>Form } from '@/components/<module>/<entity>-form';
import { <Entity>List } from '@/components/<module>/<entity>-list';

export default function <Module>Page() {
  const { data: entities, isLoading } = use<Entity>Query();
  const create<Entity> = useCreate<Entity>();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6"><Module> Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Create New <Entity></h2>
          <EntityForm onSubmit={create<Entity>.mutate} />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Existing <Entity>s</h2>
          <EntityList entities={entities} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
```

---

## 🚫 Architectural Violations Prevention

### ESLint Rules
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Prevent API layer from importing BFF internals
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['apps/bff/app/lib/*'],
            message: 'API layer cannot import BFF internals. Use Contracts layer instead.'
          },
          {
            group: ['apps/bff/app/services/*'],
            message: 'API layer cannot import BFF services. Use Services layer instead.'
          }
        ]
      }
    ],
    
    // Enforce layer boundaries
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './apps/bff/app/api/**',
            from: './apps/bff/app/lib/**',
            message: 'API routes cannot import BFF lib files'
          },
          {
            target: './apps/bff/app/api/**',
            from: './apps/bff/app/services/**',
            message: 'API routes cannot import BFF services'
          },
          {
            target: './packages/services/**',
            from: './apps/bff/**',
            message: 'Services cannot import BFF files'
          }
        ]
      }
    ]
  }
};
```

### Dependency Injection Pattern
```typescript
// packages/services/<module>/<entity>-service.ts
export class <Entity>Service {
  constructor(
    private repository: <Entity>Repository,  // Port interface
    private validator: <Entity>Validator,     // Policy interface
    private logger: Logger                   // Utility interface
  ) {}
  
  // Service implementation
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Each Layer)
```typescript
// packages/services/<module>/__tests__/<entity>-service.test.ts
describe('<Entity>Service', () => {
  let service: <Entity>Service;
  let mockRepository: jest.Mocked<<Entity>Repository>;
  let mockValidator: jest.Mocked<<Entity>Validator>;
  
  beforeEach(() => {
    mockRepository = createMockRepository();
    mockValidator = createMockValidator();
    service = new <Entity>Service(mockRepository, mockValidator);
  });
  
  describe('create<Entity>', () => {
    it('should create entity successfully', async () => {
      // Test implementation
    });
    
    it('should throw validation error for invalid data', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests
```typescript
// apps/bff/__tests__/api/<module>/<entity>.test.ts
describe('POST /api/<module>', () => {
  it('should create entity via API', async () => {
    const response = await request(app)
      .post('/api/<module>')
      .send({
        code: 'TEST001',
        name: 'Test Entity'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(Number),
      code: 'TEST001',
      name: 'Test Entity'
    });
  });
});
```

---

## 📊 Quality Gates

### Architecture Compliance
- [ ] **Zero ESLint violations** for architectural rules
- [ ] **All layers implemented** according to template
- [ ] **Dependency injection** used throughout
- [ ] **Interface segregation** followed

### Code Quality
- [ ] **90%+ test coverage** for all layers
- [ ] **TypeScript strict mode** enabled
- [ ] **ESLint passes** with zero warnings
- [ ] **Prettier formatting** applied

### Performance
- [ ] **API response time** < 200ms
- [ ] **Database queries** optimized
- [ ] **Bundle size** within limits
- [ ] **Memory usage** monitored

---

## 🚀 Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create database schema and migrations
- [ ] Implement adapter layer
- [ ] Define port interfaces
- [ ] Set up ESLint rules

### Phase 2: Business Logic (Week 2)
- [ ] Implement service layer
- [ ] Create policy validations
- [ ] Define contracts and schemas
- [ ] Write unit tests

### Phase 3: API & UI (Week 3)
- [ ] Implement API endpoints
- [ ] Create UI components
- [ ] Add integration tests
- [ ] Performance optimization

### Phase 4: Deployment (Week 4)
- [ ] Feature flag implementation
- [ ] Monitoring and alerts
- [ ] Documentation completion
- [ ] Production deployment

---

## 🔄 Rollback Procedures

### Immediate Rollback (< 5 minutes)
```bash
# Disable feature flag
pnpm feature:disable <MODULE>_NEW_ARCHITECTURE

# Rollback deployment
pnpm deploy:rollback

# Verify system health
pnpm health:check
```

### Data Rollback (if needed)
```bash
# Rollback database migrations
pnpm db:migrate:rollback

# Restore from backup
pnpm db:restore:backup
```

---

## 📈 Success Metrics

### Technical Metrics
- **Architecture Compliance**: 100% (zero violations)
- **Test Coverage**: 90%+ across all layers
- **Performance**: < 200ms API response time
- **Reliability**: 99.9% uptime

### Business Metrics
- **User Adoption**: 80%+ of target users
- **User Satisfaction**: 4.5+ rating
- **Business Value**: Measurable improvement in efficiency
- **ROI**: Positive return within 3 months

---

## 📚 References

- [AIBOS Architecture Guidelines](../docs/ARCHITECTURE.md)
- [Dependency Management](../docs/DEPENDENCY_LINEAGE_GUARDRAILS.md)
- [ESLint Configuration](../.eslintrc.js)
- [Testing Standards](../docs/TESTING.md)

---

**✅ This runbook ensures 100% architectural compliance and prevents drift through automated enforcement.**
