using t5_back.Models;
using t5_back.Services;
using t5_back.Tests.Helpers;

namespace t5_back.Tests.Services;

public class ActionServiceTests
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

    private async Task<Equipment> CreateTestEquipment(t5_back.Data.AppDbContext context)
    {
        var equipment = new Equipment
        {
            UUID = Guid.NewGuid(),
            Type = "Barrier",
            Length = 2.5f
        };
        context.Equipments.Add(equipment);
        await context.SaveChangesAsync();
        return equipment;
    }

    private async Task<Team> CreateTestTeam(t5_back.Data.AppDbContext context, Guid eventId)
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

    private async Task<Planning> CreateTestPlanning(t5_back.Data.AppDbContext context, Guid teamId)
    {
        var planning = new Planning
        {
            UUID = Guid.NewGuid(),
            TeamId = teamId
        };
        context.Plannings.Add(planning);
        await context.SaveChangesAsync();
        return planning;
    }

    private async Task<SecurityZone> CreateTestSecurityZone(t5_back.Data.AppDbContext context, Guid eventId, Guid equipmentId)
    {
        var securityZone = new SecurityZone
        {
            UUID = Guid.NewGuid(),
            EventId = eventId,
            EquipmentId = equipmentId,
            Quantity = 10,
            InstallationDate = DateTime.Now,
            RemovalDate = DateTime.Now.AddDays(1),
            GeoJson = "{}"
        };
        context.SecurityZones.Add(securityZone);
        await context.SaveChangesAsync();
        return securityZone;
    }

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_EmptyDatabase_ReturnsEmptyList()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new ActionService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithActions_ReturnsAllActions()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);
        var securityZone = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var actions = new List<t5_back.Models.Action>
        {
            new() { UUID = Guid.NewGuid(), PlanningId = planning.UUID, SecurityZoneId = securityZone.UUID, Type = ActionType.Setup, Date = DateTime.Now, Latitude = 48.8f, Longitude = 2.3f },
            new() { UUID = Guid.NewGuid(), PlanningId = planning.UUID, SecurityZoneId = securityZone.UUID, Type = ActionType.Removal, Date = DateTime.Now.AddHours(1), Latitude = 48.9f, Longitude = 2.4f }
        };
        context.Actions.AddRange(actions);
        await context.SaveChangesAsync();

        var service = new ActionService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetAllAsync_ReturnsOrderedByDate()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);
        var securityZone = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var actions = new List<t5_back.Models.Action>
        {
            new() { UUID = Guid.NewGuid(), PlanningId = planning.UUID, SecurityZoneId = securityZone.UUID, Type = ActionType.Setup, Date = new DateTime(2026, 1, 15, 14, 0, 0), Latitude = 0, Longitude = 0 },
            new() { UUID = Guid.NewGuid(), PlanningId = planning.UUID, SecurityZoneId = securityZone.UUID, Type = ActionType.Setup, Date = new DateTime(2026, 1, 15, 10, 0, 0), Latitude = 0, Longitude = 0 },
            new() { UUID = Guid.NewGuid(), PlanningId = planning.UUID, SecurityZoneId = securityZone.UUID, Type = ActionType.Setup, Date = new DateTime(2026, 1, 15, 12, 0, 0), Latitude = 0, Longitude = 0 }
        };
        context.Actions.AddRange(actions);
        await context.SaveChangesAsync();

        var service = new ActionService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        var resultList = result.ToList();
        Assert.Equal(new DateTime(2026, 1, 15, 10, 0, 0), resultList[0].Date);
        Assert.Equal(new DateTime(2026, 1, 15, 12, 0, 0), resultList[1].Date);
        Assert.Equal(new DateTime(2026, 1, 15, 14, 0, 0), resultList[2].Date);
    }

    [Fact]
    public async Task GetAllAsync_IncludesSecurityZone()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);
        var securityZone = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var action = new t5_back.Models.Action
        {
            UUID = Guid.NewGuid(),
            PlanningId = planning.UUID,
            SecurityZoneId = securityZone.UUID,
            Type = ActionType.Setup,
            Date = DateTime.Now,
            Latitude = 48.8f,
            Longitude = 2.3f
        };
        context.Actions.Add(action);
        await context.SaveChangesAsync();

        var service = new ActionService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        var resultAction = result.First();
        Assert.NotNull(resultAction.SecurityZone);
        Assert.Equal(securityZone.UUID, resultAction.SecurityZone!.UUID);
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsAction()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);
        var securityZone = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var actionId = Guid.NewGuid();
        var actionDate = new DateTime(2026, 1, 15, 10, 30, 0);
        var action = new t5_back.Models.Action
        {
            UUID = actionId,
            PlanningId = planning.UUID,
            SecurityZoneId = securityZone.UUID,
            Type = ActionType.Setup,
            Date = actionDate,
            Latitude = 48.8566f,
            Longitude = 2.3522f
        };
        context.Actions.Add(action);
        await context.SaveChangesAsync();

        var service = new ActionService(context);

        // Act
        var result = await service.GetByIdAsync(actionId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(actionId, result.UUID);
        Assert.Equal(ActionType.Setup, result.Type);
        Assert.Equal(actionDate, result.Date);
        Assert.Equal(48.8566f, result.Latitude);
        Assert.Equal(2.3522f, result.Longitude);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new ActionService(context);

        // Act
        var result = await service.GetByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetByPlanningIdAsync Tests

    [Fact]
    public async Task GetByPlanningIdAsync_ReturnsActionsForPlanning()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team1 = await CreateTestTeam(context, evt.UUID);
        var team2 = new Team { UUID = Guid.NewGuid(), TeamName = "Team 2", EventId = evt.UUID };
        context.Teams.Add(team2);
        await context.SaveChangesAsync();

        var planning1 = await CreateTestPlanning(context, team1.UUID);
        var planning2 = await CreateTestPlanning(context, team2.UUID);
        var securityZone = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var actions = new List<t5_back.Models.Action>
        {
            new() { UUID = Guid.NewGuid(), PlanningId = planning1.UUID, SecurityZoneId = securityZone.UUID, Type = ActionType.Setup, Date = DateTime.Now, Latitude = 0, Longitude = 0 },
            new() { UUID = Guid.NewGuid(), PlanningId = planning1.UUID, SecurityZoneId = securityZone.UUID, Type = ActionType.Removal, Date = DateTime.Now.AddHours(1), Latitude = 0, Longitude = 0 },
            new() { UUID = Guid.NewGuid(), PlanningId = planning2.UUID, SecurityZoneId = securityZone.UUID, Type = ActionType.Setup, Date = DateTime.Now, Latitude = 0, Longitude = 0 }
        };
        context.Actions.AddRange(actions);
        await context.SaveChangesAsync();

        var service = new ActionService(context);

        // Act
        var result = await service.GetByPlanningIdAsync(planning1.UUID);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, a => Assert.Equal(planning1.UUID, a.PlanningId));
    }

    [Fact]
    public async Task GetByPlanningIdAsync_NoActionsForPlanning_ReturnsEmpty()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);

        var service = new ActionService(context);

        // Act
        var result = await service.GetByPlanningIdAsync(planning.UUID);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetByPlanningIdAsync_ReturnsOrderedByDate()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);
        var securityZone = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var actions = new List<t5_back.Models.Action>
        {
            new() { UUID = Guid.NewGuid(), PlanningId = planning.UUID, SecurityZoneId = securityZone.UUID, Type = ActionType.Setup, Date = new DateTime(2026, 1, 15, 14, 0, 0), Latitude = 0, Longitude = 0 },
            new() { UUID = Guid.NewGuid(), PlanningId = planning.UUID, SecurityZoneId = securityZone.UUID, Type = ActionType.Setup, Date = new DateTime(2026, 1, 15, 8, 0, 0), Latitude = 0, Longitude = 0 }
        };
        context.Actions.AddRange(actions);
        await context.SaveChangesAsync();

        var service = new ActionService(context);

        // Act
        var result = await service.GetByPlanningIdAsync(planning.UUID);

        // Assert
        var resultList = result.ToList();
        Assert.Equal(new DateTime(2026, 1, 15, 8, 0, 0), resultList[0].Date);
        Assert.Equal(new DateTime(2026, 1, 15, 14, 0, 0), resultList[1].Date);
    }

    #endregion

    #region GetBySecurityZoneIdAsync Tests

    [Fact]
    public async Task GetBySecurityZoneIdAsync_ReturnsActionsForSecurityZone()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);
        var securityZone1 = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);
        var securityZone2 = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var actions = new List<t5_back.Models.Action>
        {
            new() { UUID = Guid.NewGuid(), PlanningId = planning.UUID, SecurityZoneId = securityZone1.UUID, Type = ActionType.Setup, Date = DateTime.Now, Latitude = 0, Longitude = 0 },
            new() { UUID = Guid.NewGuid(), PlanningId = planning.UUID, SecurityZoneId = securityZone1.UUID, Type = ActionType.Removal, Date = DateTime.Now.AddHours(1), Latitude = 0, Longitude = 0 },
            new() { UUID = Guid.NewGuid(), PlanningId = planning.UUID, SecurityZoneId = securityZone2.UUID, Type = ActionType.Setup, Date = DateTime.Now, Latitude = 0, Longitude = 0 }
        };
        context.Actions.AddRange(actions);
        await context.SaveChangesAsync();

        var service = new ActionService(context);

        // Act
        var result = await service.GetBySecurityZoneIdAsync(securityZone1.UUID);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, a => Assert.Equal(securityZone1.UUID, a.SecurityZoneId));
    }

    [Fact]
    public async Task GetBySecurityZoneIdAsync_IncludesPlanning()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);
        var securityZone = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var action = new t5_back.Models.Action
        {
            UUID = Guid.NewGuid(),
            PlanningId = planning.UUID,
            SecurityZoneId = securityZone.UUID,
            Type = ActionType.Setup,
            Date = DateTime.Now,
            Latitude = 0,
            Longitude = 0
        };
        context.Actions.Add(action);
        await context.SaveChangesAsync();

        var service = new ActionService(context);

        // Act
        var result = await service.GetBySecurityZoneIdAsync(securityZone.UUID);

        // Assert
        var resultAction = result.First();
        Assert.NotNull(resultAction.Planning);
        Assert.Equal(planning.UUID, resultAction.Planning!.UUID);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidAction_ReturnsCreatedAction()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);
        var securityZone = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var service = new ActionService(context);
        var actionDate = new DateTime(2026, 1, 20, 9, 0, 0);
        var action = new t5_back.Models.Action
        {
            PlanningId = planning.UUID,
            SecurityZoneId = securityZone.UUID,
            Type = ActionType.Setup,
            Date = actionDate,
            Latitude = 48.8566f,
            Longitude = 2.3522f
        };

        // Act
        var result = await service.CreateAsync(action);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.UUID);
        Assert.Equal(ActionType.Setup, result.Type);
        Assert.Equal(actionDate, result.Date);
    }

    [Fact]
    public async Task CreateAsync_WithEmptyGuid_GeneratesNewGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);
        var securityZone = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var service = new ActionService(context);
        var action = new t5_back.Models.Action
        {
            UUID = Guid.Empty,
            PlanningId = planning.UUID,
            SecurityZoneId = securityZone.UUID,
            Type = ActionType.Removal,
            Date = DateTime.Now,
            Latitude = 0,
            Longitude = 0
        };

        // Act
        var result = await service.CreateAsync(action);

        // Assert
        Assert.NotEqual(Guid.Empty, result.UUID);
    }

    [Fact]
    public async Task CreateAsync_AllActionTypes_CreatesSuccessfully()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);
        var securityZone = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var service = new ActionService(context);

        // Test Setup
        var setupAction = new t5_back.Models.Action
        {
            PlanningId = planning.UUID,
            SecurityZoneId = securityZone.UUID,
            Type = ActionType.Setup,
            Date = DateTime.Now,
            Latitude = 0,
            Longitude = 0
        };
        var setupResult = await service.CreateAsync(setupAction);
        Assert.Equal(ActionType.Setup, setupResult.Type);

        // Test Removal
        var removalAction = new t5_back.Models.Action
        {
            PlanningId = planning.UUID,
            SecurityZoneId = securityZone.UUID,
            Type = ActionType.Removal,
            Date = DateTime.Now,
            Latitude = 0,
            Longitude = 0
        };
        var removalResult = await service.CreateAsync(removalAction);
        Assert.Equal(ActionType.Removal, removalResult.Type);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingAction_UpdatesAllFields()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning1 = await CreateTestPlanning(context, team.UUID);
        var planning2 = await CreateTestPlanning(context, team.UUID);
        var securityZone1 = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);
        var securityZone2 = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var actionId = Guid.NewGuid();
        var originalAction = new t5_back.Models.Action
        {
            UUID = actionId,
            PlanningId = planning1.UUID,
            SecurityZoneId = securityZone1.UUID,
            Type = ActionType.Setup,
            Date = new DateTime(2026, 1, 10),
            Latitude = 0f,
            Longitude = 0f
        };
        context.Actions.Add(originalAction);
        await context.SaveChangesAsync();

        var service = new ActionService(context);
        var newDate = new DateTime(2026, 2, 15, 14, 30, 0);
        var updatedAction = new t5_back.Models.Action
        {
            PlanningId = planning2.UUID,
            SecurityZoneId = securityZone2.UUID,
            Type = ActionType.Removal,
            Date = newDate,
            Latitude = 48.8566f,
            Longitude = 2.3522f
        };

        // Act
        var result = await service.UpdateAsync(actionId, updatedAction);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(planning2.UUID, result.PlanningId);
        Assert.Equal(securityZone2.UUID, result.SecurityZoneId);
        Assert.Equal(ActionType.Removal, result.Type);
        Assert.Equal(newDate, result.Date);
        Assert.Equal(48.8566f, result.Latitude);
        Assert.Equal(2.3522f, result.Longitude);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingAction_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);
        var securityZone = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var service = new ActionService(context);
        var updatedAction = new t5_back.Models.Action
        {
            PlanningId = planning.UUID,
            SecurityZoneId = securityZone.UUID,
            Type = ActionType.Setup,
            Date = DateTime.Now,
            Latitude = 0,
            Longitude = 0
        };

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), updatedAction);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingAction_ReturnsTrueAndDeletes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);
        var securityZone = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var actionId = Guid.NewGuid();
        var action = new t5_back.Models.Action
        {
            UUID = actionId,
            PlanningId = planning.UUID,
            SecurityZoneId = securityZone.UUID,
            Type = ActionType.Setup,
            Date = DateTime.Now,
            Latitude = 0,
            Longitude = 0
        };
        context.Actions.Add(action);
        await context.SaveChangesAsync();

        var service = new ActionService(context);

        // Act
        var result = await service.DeleteAsync(actionId);

        // Assert
        Assert.True(result);
        Assert.Null(await context.Actions.FindAsync(actionId));
    }

    [Fact]
    public async Task DeleteAsync_NonExistingAction_ReturnsFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new ActionService(context);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    #endregion

    #region DeleteAllAsync Tests

    [Fact]
    public async Task DeleteAllAsync_WithActions_DeletesAllAndReturnsCount()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);
        var planning = await CreateTestPlanning(context, team.UUID);
        var securityZone = await CreateTestSecurityZone(context, evt.UUID, equipment.UUID);

        var actions = new List<t5_back.Models.Action>
        {
            new() { UUID = Guid.NewGuid(), PlanningId = planning.UUID, SecurityZoneId = securityZone.UUID, Type = ActionType.Setup, Date = DateTime.Now, Latitude = 0, Longitude = 0 },
            new() { UUID = Guid.NewGuid(), PlanningId = planning.UUID, SecurityZoneId = securityZone.UUID, Type = ActionType.Removal, Date = DateTime.Now, Latitude = 0, Longitude = 0 },
            new() { UUID = Guid.NewGuid(), PlanningId = planning.UUID, SecurityZoneId = securityZone.UUID, Type = ActionType.Setup, Date = DateTime.Now, Latitude = 0, Longitude = 0 }
        };
        context.Actions.AddRange(actions);
        await context.SaveChangesAsync();

        var service = new ActionService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(3, result);
        Assert.Empty(context.Actions);
    }

    [Fact]
    public async Task DeleteAllAsync_EmptyDatabase_ReturnsZero()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new ActionService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(0, result);
    }

    #endregion
}
