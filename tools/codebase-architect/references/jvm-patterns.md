# JVM Patterns Guide (Java/Kotlin)

## Java Enterprise Application Structure

### Spring Boot Application

```
src/main/java/com/company/app/
├── config/               # Configuration classes
│   ├── SecurityConfig.java
│   ├── DatabaseConfig.java
│   └── WebConfig.java
├── controller/           # REST controllers
│   ├── UserController.java
│   └── ProductController.java
├── service/              # Business logic
│   ├── UserService.java
│   ├── impl/
│   │   └── UserServiceImpl.java
│   └── ProductService.java
├── repository/           # Data access
│   ├── UserRepository.java
│   └── ProductRepository.java
├── model/                # Domain models
│   ├── entity/           # JPA entities
│   │   ├── User.java
│   │   └── Product.java
│   └── dto/              # Data Transfer Objects
│       ├── UserDTO.java
│       └── ProductDTO.java
├── exception/            # Custom exceptions
│   ├── GlobalExceptionHandler.java
│   └── ResourceNotFoundException.java
└── Application.java      # Main entry point

src/main/resources/
├── application.yml       # Configuration
├── application-dev.yml
├── application-prod.yml
└── db/migration/         # Flyway/Liquibase migrations
```

### Kotlin Multiplatform Structure

```
src/
├── commonMain/kotlin/    # Shared code
│   ├── domain/
│   ├── data/
│   └── utils/
├── androidMain/kotlin/   # Android-specific
│   └── platform/
├── iosMain/kotlin/       # iOS-specific
│   └── platform/
└── jvmMain/kotlin/       # JVM-specific
    └── platform/
```

## Best Practices

### Package Organization

- **By Layer** (traditional): `com.company.controller`, `com.company.service`
- **By Feature** (modern): `com.company.user`, `com.company.product`
- **Hybrid**: Feature packages with layer subpackages

### Naming Conventions

- Classes: `PascalCase`
- Interfaces: `PascalCase` (no `I` prefix in modern Java)
- Methods: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Packages: `lowercase.with.dots`

### Dependency Management

```
project/
├── build.gradle (Gradle)
├── pom.xml (Maven)
└── settings.gradle.kts
```

## Common Patterns

### Repository Pattern

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByActive(boolean active);
}
```

### Service Layer

```java
@Service
public class UserService {
    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public User createUser(UserDTO dto) {
        // Business logic
    }
}
```

### DTO Pattern

```java
public record UserDTO(
    Long id,
    String email,
    String name
) {}
```

## Testing Structure

```
src/test/java/
├── unit/                 # Unit tests
│   ├── service/
│   └── util/
└── integration/          # Integration tests
    ├── controller/
    └── repository/
```
