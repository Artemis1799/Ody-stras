using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;
using t5_back.Services;
using t5_back.Tests.Helpers;

namespace t5_back.Tests.Services;

public class PlanningServiceTests
{
    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsEmptyList_WhenNoPlanningsExist()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllPlannings_WhenPlanningsExist()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team1 = new Team { UUID = Guid.NewGuid(), TeamName = "Team 1", EventId = evt.UUID };
        var team2 = new Team { UUID = Guid.NewGuid(), TeamName = "Team 2", EventId = evt.UUID };
        context.Teams.AddRange(team1, team2);

        var planning1 = new Planning { UUID = Guid.NewGuid(), TeamId = team1.UUID };
        var planning2 = new Planning { UUID = Guid.NewGuid(), TeamId = team2.UUID };
        context.Plannings.AddRange(planning1, planning2);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetAllAsync_IncludesActions()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team = new Team { UUID = Guid.NewGuid(), TeamName = "Team", EventId = evt.UUID };
        context.Teams.Add(team);

        var planning = new Planning { UUID = Guid.NewGuid(), TeamId = team.UUID };
        context.Plannings.Add(planning);

        var equipment = new Equipment { UUID = Guid.NewGuid(), Type = "Barrier" };
        context.Equipments.Add(equipment);

        var securityZone = new SecurityZone 
        { 
            UUID = Guid.NewGuid(), 
            EventId = evt.UUID, 
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.UtcNow,
            RemovalDate = DateTime.UtcNow.AddDays(1),
            GeoJson = "{}"
        };
        context.SecurityZones.Add(securityZone);

        var action = new t5_back.Models.Action
        {
            UUID = Guid.NewGuid(),
            Type = ActionType.Setup,
            Date = DateTime.UtcNow,
            PlanningId = planning.UUID,
            SecurityZoneId = securityZone.UUID
        };
        context.Actions.Add(action);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetAllAsync();

        // Assert
        var planningResult = result.First();
        Assert.NotNull(planningResult.Actions);
        Assert.Single(planningResult.Actions);
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ReturnsPlanning_WhenExists()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team = new Team { UUID = Guid.NewGuid(), TeamName = "Team", EventId = evt.UUID };
        context.Teams.Add(team);

        var planningId = Guid.NewGuid();
        var planning = new Planning { UUID = planningId, TeamId = team.UUID };
        context.Plannings.Add(planning);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetByIdAsync(planningId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(planningId, result.UUID);
        Assert.Equal(team.UUID, result.TeamId);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        // Act
        var result = await service.GetByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_IncludesActions()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team = new Team { UUID = Guid.NewGuid(), TeamName = "Team", EventId = evt.UUID };
        context.Teams.Add(team);

        var planningId = Guid.NewGuid();
        var planning = new Planning { UUID = planningId, TeamId = team.UUID };
        context.Plannings.Add(planning);

        var equipment = new Equipment { UUID = Guid.NewGuid(), Type = "Barrier" };
        context.Equipments.Add(equipment);

        var securityZone = new SecurityZone 
        { 
            UUID = Guid.NewGuid(), 
            EventId = evt.UUID, 
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.UtcNow,
            RemovalDate = DateTime.UtcNow.AddDays(1),
            GeoJson = "{}"
        };
        context.SecurityZones.Add(securityZone);

        var action1 = new t5_back.Models.Action { UUID = Guid.NewGuid(), Type = ActionType.Setup, Date = DateTime.UtcNow, PlanningId = planningId, SecurityZoneId = securityZone.UUID };
        var action2 = new t5_back.Models.Action { UUID = Guid.NewGuid(), Type = ActionType.Removal, Date = DateTime.UtcNow.AddHours(2), PlanningId = planningId, SecurityZoneId = securityZone.UUID };
        context.Actions.AddRange(action1, action2);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetByIdAsync(planningId);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Actions);
        Assert.Equal(2, result.Actions.Count);
    }

    #endregion

    #region GetByTeamIdAsync Tests

    [Fact]
    public async Task GetByTeamIdAsync_ReturnsPlanning_WhenExists()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var teamId = Guid.NewGuid();
        var team = new Team { UUID = teamId, TeamName = "Team", EventId = evt.UUID };
        context.Teams.Add(team);

        var planning = new Planning { UUID = Guid.NewGuid(), TeamId = teamId };
        context.Plannings.Add(planning);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetByTeamIdAsync(teamId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(teamId, result.TeamId);
    }

    [Fact]
    public async Task GetByTeamIdAsync_ReturnsNull_WhenTeamHasNoPlanning()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team = new Team { UUID = Guid.NewGuid(), TeamName = "Team", EventId = evt.UUID };
        context.Teams.Add(team);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetByTeamIdAsync(team.UUID);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByTeamIdAsync_ReturnsNull_WhenTeamNotExists()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        // Act
        var result = await service.GetByTeamIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetItineraryAsync Tests

    [Fact]
    public async Task GetItineraryAsync_ReturnsEmptyList_WhenNoActions()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team = new Team { UUID = Guid.NewGuid(), TeamName = "Team", EventId = evt.UUID };
        context.Teams.Add(team);

        var planning = new Planning { UUID = Guid.NewGuid(), TeamId = team.UUID };
        context.Plannings.Add(planning);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetItineraryAsync(planning.UUID);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetItineraryAsync_ReturnsActionsOrderedByDate()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team = new Team { UUID = Guid.NewGuid(), TeamName = "Team", EventId = evt.UUID };
        context.Teams.Add(team);

        var planningId = Guid.NewGuid();
        var planning = new Planning { UUID = planningId, TeamId = team.UUID };
        context.Plannings.Add(planning);

        var equipment = new Equipment { UUID = Guid.NewGuid(), Type = "Barrier" };
        context.Equipments.Add(equipment);

        var securityZone = new SecurityZone 
        { 
            UUID = Guid.NewGuid(), 
            EventId = evt.UUID, 
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.UtcNow,
            RemovalDate = DateTime.UtcNow.AddDays(1),
            GeoJson = "{}"
        };
        context.SecurityZones.Add(securityZone);

        var baseDate = DateTime.UtcNow;
        var action1 = new t5_back.Models.Action { UUID = Guid.NewGuid(), Type = ActionType.Setup, Date = baseDate.AddHours(2), PlanningId = planningId, SecurityZoneId = securityZone.UUID };
        var action2 = new t5_back.Models.Action { UUID = Guid.NewGuid(), Type = ActionType.Removal, Date = baseDate, PlanningId = planningId, SecurityZoneId = securityZone.UUID };
        var action3 = new t5_back.Models.Action { UUID = Guid.NewGuid(), Type = ActionType.Setup, Date = baseDate.AddHours(1), PlanningId = planningId, SecurityZoneId = securityZone.UUID };
        context.Actions.AddRange(action1, action2, action3);
        await context.SaveChangesAsync();

        // Act
        var result = (await service.GetItineraryAsync(planningId)).ToList();

        // Assert
        Assert.Equal(3, result.Count);
        Assert.Equal(action2.UUID, result[0].UUID); // Earliest
        Assert.Equal(action3.UUID, result[1].UUID); // Middle
        Assert.Equal(action1.UUID, result[2].UUID); // Latest
    }

    [Fact]
    public async Task GetItineraryAsync_IncludesSecurityZoneAndEquipment()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team = new Team { UUID = Guid.NewGuid(), TeamName = "Team", EventId = evt.UUID };
        context.Teams.Add(team);

        var planningId = Guid.NewGuid();
        var planning = new Planning { UUID = planningId, TeamId = team.UUID };
        context.Plannings.Add(planning);

        var equipment = new Equipment { UUID = Guid.NewGuid(), Type = "Barrier", Description = "Test barrier" };
        context.Equipments.Add(equipment);

        var securityZone = new SecurityZone 
        { 
            UUID = Guid.NewGuid(), 
            EventId = evt.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.UtcNow,
            RemovalDate = DateTime.UtcNow.AddDays(1),
            GeoJson = "{}"
        };
        context.SecurityZones.Add(securityZone);

        var action = new t5_back.Models.Action 
        { 
            UUID = Guid.NewGuid(), 
            Type = ActionType.Setup, 
            Date = DateTime.UtcNow, 
            PlanningId = planningId, 
            SecurityZoneId = securityZone.UUID 
        };
        context.Actions.Add(action);
        await context.SaveChangesAsync();

        // Act
        var result = (await service.GetItineraryAsync(planningId)).ToList();

        // Assert
        Assert.Single(result);
        Assert.NotNull(result[0].SecurityZone);
        Assert.Equal(securityZone.UUID, result[0].SecurityZone!.UUID);
        Assert.NotNull(result[0].SecurityZone!.Equipment);
        Assert.Equal("Barrier", result[0].SecurityZone!.Equipment!.Type);
    }

    [Fact]
    public async Task GetItineraryAsync_OnlyReturnsActionsForSpecifiedPlanning()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team1 = new Team { UUID = Guid.NewGuid(), TeamName = "Team 1", EventId = evt.UUID };
        var team2 = new Team { UUID = Guid.NewGuid(), TeamName = "Team 2", EventId = evt.UUID };
        context.Teams.AddRange(team1, team2);

        var planning1Id = Guid.NewGuid();
        var planning2Id = Guid.NewGuid();
        var planning1 = new Planning { UUID = planning1Id, TeamId = team1.UUID };
        var planning2 = new Planning { UUID = planning2Id, TeamId = team2.UUID };
        context.Plannings.AddRange(planning1, planning2);

        var equipment = new Equipment { UUID = Guid.NewGuid(), Type = "Barrier" };
        context.Equipments.Add(equipment);

        var securityZone = new SecurityZone 
        { 
            UUID = Guid.NewGuid(), 
            EventId = evt.UUID, 
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.UtcNow,
            RemovalDate = DateTime.UtcNow.AddDays(1),
            GeoJson = "{}"
        };
        context.SecurityZones.Add(securityZone);

        var actionForPlanning1 = new t5_back.Models.Action { UUID = Guid.NewGuid(), Type = ActionType.Setup, Date = DateTime.UtcNow, PlanningId = planning1Id, SecurityZoneId = securityZone.UUID };
        var actionForPlanning2 = new t5_back.Models.Action { UUID = Guid.NewGuid(), Type = ActionType.Removal, Date = DateTime.UtcNow, PlanningId = planning2Id, SecurityZoneId = securityZone.UUID };
        context.Actions.AddRange(actionForPlanning1, actionForPlanning2);
        await context.SaveChangesAsync();

        // Act
        var result = (await service.GetItineraryAsync(planning1Id)).ToList();

        // Assert
        Assert.Single(result);
        Assert.Equal(actionForPlanning1.UUID, result[0].UUID);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_AddsPlanningToDatabase()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team = new Team { UUID = Guid.NewGuid(), TeamName = "Team", EventId = evt.UUID };
        context.Teams.Add(team);
        await context.SaveChangesAsync();

        var planning = new Planning { TeamId = team.UUID };

        // Act
        var result = await service.CreateAsync(planning);

        // Assert
        Assert.NotEqual(Guid.Empty, result.UUID);
        Assert.Equal(team.UUID, result.TeamId);

        var dbPlanning = await context.Plannings.FindAsync(result.UUID);
        Assert.NotNull(dbPlanning);
    }

    [Fact]
    public async Task CreateAsync_UsesProvidedUUID_WhenNotEmpty()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team = new Team { UUID = Guid.NewGuid(), TeamName = "Team", EventId = evt.UUID };
        context.Teams.Add(team);
        await context.SaveChangesAsync();

        var customId = Guid.NewGuid();
        var planning = new Planning { UUID = customId, TeamId = team.UUID };

        // Act
        var result = await service.CreateAsync(planning);

        // Assert
        Assert.Equal(customId, result.UUID);
    }

    [Fact]
    public async Task CreateAsync_GeneratesNewUUID_WhenEmpty()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team = new Team { UUID = Guid.NewGuid(), TeamName = "Team", EventId = evt.UUID };
        context.Teams.Add(team);
        await context.SaveChangesAsync();

        var planning = new Planning { UUID = Guid.Empty, TeamId = team.UUID };

        // Act
        var result = await service.CreateAsync(planning);

        // Assert
        Assert.NotEqual(Guid.Empty, result.UUID);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_UpdatesTeamId()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team1 = new Team { UUID = Guid.NewGuid(), TeamName = "Team 1", EventId = evt.UUID };
        var team2 = new Team { UUID = Guid.NewGuid(), TeamName = "Team 2", EventId = evt.UUID };
        context.Teams.AddRange(team1, team2);

        var planningId = Guid.NewGuid();
        var planning = new Planning { UUID = planningId, TeamId = team1.UUID };
        context.Plannings.Add(planning);
        await context.SaveChangesAsync();

        var updatedPlanning = new Planning { TeamId = team2.UUID };

        // Act
        var result = await service.UpdateAsync(planningId, updatedPlanning);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(team2.UUID, result.TeamId);

        var dbPlanning = await context.Plannings.FindAsync(planningId);
        Assert.Equal(team2.UUID, dbPlanning!.TeamId);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNull_WhenPlanningNotExists()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var updatedPlanning = new Planning { TeamId = Guid.NewGuid() };

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), updatedPlanning);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_RemovesPlanningFromDatabase()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team = new Team { UUID = Guid.NewGuid(), TeamName = "Team", EventId = evt.UUID };
        context.Teams.Add(team);

        var planningId = Guid.NewGuid();
        var planning = new Planning { UUID = planningId, TeamId = team.UUID };
        context.Plannings.Add(planning);
        await context.SaveChangesAsync();

        // Act
        var result = await service.DeleteAsync(planningId);

        // Assert
        Assert.True(result);
        var dbPlanning = await context.Plannings.FindAsync(planningId);
        Assert.Null(dbPlanning);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsFalse_WhenPlanningNotExists()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    #endregion

    #region DeleteAllAsync Tests

    [Fact]
    public async Task DeleteAllAsync_RemovesAllPlannings()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        var evt = new Event { UUID = Guid.NewGuid(), Title = "Event", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 };
        context.Events.Add(evt);

        var team1 = new Team { UUID = Guid.NewGuid(), TeamName = "Team 1", EventId = evt.UUID };
        var team2 = new Team { UUID = Guid.NewGuid(), TeamName = "Team 2", EventId = evt.UUID };
        context.Teams.AddRange(team1, team2);

        var planning1 = new Planning { UUID = Guid.NewGuid(), TeamId = team1.UUID };
        var planning2 = new Planning { UUID = Guid.NewGuid(), TeamId = team2.UUID };
        context.Plannings.AddRange(planning1, planning2);
        await context.SaveChangesAsync();

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(2, result);
        Assert.Empty(await context.Plannings.ToListAsync());
    }

    [Fact]
    public async Task DeleteAllAsync_ReturnsZero_WhenNoPlannings()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PlanningService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(0, result);
    }

    #endregion
}
