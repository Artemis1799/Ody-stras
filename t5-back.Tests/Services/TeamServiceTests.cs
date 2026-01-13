using t5_back.Models;
using t5_back.Services;
using t5_back.Tests.Helpers;

namespace t5_back.Tests.Services;

public class TeamServiceTests
{
    private async Task<Event> CreateTestEvent(t5_back.Data.AppDbContext context)
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

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_EmptyDatabase_ReturnsEmptyList()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithTeams_ReturnsAllTeams()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);

        var teams = new List<Team>
        {
            new() { UUID = Guid.NewGuid(), TeamName = "Team Alpha", EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), TeamName = "Team Beta", EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), TeamName = "Team Gamma", EventId = evt.UUID }
        };
        context.Teams.AddRange(teams);
        await context.SaveChangesAsync();

        var service = new TeamService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Equal(3, result.Count());
    }

    [Fact]
    public async Task GetAllAsync_IncludesTeamEmployees()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var team = new Team { UUID = Guid.NewGuid(), TeamName = "Team with Employees", EventId = evt.UUID };
        var employee = new Employee { UUID = Guid.NewGuid(), FirstName = "Jean", LastName = "Dupont" };
        context.Teams.Add(team);
        context.Employees.Add(employee);
        await context.SaveChangesAsync();

        var teamEmployee = new TeamEmployee { TeamId = team.UUID, EmployeeId = employee.UUID };
        context.TeamEmployees.Add(teamEmployee);
        await context.SaveChangesAsync();

        var service = new TeamService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        var resultTeam = result.First();
        Assert.NotNull(resultTeam.TeamEmployees);
        Assert.Single(resultTeam.TeamEmployees);
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsTeam()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var teamId = Guid.NewGuid();
        var team = new Team
        {
            UUID = teamId,
            TeamName = "Test Team",
            TeamNumber = 1,
            EventId = evt.UUID
        };
        context.Teams.Add(team);
        await context.SaveChangesAsync();

        var service = new TeamService(context);

        // Act
        var result = await service.GetByIdAsync(teamId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(teamId, result.UUID);
        Assert.Equal("Test Team", result.TeamName);
        Assert.Equal(1, result.TeamNumber);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamService(context);

        // Act
        var result = await service.GetByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetByEventIdAsync Tests

    [Fact]
    public async Task GetByEventIdAsync_ReturnsTeamsForEvent()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var event1 = await CreateTestEvent(context);
        var event2 = new Event
        {
            UUID = Guid.NewGuid(),
            Title = "Event 2",
            StartDate = DateTime.Now,
            EndDate = DateTime.Now.AddDays(3),
            Status = EventStatus.InProgress,
            MinDurationMinutes = 30,
            MaxDurationMinutes = 60
        };
        context.Events.Add(event2);
        await context.SaveChangesAsync();

        var teams = new List<Team>
        {
            new() { UUID = Guid.NewGuid(), TeamName = "Team A Event 1", EventId = event1.UUID },
            new() { UUID = Guid.NewGuid(), TeamName = "Team B Event 1", EventId = event1.UUID },
            new() { UUID = Guid.NewGuid(), TeamName = "Team C Event 2", EventId = event2.UUID }
        };
        context.Teams.AddRange(teams);
        await context.SaveChangesAsync();

        var service = new TeamService(context);

        // Act
        var result = await service.GetByEventIdAsync(event1.UUID);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, t => Assert.Equal(event1.UUID, t.EventId));
    }

    [Fact]
    public async Task GetByEventIdAsync_NoTeamsForEvent_ReturnsEmpty()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new TeamService(context);

        // Act
        var result = await service.GetByEventIdAsync(evt.UUID);

        // Assert
        Assert.Empty(result);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidTeam_ReturnsCreatedTeam()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new TeamService(context);
        var team = new Team
        {
            TeamName = "New Team",
            TeamNumber = 5,
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(team);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.UUID);
        Assert.Equal("New Team", result.TeamName);
        Assert.Equal(5, result.TeamNumber);
    }

    [Fact]
    public async Task CreateAsync_WithEmptyGuid_GeneratesNewGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new TeamService(context);
        var team = new Team
        {
            UUID = Guid.Empty,
            TeamName = "Team",
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(team);

        // Assert
        Assert.NotEqual(Guid.Empty, result.UUID);
    }

    [Fact]
    public async Task CreateAsync_WithProvidedGuid_UsesProvidedGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new TeamService(context);
        var providedId = Guid.NewGuid();
        var team = new Team
        {
            UUID = providedId,
            TeamName = "Team",
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(team);

        // Assert
        Assert.Equal(providedId, result.UUID);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingTeam_UpdatesTeamName()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var teamId = Guid.NewGuid();
        var originalTeam = new Team
        {
            UUID = teamId,
            TeamName = "Original Name",
            EventId = evt.UUID
        };
        context.Teams.Add(originalTeam);
        await context.SaveChangesAsync();

        var service = new TeamService(context);
        var updatedTeam = new Team
        {
            TeamName = "Updated Name",
            EventId = evt.UUID
        };

        // Act
        var result = await service.UpdateAsync(teamId, updatedTeam);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Name", result.TeamName);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingTeam_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new TeamService(context);
        var updatedTeam = new Team
        {
            TeamName = "Test",
            EventId = evt.UUID
        };

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), updatedTeam);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_ChangingEvent_UpdatesSecurityZones()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var event1 = await CreateTestEvent(context);
        var event2 = new Event
        {
            UUID = Guid.NewGuid(),
            Title = "Event 2",
            StartDate = DateTime.Now,
            EndDate = DateTime.Now.AddDays(3),
            Status = EventStatus.InProgress,
            MinDurationMinutes = 30,
            MaxDurationMinutes = 60
        };
        context.Events.Add(event2);

        var equipment = new Equipment { UUID = Guid.NewGuid(), Type = "Barrier" };
        context.Equipments.Add(equipment);
        await context.SaveChangesAsync();

        var teamId = Guid.NewGuid();
        var team = new Team { UUID = teamId, TeamName = "Team", EventId = event1.UUID };
        context.Teams.Add(team);
        await context.SaveChangesAsync();

        var securityZone = new SecurityZone
        {
            UUID = Guid.NewGuid(),
            EventId = event1.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.Now,
            RemovalDate = DateTime.Now.AddDays(1),
            GeoJson = "{}",
            InstallationTeamId = teamId
        };
        context.SecurityZones.Add(securityZone);
        await context.SaveChangesAsync();

        var service = new TeamService(context);
        var updatedTeam = new Team
        {
            TeamName = "Team",
            EventId = event2.UUID
        };

        // Act
        await service.UpdateAsync(teamId, updatedTeam);

        // Assert
        var updatedSecurityZone = await context.SecurityZones.FindAsync(securityZone.UUID);
        Assert.NotNull(updatedSecurityZone);
        Assert.Null(updatedSecurityZone.InstallationTeamId);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingTeam_ReturnsTrueAndDeletes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var teamId = Guid.NewGuid();
        var team = new Team
        {
            UUID = teamId,
            TeamName = "To Delete",
            EventId = evt.UUID
        };
        context.Teams.Add(team);
        await context.SaveChangesAsync();

        var service = new TeamService(context);

        // Act
        var result = await service.DeleteAsync(teamId);

        // Assert
        Assert.True(result);
        Assert.Null(await context.Teams.FindAsync(teamId));
    }

    [Fact]
    public async Task DeleteAsync_NonExistingTeam_ReturnsFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamService(context);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    #endregion

    #region DeleteAllAsync Tests

    [Fact]
    public async Task DeleteAllAsync_WithTeams_DeletesAllAndReturnsCount()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var teams = new List<Team>
        {
            new() { UUID = Guid.NewGuid(), TeamName = "Team 1", EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), TeamName = "Team 2", EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), TeamName = "Team 3", EventId = evt.UUID }
        };
        context.Teams.AddRange(teams);
        await context.SaveChangesAsync();

        var service = new TeamService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(3, result);
        Assert.Empty(context.Teams);
    }

    [Fact]
    public async Task DeleteAllAsync_EmptyDatabase_ReturnsZero()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new TeamService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(0, result);
    }

    #endregion
}
