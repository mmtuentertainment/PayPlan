# .NET Patterns Guide (C#)

## ASP.NET Core Application Structure

### Web API Project

```
MyApp/
├── src/
│   ├── MyApp.API/              # API layer
│   │   ├── Controllers/
│   │   │   ├── UserController.cs
│   │   │   └── ProductController.cs
│   │   ├── Middleware/
│   │   │   └── ErrorHandlingMiddleware.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── MyApp.Application/      # Application layer
│   │   ├── Services/
│   │   │   ├── UserService.cs
│   │   │   └── IUserService.cs
│   │   ├── DTOs/
│   │   │   ├── UserDTO.cs
│   │   │   └── CreateUserDTO.cs
│   │   ├── Mappings/
│   │   │   └── AutoMapperProfile.cs
│   │   └── Validators/
│   │       └── CreateUserValidator.cs
│   ├── MyApp.Domain/           # Domain layer
│   │   ├── Entities/
│   │   │   ├── User.cs
│   │   │   └── Product.cs
│   │   ├── Interfaces/
│   │   │   └── IUserRepository.cs
│   │   └── ValueObjects/
│   │       └── Email.cs
│   └── MyApp.Infrastructure/   # Infrastructure layer
│       ├── Data/
│       │   ├── ApplicationDbContext.cs
│       │   └── Repositories/
│       │       └── UserRepository.cs
│       ├── Services/
│       │   └── EmailService.cs
│       └── Migrations/
└── tests/
    ├── MyApp.UnitTests/
    ├── MyApp.IntegrationTests/
    └── MyApp.FunctionalTests/
```

### Clean Architecture Solution

```
MyApp.sln
├── src/
│   ├── Core/
│   │   ├── MyApp.Domain/        # Entities, value objects
│   │   └── MyApp.Application/   # Use cases, interfaces
│   ├── Infrastructure/
│   │   ├── MyApp.Infrastructure/# Data access, external services
│   │   └── MyApp.Persistence/   # EF Core, repositories
│   └── Presentation/
│       ├── MyApp.API/            # REST API
│       └── MyApp.Web/            # Web UI (optional)
└── tests/
```

## Best Practices

### Naming Conventions

- Namespaces: `PascalCase.PascalCase`
- Classes: `PascalCase`
- Interfaces: `IPascalCase` (I prefix)
- Methods: `PascalCase`
- Properties: `PascalCase`
- Private fields: `_camelCase` or `camelCase`
- Constants: `PascalCase`

### Dependency Injection

```csharp
// Startup.cs or Program.cs
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddSingleton<ILogger, Logger>();
```

## Common Patterns

### Repository Pattern

```csharp
public interface IUserRepository
{
    Task<User> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<User> AddAsync(User user, CancellationToken cancellationToken = default);
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }
}
```

### Service Layer

```csharp
public interface IUserService
{
    Task<UserDTO> CreateUserAsync(CreateUserDTO dto, CancellationToken cancellationToken = default);
    Task<UserDTO> GetUserAsync(Guid id, CancellationToken cancellationToken = default);
}

public class UserService : IUserService
{
    private readonly IUserRepository _repository;
    private readonly IMapper _mapper;

    public UserService(IUserRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<UserDTO> CreateUserAsync(CreateUserDTO dto, CancellationToken cancellationToken = default)
    {
        var user = _mapper.Map<User>(dto);
        var created = await _repository.AddAsync(user, cancellationToken);
        return _mapper.Map<UserDTO>(created);
    }
}
```

### Controller Pattern

```csharp
[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDTO>> GetUser(Guid id, CancellationToken cancellationToken)
    {
        var user = await _userService.GetUserAsync(id, cancellationToken);
        if (user == null)
            return NotFound();

        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<UserDTO>> CreateUser(
        [FromBody] CreateUserDTO dto,
        CancellationToken cancellationToken)
    {
        var user = await _userService.CreateUserAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
    }
}
```

### CQRS with MediatR

```csharp
// Query
public record GetUserQuery(Guid Id) : IRequest<UserDTO>;

public class GetUserQueryHandler : IRequestHandler<GetUserQuery, UserDTO>
{
    private readonly IUserRepository _repository;
    private readonly IMapper _mapper;

    public async Task<UserDTO> Handle(GetUserQuery request, CancellationToken cancellationToken)
    {
        var user = await _repository.GetByIdAsync(request.Id, cancellationToken);
        return _mapper.Map<UserDTO>(user);
    }
}

// Command
public record CreateUserCommand(string Email, string Name) : IRequest<Guid>;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, Guid>
{
    private readonly IUserRepository _repository;

    public async Task<Guid> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var user = new User { Email = request.Email, Name = request.Name };
        await _repository.AddAsync(user, cancellationToken);
        return user.Id;
    }
}
```

## Testing Structure

```
tests/
├── MyApp.UnitTests/
│   ├── Services/
│   │   └── UserServiceTests.cs
│   └── Controllers/
│       └── UserControllerTests.cs
├── MyApp.IntegrationTests/
│   ├── API/
│   │   └── UserEndpointsTests.cs
│   └── WebApplicationFactory.cs
└── MyApp.FunctionalTests/
    └── UserFlowTests.cs
```

### Unit Test Example

```csharp
public class UserServiceTests
{
    private readonly Mock<IUserRepository> _repositoryMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly UserService _sut;

    public UserServiceTests()
    {
        _repositoryMock = new Mock<IUserRepository>();
        _mapperMock = new Mock<IMapper>();
        _sut = new UserService(_repositoryMock.Object, _mapperMock.Object);
    }

    [Fact]
    public async Task CreateUserAsync_ValidInput_ReturnsUserDTO()
    {
        // Arrange
        var dto = new CreateUserDTO { Email = "test@example.com" };
        var user = new User { Id = Guid.NewGuid(), Email = dto.Email };
        var expected = new UserDTO { Id = user.Id, Email = user.Email };

        _mapperMock.Setup(m => m.Map<User>(dto)).Returns(user);
        _repositoryMock.Setup(r => r.AddAsync(user, default)).ReturnsAsync(user);
        _mapperMock.Setup(m => m.Map<UserDTO>(user)).Returns(expected);

        // Act
        var result = await _sut.CreateUserAsync(dto);

        // Assert
        result.Should().BeEquivalentTo(expected);
    }
}
```
