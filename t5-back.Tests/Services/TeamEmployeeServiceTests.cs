using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;
using t5_back.Services;
using t5_back.Tests.Helpers;

namespace t5_back.Tests.Services;

public class TeamEmployeeServiceTests
{
    private async Task<Event> CreateTestEvent(AppDbContext context)
    {
        var evt = new Event
        {
            UUID = Guid.NewGuid(),
            Title = "Test Event",
            StartDate = DateTime.Now,
            EndDate = DateTime.Now.AddDays(5),
            Status = EventStatus.ToOrganize,
            MinDurationMinutes = 30,
            MaxDurationMinutes = 120
        };
        context.Events.Add(evt);
        await context.SaveChangesAsync();
        return evt;
    }

    private async Task<Team> CreateTestTeam(AppDbContext context, Guid eventId)
    {
        var team = new Team
        {
            UUID = Guid.NewGuid(),
            TeamName = "Test Team",
            EventId = eventId
        };
        context.Teams.Add(team);
        await context.SaveChangesAsync();
        return team;
    }

    private async Task<Employee> CreateTestEmployee(AppDbContext context)
    {
        var employee = new Employee
        {
            UUID = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com"
        };
        context.Employees.Add(employee);
        await context.SaveChangesAsync();
        return employee;
    }

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_EmptyDatabase_ReturnsEmptyList()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithTeamEmployees_ReturnsAllWithIncludes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        var evt = await CreateTestEvent(context);
        var team1 = await CreateTestTeam(context, evt.UUID);
        var team2 = await CreateTestTeam(context, evt.UUID);
        var employee1 = await CreateTestEmployee(context);
        var employee2 = await CreateTestEmployee(context);

        var te1 = new TeamEmployee { TeamId = team1.UUID, EmployeeId = employee1.UUID };
        var te2 = new TeamEmployee { TeamId = team2.UUID, EmployeeId = employee2.UUID };
        context.TeamEmployees.AddRange(te1, te2);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, te =>
        {
            Assert.NotNull(te.Team);
            Assert.NotNull(te.Employee);
        });
    }

    #endregion

    #region GetByTeamIdAsync Tests

    [Fact]
    public async Task GetByTeamIdAsync_ReturnsEmployeesForTeam()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        var evt = await CreateTestEvent(context);
        var team1 = await CreateTestTeam(context, evt.UUID);
        var team2 = await CreateTestTeam(context, evt.UUID);
        var employee1 = await CreateTestEmployee(context);
        var employee2 = await CreateTestEmployee(context);
        var employee3 = await CreateTestEmployee(context);

        var te1 = new TeamEmployee { TeamId = team1.UUID, EmployeeId = employee1.UUID };
        var te2 = new TeamEmployee { TeamId = team1.UUID, EmployeeId = employee2.UUID };
        var te3 = new TeamEmployee { TeamId = team2.UUID, EmployeeId = employee3.UUID };
        context.TeamEmployees.AddRange(te1, te2, te3);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetByTeamIdAsync(team1.UUID);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, te =>
        {
            Assert.Equal(team1.UUID, te.TeamId);
            Assert.NotNull(te.Employee);
        });
    }

    [Fact]
    public async Task GetByTeamIdAsync_NoEmployeesForTeam_ReturnsEmpty()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        var evt = await CreateTestEvent(context);
        var team = await CreateTestTeam(context, evt.UUID);

        // Act
        var result = await service.GetByTeamIdAsync(team.UUID);

        // Assert
        Assert.Empty(result);
    }

    #endregion

    #region GetByEmployeeIdAsync Tests

    [Fact]
    public async Task GetByEmployeeIdAsync_ReturnsTeamsForEmployee()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        var evt = await CreateTestEvent(context);
        var team1 = await CreateTestTeam(context, evt.UUID);
        var team2 = await CreateTestTeam(context, evt.UUID);
        var employee1 = await CreateTestEmployee(context);
        var employee2 = await CreateTestEmployee(context);

        var te1 = new TeamEmployee { TeamId = team1.UUID, EmployeeId = employee1.UUID };
        var te2 = new TeamEmployee { TeamId = team2.UUID, EmployeeId = employee1.UUID };
        var te3 = new TeamEmployee { TeamId = team1.UUID, EmployeeId = employee2.UUID };
        context.TeamEmployees.AddRange(te1, te2, te3);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetByEmployeeIdAsync(employee1.UUID);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, te =>
        {
            Assert.Equal(employee1.UUID, te.EmployeeId);
            Assert.NotNull(te.Team);
        });
    }

    [Fact]
    public async Task GetByEmployeeIdAsync_NoTeamsForEmployee_ReturnsEmpty()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        var employee = await CreateTestEmployee(context);

        // Act
        var result = await service.GetByEmployeeIdAsync(employee.UUID);

        // Assert
        Assert.Empty(result);
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingCompositeKey_ReturnsTeamEmployee()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        var evt = await CreateTestEvent(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var employee = await CreateTestEmployee(context);

        var te = new TeamEmployee { TeamId = team.UUID, EmployeeId = employee.UUID };
        context.TeamEmployees.Add(te);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetByIdAsync(team.UUID, employee.UUID);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(team.UUID, result.TeamId);
        Assert.Equal(employee.UUID, result.EmployeeId);
        Assert.NotNull(result.Team);
        Assert.NotNull(result.Employee);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingCompositeKey_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        // Act
        var result = await service.GetByIdAsync(Guid.NewGuid(), Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidTeamEmployee_ReturnsCreated()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        var evt = await CreateTestEvent(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var employee = await CreateTestEmployee(context);

        var teamEmployee = new TeamEmployee { TeamId = team.UUID, EmployeeId = employee.UUID };

        // Act
        var result = await service.CreateAsync(teamEmployee);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(team.UUID, result.TeamId);
        Assert.Equal(employee.UUID, result.EmployeeId);

        var dbTeamEmployee = await context.TeamEmployees
            .FirstOrDefaultAsync(te => te.TeamId == team.UUID && te.EmployeeId == employee.UUID);
        Assert.NotNull(dbTeamEmployee);
    }

    [Fact]
    public async Task CreateAsync_MultipleEmployeesOnSameTeam_Success()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        var evt = await CreateTestEvent(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var employee1 = await CreateTestEmployee(context);
        var employee2 = await CreateTestEmployee(context);

        var te1 = new TeamEmployee { TeamId = team.UUID, EmployeeId = employee1.UUID };
        var te2 = new TeamEmployee { TeamId = team.UUID, EmployeeId = employee2.UUID };

        // Act
        await service.CreateAsync(te1);
        await service.CreateAsync(te2);

        // Assert
        var result = await context.TeamEmployees.Where(te => te.TeamId == team.UUID).ToListAsync();
        Assert.Equal(2, result.Count);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingTeamEmployee_ReturnsTrueAndDeletes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        var evt = await CreateTestEvent(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var employee = await CreateTestEmployee(context);

        var te = new TeamEmployee { TeamId = team.UUID, EmployeeId = employee.UUID };
        context.TeamEmployees.Add(te);
        await context.SaveChangesAsync();

        // Act
        var result = await service.DeleteAsync(team.UUID, employee.UUID);

        // Assert
        Assert.True(result);

        var dbTeamEmployee = await context.TeamEmployees
            .FirstOrDefaultAsync(te => te.TeamId == team.UUID && te.EmployeeId == employee.UUID);
        Assert.Null(dbTeamEmployee);
    }

    [Fact]
    public async Task DeleteAsync_NonExistingTeamEmployee_ReturnsFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid(), Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    #endregion

    #region DeleteAllAsync Tests

    [Fact]
    public async Task DeleteAllAsync_WithTeamEmployees_DeletesAllAndReturnsCount()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        var evt = await CreateTestEvent(context);
        var team1 = await CreateTestTeam(context, evt.UUID);
        var team2 = await CreateTestTeam(context, evt.UUID);
        var employee1 = await CreateTestEmployee(context);
        var employee2 = await CreateTestEmployee(context);

        var te1 = new TeamEmployee { TeamId = team1.UUID, EmployeeId = employee1.UUID };
        var te2 = new TeamEmployee { TeamId = team2.UUID, EmployeeId = employee2.UUID };
        context.TeamEmployees.AddRange(te1, te2);
        await context.SaveChangesAsync();

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(2, result);
        Assert.Empty(await context.TeamEmployees.ToListAsync());
    }

    [Fact]
    public async Task DeleteAllAsync_EmptyDatabase_ReturnsZero()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamEmployeeService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(0, result);
    }

    #endregion
}
