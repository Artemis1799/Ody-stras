using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using t5_back.Services;

namespace t5_back.Tests.Services;

public class JwtServiceTests
{
    private IConfiguration CreateTestConfiguration()
    {
        var inMemorySettings = new Dictionary<string, string>
        {
            {"Jwt:Key", "ThisIsASecretKeyForTestingPurposesOnly123456789"},
            {"Jwt:Issuer", "TestIssuer"},
            {"Jwt:Audience", "TestAudience"}
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings!)
            .Build();
    }

    [Fact]
    public void GenerateToken_ValidInput_ReturnsNonEmptyToken()
    {
        // Arrange
        var configuration = CreateTestConfiguration();
        var service = new JwtService(configuration);
        var userId = Guid.NewGuid();
        var username = "testuser";

        // Act
        var token = service.GenerateToken(userId, username);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    [Fact]
    public void GenerateToken_ValidInput_ReturnsValidJwtFormat()
    {
        // Arrange
        var configuration = CreateTestConfiguration();
        var service = new JwtService(configuration);
        var userId = Guid.NewGuid();
        var username = "testuser";

        // Act
        var token = service.GenerateToken(userId, username);

        // Assert
        // JWT should have 3 parts separated by dots
        var parts = token.Split('.');
        Assert.Equal(3, parts.Length);
    }

    [Fact]
    public void GenerateToken_ValidInput_TokenContainsCorrectClaims()
    {
        // Arrange
        var configuration = CreateTestConfiguration();
        var service = new JwtService(configuration);
        var userId = Guid.NewGuid();
        var username = "testuser";

        // Act
        var token = service.GenerateToken(userId, username);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        var subClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub);
        Assert.NotNull(subClaim);
        Assert.Equal(userId.ToString(), subClaim.Value);

        var nameClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Name);
        Assert.NotNull(nameClaim);
        Assert.Equal(username, nameClaim.Value);

        var jtiClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti);
        Assert.NotNull(jtiClaim);
        Assert.NotEmpty(jtiClaim.Value);
    }

    [Fact]
    public void GenerateToken_ValidInput_TokenHasCorrectIssuerAndAudience()
    {
        // Arrange
        var configuration = CreateTestConfiguration();
        var service = new JwtService(configuration);
        var userId = Guid.NewGuid();
        var username = "testuser";

        // Act
        var token = service.GenerateToken(userId, username);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        Assert.Equal("TestIssuer", jwtToken.Issuer);
        Assert.Contains("TestAudience", jwtToken.Audiences);
    }

    [Fact]
    public void GenerateToken_ValidInput_TokenExpiresInTwoHours()
    {
        // Arrange
        var configuration = CreateTestConfiguration();
        var service = new JwtService(configuration);
        var userId = Guid.NewGuid();
        var username = "testuser";
        var beforeGeneration = DateTime.UtcNow;

        // Act
        var token = service.GenerateToken(userId, username);
        var afterGeneration = DateTime.UtcNow;

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        // Expiration should be approximately 2 hours from now
        var expectedExpiration = beforeGeneration.AddHours(2);
        var timeDifference = Math.Abs((jwtToken.ValidTo - expectedExpiration).TotalSeconds);
        
        Assert.True(timeDifference < 5, $"Token expiration time differs by {timeDifference} seconds");
    }

    [Fact]
    public void GenerateToken_TokenCanBeValidated()
    {
        // Arrange
        var configuration = CreateTestConfiguration();
        var service = new JwtService(configuration);
        var userId = Guid.NewGuid();
        var username = "testuser";

        // Act
        var token = service.GenerateToken(userId, username);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!);
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // Should not throw an exception
        var principal = handler.ValidateToken(token, validationParameters, out var validatedToken);
        Assert.NotNull(principal);
        Assert.NotNull(validatedToken);
    }

    [Fact]
    public void GenerateToken_DifferentUsers_GenerateDifferentTokens()
    {
        // Arrange
        var configuration = CreateTestConfiguration();
        var service = new JwtService(configuration);
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();
        var username1 = "user1";
        var username2 = "user2";

        // Act
        var token1 = service.GenerateToken(userId1, username1);
        var token2 = service.GenerateToken(userId2, username2);

        // Assert
        Assert.NotEqual(token1, token2);
    }

    [Fact]
    public void GenerateToken_SameUser_DifferentTimes_GeneratesDifferentTokens()
    {
        // Arrange
        var configuration = CreateTestConfiguration();
        var service = new JwtService(configuration);
        var userId = Guid.NewGuid();
        var username = "testuser";

        // Act
        var token1 = service.GenerateToken(userId, username);
        System.Threading.Thread.Sleep(10); // Small delay to ensure different JTI
        var token2 = service.GenerateToken(userId, username);

        // Assert
        // Tokens should be different because of different JTI (unique identifier)
        Assert.NotEqual(token1, token2);
    }

    [Fact]
    public void GenerateToken_ExtractUserId_ReturnsCorrectValue()
    {
        // Arrange
        var configuration = CreateTestConfiguration();
        var service = new JwtService(configuration);
        var userId = Guid.NewGuid();
        var username = "testuser";

        // Act
        var token = service.GenerateToken(userId, username);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);
        var subClaim = jwtToken.Claims.First(c => c.Type == JwtRegisteredClaimNames.Sub);
        var extractedUserId = Guid.Parse(subClaim.Value);

        Assert.Equal(userId, extractedUserId);
    }

    [Fact]
    public void GenerateToken_ExtractUsername_ReturnsCorrectValue()
    {
        // Arrange
        var configuration = CreateTestConfiguration();
        var service = new JwtService(configuration);
        var userId = Guid.NewGuid();
        var username = "testuser123";

        // Act
        var token = service.GenerateToken(userId, username);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);
        var nameClaim = jwtToken.Claims.First(c => c.Type == JwtRegisteredClaimNames.Name);

        Assert.Equal(username, nameClaim.Value);
    }
}
