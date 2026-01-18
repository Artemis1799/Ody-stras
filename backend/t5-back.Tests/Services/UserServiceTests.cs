using Moq;
using t5_back.Models;
using t5_back.Services;
using t5_back.Tests.Helpers;

namespace t5_back.Tests.Services;

public class UserServiceTests
{
    private Mock<IJwtService> CreateMockJwtService()
    {
        var mockJwtService = new Mock<IJwtService>();
        mockJwtService
            .Setup(x => x.GenerateToken(It.IsAny<Guid>(), It.IsAny<string>()))
            .Returns("mock-jwt-token");
        return mockJwtService;
    }

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_EmptyDatabase_ReturnsEmptyList()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithUsers_ReturnsAllUsers()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var users = new List<User>
        {
            new() { UUID = Guid.NewGuid(), Name = "user1", Password = "hash1" },
            new() { UUID = Guid.NewGuid(), Name = "user2", Password = "hash2" },
            new() { UUID = Guid.NewGuid(), Name = "user3" }
        };
        context.Users.AddRange(users);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Equal(3, result.Count());
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsUser()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var userId = Guid.NewGuid();
        var user = new User
        {
            UUID = userId,
            Name = "testuser",
            Password = "hashedpassword"
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var result = await service.GetByIdAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UUID);
        Assert.Equal("testuser", result.Name);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var result = await service.GetByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidUser_ReturnsCreatedUser()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);
        var user = new User
        {
            Name = "newuser",
            Password = "plainpassword"
        };

        // Act
        var result = await service.CreateAsync(user);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.UUID);
        Assert.Equal("newuser", result.Name);
    }

    [Fact]
    public async Task CreateAsync_WithPassword_HashesPassword()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);
        var plainPassword = "mySecretPassword123";
        var user = new User
        {
            Name = "testuser",
            Password = plainPassword
        };

        // Act
        var result = await service.CreateAsync(user);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(plainPassword, result.Password);
        Assert.True(BCrypt.Net.BCrypt.Verify(plainPassword, result.Password));
    }

    [Fact]
    public async Task CreateAsync_WithEmptyPassword_DoesNotHash()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);
        var user = new User
        {
            Name = "testuser",
            Password = ""
        };

        // Act
        var result = await service.CreateAsync(user);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("", result.Password);
    }

    [Fact]
    public async Task CreateAsync_WithNullPassword_DoesNotHash()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);
        var user = new User
        {
            Name = "testuser",
            Password = null
        };

        // Act
        var result = await service.CreateAsync(user);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.Password);
    }

    [Fact]
    public async Task CreateAsync_WithEmptyGuid_GeneratesNewGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);
        var user = new User
        {
            UUID = Guid.Empty,
            Name = "testuser"
        };

        // Act
        var result = await service.CreateAsync(user);

        // Assert
        Assert.NotEqual(Guid.Empty, result.UUID);
    }

    [Fact]
    public async Task CreateAsync_WithProvidedGuid_UsesProvidedGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);
        var providedId = Guid.NewGuid();
        var user = new User
        {
            UUID = providedId,
            Name = "testuser"
        };

        // Act
        var result = await service.CreateAsync(user);

        // Assert
        Assert.Equal(providedId, result.UUID);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingUser_UpdatesName()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var userId = Guid.NewGuid();
        var originalUser = new User
        {
            UUID = userId,
            Name = "originalname",
            Password = BCrypt.Net.BCrypt.HashPassword("originalpassword")
        };
        context.Users.Add(originalUser);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);
        var updatedUser = new User
        {
            Name = "updatedname",
            Password = "newpassword"
        };

        // Act
        var result = await service.UpdateAsync(userId, updatedUser);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("updatedname", result.Name);
    }

    [Fact]
    public async Task UpdateAsync_WithNewPassword_HashesNewPassword()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var userId = Guid.NewGuid();
        var oldPasswordHash = BCrypt.Net.BCrypt.HashPassword("oldpassword");
        var originalUser = new User
        {
            UUID = userId,
            Name = "testuser",
            Password = oldPasswordHash
        };
        context.Users.Add(originalUser);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);
        var newPassword = "newpassword123";
        var updatedUser = new User
        {
            Name = "testuser",
            Password = newPassword
        };

        // Act
        var result = await service.UpdateAsync(userId, updatedUser);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(oldPasswordHash, result.Password);
        Assert.NotEqual(newPassword, result.Password);
        Assert.True(BCrypt.Net.BCrypt.Verify(newPassword, result.Password));
    }

    [Fact]
    public async Task UpdateAsync_WithEmptyPassword_SetsPasswordToNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var userId = Guid.NewGuid();
        var originalUser = new User
        {
            UUID = userId,
            Name = "testuser",
            Password = BCrypt.Net.BCrypt.HashPassword("originalpassword")
        };
        context.Users.Add(originalUser);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);
        var updatedUser = new User
        {
            Name = "testuser",
            Password = ""
        };

        // Act
        var result = await service.UpdateAsync(userId, updatedUser);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.Password);
    }

    [Fact]
    public async Task UpdateAsync_WithNullPassword_SetsPasswordToNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var userId = Guid.NewGuid();
        var originalUser = new User
        {
            UUID = userId,
            Name = "testuser",
            Password = BCrypt.Net.BCrypt.HashPassword("originalpassword")
        };
        context.Users.Add(originalUser);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);
        var updatedUser = new User
        {
            Name = "testuser",
            Password = null
        };

        // Act
        var result = await service.UpdateAsync(userId, updatedUser);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.Password);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingUser_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);
        var updatedUser = new User
        {
            Name = "testuser"
        };

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), updatedUser);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingUser_ReturnsTrueAndDeletes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var userId = Guid.NewGuid();
        var user = new User
        {
            UUID = userId,
            Name = "todelete"
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var result = await service.DeleteAsync(userId);

        // Assert
        Assert.True(result);
        Assert.Null(await context.Users.FindAsync(userId));
    }

    [Fact]
    public async Task DeleteAsync_NonExistingUser_ReturnsFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    #endregion

    #region DeleteAllAsync Tests

    [Fact]
    public async Task DeleteAllAsync_WithUsers_DeletesAllAndReturnsCount()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var users = new List<User>
        {
            new() { UUID = Guid.NewGuid(), Name = "user1" },
            new() { UUID = Guid.NewGuid(), Name = "user2" },
            new() { UUID = Guid.NewGuid(), Name = "user3" }
        };
        context.Users.AddRange(users);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(3, result);
        Assert.Empty(context.Users);
    }

    [Fact]
    public async Task DeleteAllAsync_EmptyDatabase_ReturnsZero()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(0, result);
    }

    #endregion

    #region LoginAsync Tests

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsSuccessWithToken()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var password = "correctpassword";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);
        var user = new User
        {
            UUID = Guid.NewGuid(),
            Name = "testuser",
            Password = hashedPassword
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var (success, message, token) = await service.LoginAsync("testuser", password);

        // Assert
        Assert.True(success);
        Assert.Equal("Login successful", message);
        Assert.NotNull(token);
        Assert.Equal("mock-jwt-token", token);
    }

    [Fact]
    public async Task LoginAsync_NonExistingUser_ReturnsFailure()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var (success, message, token) = await service.LoginAsync("nonexistentuser", "password");

        // Assert
        Assert.False(success);
        Assert.Equal("User does not exist", message);
        Assert.Null(token);
    }

    [Fact]
    public async Task LoginAsync_IncorrectPassword_ReturnsFailure()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword("correctpassword");
        var user = new User
        {
            UUID = Guid.NewGuid(),
            Name = "testuser",
            Password = hashedPassword
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var (success, message, token) = await service.LoginAsync("testuser", "wrongpassword");

        // Assert
        Assert.False(success);
        Assert.Equal("Incorrect password", message);
        Assert.Null(token);
    }

    [Fact]
    public async Task LoginAsync_EmptyPassword_ReturnsFailure()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword("correctpassword");
        var user = new User
        {
            UUID = Guid.NewGuid(),
            Name = "testuser",
            Password = hashedPassword
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var (success, message, token) = await service.LoginAsync("testuser", "");

        // Assert
        Assert.False(success);
        Assert.Equal("Empty password", message);
        Assert.Null(token);
    }

    [Fact]
    public async Task LoginAsync_NullPassword_ReturnsFailure()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword("correctpassword");
        var user = new User
        {
            UUID = Guid.NewGuid(),
            Name = "testuser",
            Password = hashedPassword
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var (success, message, token) = await service.LoginAsync("testuser", null);

        // Assert
        Assert.False(success);
        Assert.Equal("Empty password", message);
        Assert.Null(token);
    }

    [Fact]
    public async Task LoginAsync_UserWithNullPassword_ReturnsFailure()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var user = new User
        {
            UUID = Guid.NewGuid(),
            Name = "testuser",
            Password = null
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var (success, message, token) = await service.LoginAsync("testuser", "anypassword");

        // Assert
        Assert.False(success);
        Assert.Equal("Empty password", message);
        Assert.Null(token);
    }

    [Fact]
    public async Task LoginAsync_GeneratesTokenWithCorrectParameters()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var password = "correctpassword";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);
        var userId = Guid.NewGuid();
        var userName = "testuser";
        var user = new User
        {
            UUID = userId,
            Name = userName,
            Password = hashedPassword
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var mockJwtService = new Mock<IJwtService>();
        mockJwtService
            .Setup(x => x.GenerateToken(userId, userName))
            .Returns("generated-token")
            .Verifiable();

        var service = new UserService(context, mockJwtService.Object);

        // Act
        var (success, message, token) = await service.LoginAsync(userName, password);

        // Assert
        Assert.True(success);
        mockJwtService.Verify(x => x.GenerateToken(userId, userName), Times.Once);
    }

    #endregion

    #region Security Tests

    [Fact]
    public async Task CreateAsync_DifferentPasswordsSameUser_ProducesDifferentHashes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        var user1 = new User { Name = "user1", Password = "password123" };
        var user2 = new User { Name = "user2", Password = "password123" };

        // Act
        var result1 = await service.CreateAsync(user1);
        var result2 = await service.CreateAsync(user2);

        // Assert
        Assert.NotEqual(result1.Password, result2.Password);
    }

    [Fact]
    public async Task LoginAsync_CaseSensitivePassword_ReturnsFailure()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var password = "CaseSensitivePassword";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);
        var user = new User
        {
            UUID = Guid.NewGuid(),
            Name = "testuser",
            Password = hashedPassword
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var mockJwtService = CreateMockJwtService();
        var service = new UserService(context, mockJwtService.Object);

        // Act
        var (success, message, token) = await service.LoginAsync("testuser", "casesensitivepassword");

        // Assert
        Assert.False(success);
        Assert.Equal("Incorrect password", message);
    }

    #endregion
}
