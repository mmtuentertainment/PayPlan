# Go Patterns Guide

## Standard Go Project Structure

### Web Service

```
myapp/
├── cmd/                  # Main applications
│   └── myapp/
│       └── main.go
├── internal/             # Private application code
│   ├── handlers/         # HTTP handlers
│   │   ├── user.go
│   │   └── product.go
│   ├── models/           # Data models
│   │   ├── user.go
│   │   └── product.go
│   ├── repository/       # Data access
│   │   ├── user.go
│   │   └── product.go
│   └── middleware/       # HTTP middleware
│       └── auth.go
├── pkg/                  # Public libraries
│   ├── auth/
│   └── logger/
├── api/                  # API definitions
│   └── openapi.yaml
├── configs/              # Configuration files
│   └── config.yaml
├── scripts/              # Build/deploy scripts
├── go.mod                # Go modules
├── go.sum
└── Makefile
```

### Package-Oriented Design

```
myapp/
├── user/                 # User domain
│   ├── user.go           # Core types
│   ├── service.go        # Business logic
│   ├── repository.go     # Data access
│   └── http.go           # HTTP handlers
├── product/              # Product domain
│   ├── product.go
│   ├── service.go
│   ├── repository.go
│   └── http.go
└── common/               # Shared utilities
    ├── database/
    └── logger/
```

## Best Practices

### Naming Conventions

- Packages: `lowercase`, short, singular
- Files: `snake_case.go`
- Types: `PascalCase`
- Functions: `PascalCase` (exported), `camelCase` (unexported)
- Constants: `PascalCase` or `SCREAMING_SNAKE_CASE`

### Interface Design

```go
// Small, focused interfaces
type Reader interface {
    Read(p []byte) (n int, err error)
}

// Accept interfaces, return structs
func ProcessData(r Reader) (*Result, error) {
    // Implementation
}
```

### Error Handling

```go
// Wrap errors with context
if err != nil {
    return fmt.Errorf("failed to load user: %w", err)
}

// Custom error types
type ValidationError struct {
    Field string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("%s: %s", e.Field, e.Message)
}
```

## Common Patterns

### Repository Pattern

```go
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    FindByID(ctx context.Context, id string) (*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id string) error
}

type userRepository struct {
    db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
    return &userRepository{db: db}
}
```

### Service Layer

```go
type UserService struct {
    repo UserRepository
    logger *log.Logger
}

func NewUserService(repo UserRepository, logger *log.Logger) *UserService {
    return &UserService{
        repo: repo,
        logger: logger,
    }
}

func (s *UserService) CreateUser(ctx context.Context, input CreateUserInput) (*User, error) {
    // Business logic
}
```

### HTTP Handler Pattern

```go
type Handler struct {
    service *UserService
}

func NewHandler(service *UserService) *Handler {
    return &Handler{service: service}
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var input CreateUserInput
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    user, err := h.service.CreateUser(r.Context(), input)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(user)
}
```

## Testing Structure

```
myapp/
├── user/
│   ├── user.go
│   ├── user_test.go      # Unit tests
│   └── service_test.go
└── integration/          # Integration tests
    └── user_test.go
```

### Table-Driven Tests

```go
func TestUserValidation(t *testing.T) {
    tests := []struct {
        name    string
        input   User
        wantErr bool
    }{
        {"valid user", User{Email: "test@example.com"}, false},
        {"invalid email", User{Email: "invalid"}, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := tt.input.Validate()
            if (err != nil) != tt.wantErr {
                t.Errorf("got error = %v, want error = %v", err, tt.wantErr)
            }
        })
    }
}
```
