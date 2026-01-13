using t5_back.Models;
using t5_back.Services;
using t5_back.Tests.Helpers;

namespace t5_back.Tests.Services;

public class EmployeeServiceTests
{
    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_EmptyDatabase_ReturnsEmptyList()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EmployeeService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithEmployees_ReturnsAllEmployees()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var employees = new List<Employee>
        {
            new() { UUID = Guid.NewGuid(), FirstName = "Jean", LastName = "Dupont", Email = "jean@test.com" },
            new() { UUID = Guid.NewGuid(), FirstName = "Marie", LastName = "Martin", Email = "marie@test.com" },
            new() { UUID = Guid.NewGuid(), FirstName = "Pierre", LastName = "Durand", Phone = "0601020304" }
        };
        context.Employees.AddRange(employees);
        await context.SaveChangesAsync();

        var service = new EmployeeService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Equal(3, result.Count());
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsEmployee()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var employeeId = Guid.NewGuid();
        var employee = new Employee
        {
            UUID = employeeId,
            FirstName = "Jean",
            LastName = "Dupont",
            Email = "jean@test.com",
            Phone = "0601020304"
        };
        context.Employees.Add(employee);
        await context.SaveChangesAsync();

        var service = new EmployeeService(context);

        // Act
        var result = await service.GetByIdAsync(employeeId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(employeeId, result.UUID);
        Assert.Equal("Jean", result.FirstName);
        Assert.Equal("Dupont", result.LastName);
        Assert.Equal("jean@test.com", result.Email);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EmployeeService(context);
        var nonExistingId = Guid.NewGuid();

        // Act
        var result = await service.GetByIdAsync(nonExistingId);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidEmployee_ReturnsCreatedEmployee()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EmployeeService(context);
        var employee = new Employee
        {
            FirstName = "Jean",
            LastName = "Dupont",
            Email = "jean@test.com",
            Phone = "0601020304"
        };

        // Act
        var result = await service.CreateAsync(employee);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.UUID);
        Assert.Equal("Jean", result.FirstName);
        Assert.Equal("Dupont", result.LastName);

        // Vérifier que l'employé est bien en base
        var savedEmployee = await context.Employees.FindAsync(result.UUID);
        Assert.NotNull(savedEmployee);
    }

    [Fact]
    public async Task CreateAsync_WithProvidedId_UsesProvidedId()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EmployeeService(context);
        var providedId = Guid.NewGuid();
        var employee = new Employee
        {
            UUID = providedId,
            FirstName = "Marie",
            LastName = "Martin"
        };

        // Act
        var result = await service.CreateAsync(employee);

        // Assert
        Assert.Equal(providedId, result.UUID);
    }

    [Fact]
    public async Task CreateAsync_WithEmptyId_GeneratesNewId()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EmployeeService(context);
        var employee = new Employee
        {
            UUID = Guid.Empty,
            FirstName = "Pierre",
            LastName = "Durand"
        };

        // Act
        var result = await service.CreateAsync(employee);

        // Assert
        Assert.NotEqual(Guid.Empty, result.UUID);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingEmployee_UpdatesAndReturnsEmployee()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var employeeId = Guid.NewGuid();
        var originalEmployee = new Employee
        {
            UUID = employeeId,
            FirstName = "Jean",
            LastName = "Dupont",
            Email = "jean@test.com",
            Phone = "0601020304"
        };
        context.Employees.Add(originalEmployee);
        await context.SaveChangesAsync();

        var service = new EmployeeService(context);
        var updatedEmployee = new Employee
        {
            FirstName = "Jean-Pierre",
            LastName = "Dupont-Martin",
            Email = "jeanpierre@test.com",
            Phone = "0607080910"
        };

        // Act
        var result = await service.UpdateAsync(employeeId, updatedEmployee);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Jean-Pierre", result.FirstName);
        Assert.Equal("Dupont-Martin", result.LastName);
        Assert.Equal("jeanpierre@test.com", result.Email);
        Assert.Equal("0607080910", result.Phone);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingEmployee_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EmployeeService(context);
        var updatedEmployee = new Employee
        {
            FirstName = "Test",
            LastName = "Test"
        };

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), updatedEmployee);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingEmployee_ReturnsTrueAndDeletesEmployee()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var employeeId = Guid.NewGuid();
        var employee = new Employee
        {
            UUID = employeeId,
            FirstName = "Jean",
            LastName = "Dupont"
        };
        context.Employees.Add(employee);
        await context.SaveChangesAsync();

        var service = new EmployeeService(context);

        // Act
        var result = await service.DeleteAsync(employeeId);

        // Assert
        Assert.True(result);
        var deletedEmployee = await context.Employees.FindAsync(employeeId);
        Assert.Null(deletedEmployee);
    }

    [Fact]
    public async Task DeleteAsync_NonExistingEmployee_ReturnsFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EmployeeService(context);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    #endregion

    #region DeleteAllAsync Tests

    [Fact]
    public async Task DeleteAllAsync_WithEmployees_DeletesAllAndReturnsCount()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var employees = new List<Employee>
        {
            new() { UUID = Guid.NewGuid(), FirstName = "Jean", LastName = "Dupont" },
            new() { UUID = Guid.NewGuid(), FirstName = "Marie", LastName = "Martin" },
            new() { UUID = Guid.NewGuid(), FirstName = "Pierre", LastName = "Durand" }
        };
        context.Employees.AddRange(employees);
        await context.SaveChangesAsync();

        var service = new EmployeeService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(3, result);
        Assert.Empty(context.Employees);
    }

    [Fact]
    public async Task DeleteAllAsync_EmptyDatabase_ReturnsZero()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EmployeeService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(0, result);
    }

    #endregion
}
