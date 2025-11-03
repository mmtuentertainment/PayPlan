# Architectural Patterns Catalog

## Pattern Selection Guide

### Decision Matrix

| Pattern | Best For | Team Size | Complexity | Scalability |
|---------|----------|-----------|------------|-------------|
| Feature-Based | Frontend apps, User-facing products | 2-10 | Low-Medium | High |
| MVC | Traditional web apps, CRUD operations | 1-5 | Low | Medium |
| Clean Architecture | Enterprise apps, Complex domains | 5-20 | High | Very High |
| Domain-Driven Design | Complex business logic, Multiple teams | 10+ | Very High | Very High |
| Modular Monolith | Microservices preparation, Large apps | 5-15 | Medium-High | High |
| Hexagonal | Testability focus, Multiple adapters | 3-10 | High | High |

## Feature-Based Architecture

### Structure
```
project/
├── features/
│   ├── authentication/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── types/
│   │   └── index.ts
│   ├── shopping-cart/
│   └── user-profile/
├── shared/
└── core/
```

### Principles
- **Cohesion**: All code for a feature lives together
- **Encapsulation**: Features expose public APIs via index files
- **Independence**: Features can be developed/tested in isolation
- **Discoverability**: Easy to find all code related to a feature

### When to Use
- Building user-facing applications
- Team works on features independently
- Want to enable gradual migration to microservices
- Need clear boundaries between different parts

## Model-View-Controller (MVC)

### Structure
```
project/
├── models/
│   ├── User.js
│   └── Product.js
├── views/
│   ├── layouts/
│   └── pages/
├── controllers/
│   ├── UserController.js
│   └── ProductController.js
└── routes/
```

### Principles
- **Separation of Concerns**: Data, presentation, and logic separated
- **Reusability**: Models and views can be reused
- **Testability**: Controllers can be tested independently
- **Familiarity**: Well-known pattern

### When to Use
- Building traditional web applications
- CRUD-heavy applications
- Small to medium-sized teams
- Rapid prototyping

## Clean Architecture

### Structure
```
project/
├── domain/              # Enterprise Business Rules
│   ├── entities/
│   ├── value-objects/
│   └── repositories/
├── application/         # Application Business Rules  
│   ├── use-cases/
│   ├── services/
│   └── dto/
├── infrastructure/      # Frameworks & Drivers
│   ├── persistence/
│   ├── web/
│   └── external/
└── presentation/        # Interface Adapters
    ├── controllers/
    ├── presenters/
    └── views/
```

### Principles
- **Dependency Rule**: Dependencies point inward
- **Entity Independence**: Business rules don't depend on frameworks
- **Testability**: Business logic testable without UI/DB
- **Flexibility**: Easy to swap frameworks/databases

### Layers Explained

#### Domain Layer
```typescript
// entities/User.ts
export class User {
  constructor(
    private id: string,
    private email: string,
    private hashedPassword: string
  ) {}
  
  authenticate(password: string): boolean {
    // Business rule for authentication
  }
}
```

#### Application Layer
```typescript
// use-cases/CreateUser.ts
export class CreateUserUseCase {
  constructor(private userRepo: IUserRepository) {}
  
  async execute(data: CreateUserDto): Promise<User> {
    // Application-specific business rule
    const user = new User(/* ... */);
    return this.userRepo.save(user);
  }
}
```

## Domain-Driven Design (DDD)

### Structure
```
project/
├── bounded-contexts/
│   ├── identity/
│   │   ├── domain/
│   │   │   ├── aggregates/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── events/
│   │   │   └── services/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── catalog/
│   └── ordering/
├── shared-kernel/
└── common/
```

### Key Concepts

#### Aggregates
```typescript
// aggregates/Order.ts
export class Order {
  private items: OrderItem[] = [];
  private status: OrderStatus;
  
  addItem(product: Product, quantity: number): void {
    // Enforce invariants
    if (this.status !== OrderStatus.DRAFT) {
      throw new Error('Cannot modify confirmed order');
    }
    this.items.push(new OrderItem(product, quantity));
  }
  
  getTotalAmount(): Money {
    // Calculate total
  }
}
```

#### Value Objects
```typescript
// value-objects/Money.ts
export class Money {
  constructor(
    private amount: number,
    private currency: string
  ) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
  }
  
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }
}
```

## Modular Monolith

### Structure
```
project/
├── modules/
│   ├── identity/
│   │   ├── api/           # Module's public API
│   │   ├── domain/        # Internal domain logic
│   │   ├── infrastructure/
│   │   └── module.ts      # Module configuration
│   ├── inventory/
│   ├── shipping/
│   └── billing/
├── shared/
│   ├── events/           # Inter-module communication
│   └── types/
└── host/                 # Application host/startup
```

### Module Communication
```typescript
// modules/ordering/api/events.ts
export class OrderPlacedEvent {
  constructor(
    public orderId: string,
    public customerId: string,
    public total: number
  ) {}
}

// modules/inventory/handlers/orderHandler.ts
export class OrderEventHandler {
  @EventHandler(OrderPlacedEvent)
  async handleOrderPlaced(event: OrderPlacedEvent) {
    // Reserve inventory
  }
}
```

## Hexagonal Architecture (Ports & Adapters)

### Structure
```
project/
├── core/               # Application Core
│   ├── domain/
│   ├── ports/          # Interfaces
│   │   ├── inbound/    # Use cases
│   │   └── outbound/   # External services
│   └── services/
├── adapters/           # Interface implementations
│   ├── inbound/        # Controllers, CLI, etc.
│   │   ├── rest/
│   │   ├── graphql/
│   │   └── cli/
│   └── outbound/       # Database, APIs, etc.
│       ├── persistence/
│       ├── email/
│       └── payment/
└── config/
```

### Port Definition
```typescript
// ports/outbound/UserRepository.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
```

### Adapter Implementation
```typescript
// adapters/outbound/persistence/MongoUserRepository.ts
export class MongoUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.toDomain(doc) : null;
  }
  // ...
}
```

## Event-Driven Architecture

### Structure
```
project/
├── services/
│   ├── order-service/
│   ├── inventory-service/
│   └── notification-service/
├── events/
│   ├── definitions/
│   └── handlers/
├── messaging/
│   ├── publishers/
│   └── subscribers/
└── shared/
```

### Event Flow
```typescript
// Event Definition
class OrderCreatedEvent {
  constructor(
    public orderId: string,
    public customerId: string,
    public items: OrderItem[]
  ) {}
}

// Publisher
class OrderService {
  async createOrder(data: CreateOrderDto) {
    const order = await this.orderRepo.save(/* ... */);
    await this.eventBus.publish(new OrderCreatedEvent(/* ... */));
  }
}

// Subscriber
class InventoryService {
  @Subscribe(OrderCreatedEvent)
  async handleOrderCreated(event: OrderCreatedEvent) {
    await this.reserveItems(event.items);
  }
}
```

## Layered Architecture

### Structure
```
project/
├── presentation/       # UI Layer
│   ├── web/
│   ├── mobile/
│   └── api/
├── business/          # Business Logic Layer
│   ├── services/
│   └── rules/
├── persistence/       # Data Access Layer
│   ├── repositories/
│   └── entities/
└── database/          # Database Layer
    ├── migrations/
    └── seeds/
```

### Layer Rules
1. **Dependency Direction**: Top layers depend on lower layers
2. **No Skip**: Don't skip layers (Presentation shouldn't access Database)
3. **Abstraction**: Each layer provides abstractions for the layer above

## Microservices Architecture

### Structure
```
project/
├── services/
│   ├── user-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── product-service/
│   └── order-service/
├── api-gateway/
├── shared/
│   ├── proto/         # Protocol buffers
│   └── contracts/     # API contracts
└── infrastructure/
    ├── kubernetes/
    └── terraform/
```

### Service Communication
```typescript
// gRPC Service Definition
// proto/user.proto
service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc CreateUser(CreateUserRequest) returns (User);
}

// REST API Gateway
// api-gateway/routes/users.ts
router.get('/users/:id', async (req, res) => {
  const user = await userServiceClient.getUser({ id: req.params.id });
  res.json(user);
});
```

## Migration Strategies

### Incremental Migration Path

1. **Organize in Place**: Start by organizing existing code without moving files
2. **Create Boundaries**: Introduce clear module boundaries
3. **Extract Shared Code**: Move shared utilities and types
4. **Feature by Feature**: Migrate one feature at a time
5. **Validate Each Step**: Ensure tests pass after each migration

### Refactoring Techniques

#### Strangler Fig Pattern
```typescript
// Old implementation
class LegacyUserService {
  getUser(id: string) { /* ... */ }
}

// New implementation alongside old
class NewUserService {
  getUser(id: string) { /* ... */ }
}

// Router to gradually switch
class UserServiceRouter {
  getUser(id: string) {
    if (featureFlag.useNewService) {
      return this.newService.getUser(id);
    }
    return this.legacyService.getUser(id);
  }
}
```

#### Branch by Abstraction
```typescript
// Step 1: Create abstraction
interface UserRepository {
  findUser(id: string): User;
}

// Step 2: Implement for current system
class LegacyUserRepository implements UserRepository {
  findUser(id: string): User {
    // Current implementation
  }
}

// Step 3: Implement new version
class NewUserRepository implements UserRepository {
  findUser(id: string): User {
    // New implementation
  }
}

// Step 4: Switch implementations
```

## Anti-Patterns to Avoid

### Big Ball of Mud
- **Symptoms**: No clear structure, everything depends on everything
- **Solution**: Introduce boundaries, extract modules gradually

### Anemic Domain Model
- **Symptoms**: Entities with only getters/setters, logic in services
- **Solution**: Move business logic into domain entities

### God Objects
- **Symptoms**: Single class/module doing everything
- **Solution**: Split responsibilities, apply Single Responsibility Principle

### Spaghetti Code
- **Symptoms**: Complex interdependencies, hard to follow flow
- **Solution**: Introduce layers, clear interfaces

### Copy-Paste Programming
- **Symptoms**: Duplicated code across files
- **Solution**: Extract common functionality, use composition
