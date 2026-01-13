using t5_back.Models;
using t5_back.Services;
using t5_back.Tests.Helpers;

namespace t5_back.Tests.Services;

public class SecurityZoneServiceTests
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

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_EmptyDatabase_ReturnsEmptyList()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new SecurityZoneService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithSecurityZones_ReturnsAllWithIncludes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);

        var securityZones = new List<SecurityZone>
        {
            new() {
                UUID = Guid.NewGuid(),
                EventId = evt.UUID,
                EquipmentId = equipment.UUID,
                Quantity = 10,
                InstallationDate = DateTime.Now,
                RemovalDate = DateTime.Now.AddDays(1),
                GeoJson = "{}",
                InstallationTeamId = team.UUID
            },
            new() {
                UUID = Guid.NewGuid(),
                EventId = evt.UUID,
                EquipmentId = equipment.UUID,
                Quantity = 5,
                InstallationDate = DateTime.Now,
                RemovalDate = DateTime.Now.AddDays(2),
                GeoJson = "{}"
            }
        };
        context.SecurityZones.AddRange(securityZones);
        await context.SaveChangesAsync();

        var service = new SecurityZoneService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Equal(2, result.Count());
        var firstZone = result.First(sz => sz.InstallationTeamId == team.UUID);
        Assert.NotNull(firstZone.Equipment);
        Assert.NotNull(firstZone.InstallationTeam);
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsSecurityZone()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var zoneId = Guid.NewGuid();
        var installationDate = new DateTime(2026, 1, 10);
        var removalDate = new DateTime(2026, 1, 15);

        var zone = new SecurityZone
        {
            UUID = zoneId,
            EventId = evt.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 25,
            Comment = "Test comment",
            InstallationDate = installationDate,
            RemovalDate = removalDate,
            GeoJson = "{\"type\":\"Polygon\"}"
        };
        context.SecurityZones.Add(zone);
        await context.SaveChangesAsync();

        var service = new SecurityZoneService(context);

        // Act
        var result = await service.GetByIdAsync(zoneId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(zoneId, result.UUID);
        Assert.Equal(25, result.Quantity);
        Assert.Equal("Test comment", result.Comment);
        Assert.Equal(installationDate, result.InstallationDate);
        Assert.Equal(removalDate, result.RemovalDate);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new SecurityZoneService(context);

        // Act
        var result = await service.GetByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_IncludesAllNavigationProperties()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var installTeam = await CreateTestTeam(context, evt.UUID);
        var removalTeam = new Team { UUID = Guid.NewGuid(), TeamName = "Removal Team", EventId = evt.UUID };
        context.Teams.Add(removalTeam);
        await context.SaveChangesAsync();

        var zoneId = Guid.NewGuid();
        var zone = new SecurityZone
        {
            UUID = zoneId,
            EventId = evt.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.Now,
            RemovalDate = DateTime.Now.AddDays(1),
            GeoJson = "{}",
            InstallationTeamId = installTeam.UUID,
            RemovalTeamId = removalTeam.UUID
        };
        context.SecurityZones.Add(zone);
        await context.SaveChangesAsync();

        var service = new SecurityZoneService(context);

        // Act
        var result = await service.GetByIdAsync(zoneId);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Equipment);
        Assert.NotNull(result.InstallationTeam);
        Assert.NotNull(result.RemovalTeam);
        Assert.Equal(equipment.UUID, result.Equipment!.UUID);
        Assert.Equal(installTeam.UUID, result.InstallationTeam!.UUID);
        Assert.Equal(removalTeam.UUID, result.RemovalTeam!.UUID);
    }

    #endregion

    #region GetByEventIdAsync Tests

    [Fact]
    public async Task GetByEventIdAsync_ReturnsSecurityZonesForEvent()
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
        var equipment = await CreateTestEquipment(context);

        var zones = new List<SecurityZone>
        {
            new() { UUID = Guid.NewGuid(), EventId = event1.UUID, EquipmentId = equipment.UUID, Quantity = 10, InstallationDate = DateTime.Now, RemovalDate = DateTime.Now.AddDays(1), GeoJson = "{}" },
            new() { UUID = Guid.NewGuid(), EventId = event1.UUID, EquipmentId = equipment.UUID, Quantity = 5, InstallationDate = DateTime.Now, RemovalDate = DateTime.Now.AddDays(1), GeoJson = "{}" },
            new() { UUID = Guid.NewGuid(), EventId = event2.UUID, EquipmentId = equipment.UUID, Quantity = 15, InstallationDate = DateTime.Now, RemovalDate = DateTime.Now.AddDays(1), GeoJson = "{}" }
        };
        context.SecurityZones.AddRange(zones);
        await context.SaveChangesAsync();

        var service = new SecurityZoneService(context);

        // Act
        var result = await service.GetByEventIdAsync(event1.UUID);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, sz => Assert.Equal(event1.UUID, sz.EventId));
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidSecurityZone_ReturnsCreatedZone()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var service = new SecurityZoneService(context);

        var zone = new SecurityZone
        {
            EventId = evt.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 50,
            Comment = "New zone",
            InstallationDate = new DateTime(2026, 1, 20),
            RemovalDate = new DateTime(2026, 1, 25),
            GeoJson = "{\"type\":\"Polygon\"}"
        };

        // Act
        var result = await service.CreateAsync(zone);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.UUID);
        Assert.Equal(50, result.Quantity);
        Assert.NotNull(result.Equipment);
    }

    [Fact]
    public async Task CreateAsync_WithEmptyGuid_GeneratesNewGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var service = new SecurityZoneService(context);

        var zone = new SecurityZone
        {
            UUID = Guid.Empty,
            EventId = evt.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.Now,
            RemovalDate = DateTime.Now.AddDays(1),
            GeoJson = "{}"
        };

        // Act
        var result = await service.CreateAsync(zone);

        // Assert
        Assert.NotEqual(Guid.Empty, result.UUID);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingSecurityZone_UpdatesAllFields()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment1 = await CreateTestEquipment(context);
        var equipment2 = new Equipment { UUID = Guid.NewGuid(), Type = "Fence" };
        context.Equipments.Add(equipment2);
        await context.SaveChangesAsync();

        var zoneId = Guid.NewGuid();
        var originalZone = new SecurityZone
        {
            UUID = zoneId,
            EventId = evt.UUID,
            EquipmentId = equipment1.UUID,
            Quantity = 10,
            Comment = "Original",
            InstallationDate = new DateTime(2026, 1, 1),
            RemovalDate = new DateTime(2026, 1, 5),
            GeoJson = "{}"
        };
        context.SecurityZones.Add(originalZone);
        await context.SaveChangesAsync();

        var service = new SecurityZoneService(context);
        var updatedZone = new SecurityZone
        {
            EquipmentId = equipment2.UUID,
            Quantity = 100,
            Comment = "Updated",
            InstallationDate = new DateTime(2026, 2, 1),
            RemovalDate = new DateTime(2026, 2, 10),
            GeoJson = "{\"type\":\"Polygon\"}",
            EventId = evt.UUID
        };

        // Act
        var result = await service.UpdateAsync(zoneId, updatedZone);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(equipment2.UUID, result.EquipmentId);
        Assert.Equal(100, result.Quantity);
        Assert.Equal("Updated", result.Comment);
        Assert.Equal(new DateTime(2026, 2, 1), result.InstallationDate);
        Assert.Equal(new DateTime(2026, 2, 10), result.RemovalDate);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingSecurityZone_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var service = new SecurityZoneService(context);

        var updatedZone = new SecurityZone
        {
            EventId = evt.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.Now,
            RemovalDate = DateTime.Now.AddDays(1),
            GeoJson = "{}"
        };

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), updatedZone);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingSecurityZone_ReturnsTrueAndDeletes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var zoneId = Guid.NewGuid();

        var zone = new SecurityZone
        {
            UUID = zoneId,
            EventId = evt.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.Now,
            RemovalDate = DateTime.Now.AddDays(1),
            GeoJson = "{}"
        };
        context.SecurityZones.Add(zone);
        await context.SaveChangesAsync();

        var service = new SecurityZoneService(context);

        // Act
        var result = await service.DeleteAsync(zoneId);

        // Assert
        Assert.True(result);
        Assert.Null(await context.SecurityZones.FindAsync(zoneId));
    }

    [Fact]
    public async Task DeleteAsync_NonExistingSecurityZone_ReturnsFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new SecurityZoneService(context);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    #endregion

    #region DeleteAllAsync Tests

    [Fact]
    public async Task DeleteAllAsync_WithSecurityZones_DeletesAllAndReturnsCount()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);

        var zones = new List<SecurityZone>
        {
            new() { UUID = Guid.NewGuid(), EventId = evt.UUID, EquipmentId = equipment.UUID, Quantity = 10, InstallationDate = DateTime.Now, RemovalDate = DateTime.Now.AddDays(1), GeoJson = "{}" },
            new() { UUID = Guid.NewGuid(), EventId = evt.UUID, EquipmentId = equipment.UUID, Quantity = 20, InstallationDate = DateTime.Now, RemovalDate = DateTime.Now.AddDays(1), GeoJson = "{}" }
        };
        context.SecurityZones.AddRange(zones);
        await context.SaveChangesAsync();

        var service = new SecurityZoneService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(2, result);
        Assert.Empty(context.SecurityZones);
    }

    #endregion

    #region AssignInstallationTeamAsync Tests

    [Fact]
    public async Task AssignInstallationTeamAsync_ValidIds_AssignsTeam()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);

        var zoneId = Guid.NewGuid();
        var zone = new SecurityZone
        {
            UUID = zoneId,
            EventId = evt.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.Now,
            RemovalDate = DateTime.Now.AddDays(1),
            GeoJson = "{}"
        };
        context.SecurityZones.Add(zone);
        await context.SaveChangesAsync();

        var service = new SecurityZoneService(context);

        // Act
        var result = await service.AssignInstallationTeamAsync(zoneId, team.UUID);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(team.UUID, result.InstallationTeamId);
        Assert.NotNull(result.InstallationTeam);
    }

    [Fact]
    public async Task AssignInstallationTeamAsync_NonExistingZone_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new SecurityZoneService(context);

        // Act
        var result = await service.AssignInstallationTeamAsync(Guid.NewGuid(), Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region UnassignInstallationTeamAsync Tests

    [Fact]
    public async Task UnassignInstallationTeamAsync_WithAssignedTeam_RemovesTeam()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);

        var zoneId = Guid.NewGuid();
        var zone = new SecurityZone
        {
            UUID = zoneId,
            EventId = evt.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.Now,
            RemovalDate = DateTime.Now.AddDays(1),
            GeoJson = "{}",
            InstallationTeamId = team.UUID
        };
        context.SecurityZones.Add(zone);
        await context.SaveChangesAsync();

        var service = new SecurityZoneService(context);

        // Act
        var result = await service.UnassignInstallationTeamAsync(zoneId);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.InstallationTeamId);
    }

    [Fact]
    public async Task UnassignInstallationTeamAsync_NonExistingZone_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new SecurityZoneService(context);

        // Act
        var result = await service.UnassignInstallationTeamAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region AssignRemovalTeamAsync Tests

    [Fact]
    public async Task AssignRemovalTeamAsync_ValidIds_AssignsTeam()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);

        var zoneId = Guid.NewGuid();
        var zone = new SecurityZone
        {
            UUID = zoneId,
            EventId = evt.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.Now,
            RemovalDate = DateTime.Now.AddDays(1),
            GeoJson = "{}"
        };
        context.SecurityZones.Add(zone);
        await context.SaveChangesAsync();

        var service = new SecurityZoneService(context);

        // Act
        var result = await service.AssignRemovalTeamAsync(zoneId, team.UUID);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(team.UUID, result.RemovalTeamId);
        Assert.NotNull(result.RemovalTeam);
    }

    [Fact]
    public async Task AssignRemovalTeamAsync_NonExistingZone_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new SecurityZoneService(context);

        // Act
        var result = await service.AssignRemovalTeamAsync(Guid.NewGuid(), Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region UnassignRemovalTeamAsync Tests

    [Fact]
    public async Task UnassignRemovalTeamAsync_WithAssignedTeam_RemovesTeam()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);

        var zoneId = Guid.NewGuid();
        var zone = new SecurityZone
        {
            UUID = zoneId,
            EventId = evt.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.Now,
            RemovalDate = DateTime.Now.AddDays(1),
            GeoJson = "{}",
            RemovalTeamId = team.UUID
        };
        context.SecurityZones.Add(zone);
        await context.SaveChangesAsync();

        var service = new SecurityZoneService(context);

        // Act
        var result = await service.UnassignRemovalTeamAsync(zoneId);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.RemovalTeamId);
    }

    #endregion

    #region Both Teams Tests

    [Fact]
    public async Task CanAssignBothTeams_DifferentTeams_Success()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var installTeam = await CreateTestTeam(context, evt.UUID);
        var removalTeam = new Team { UUID = Guid.NewGuid(), TeamName = "Removal Team", EventId = evt.UUID };
        context.Teams.Add(removalTeam);
        await context.SaveChangesAsync();

        var zoneId = Guid.NewGuid();
        var zone = new SecurityZone
        {
            UUID = zoneId,
            EventId = evt.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.Now,
            RemovalDate = DateTime.Now.AddDays(1),
            GeoJson = "{}"
        };
        context.SecurityZones.Add(zone);
        await context.SaveChangesAsync();

        var service = new SecurityZoneService(context);

        // Act
        await service.AssignInstallationTeamAsync(zoneId, installTeam.UUID);
        var result = await service.AssignRemovalTeamAsync(zoneId, removalTeam.UUID);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(installTeam.UUID, result.InstallationTeamId);
        Assert.Equal(removalTeam.UUID, result.RemovalTeamId);
    }

    [Fact]
    public async Task CanAssignSameTeamToBoth_Success()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var team = await CreateTestTeam(context, evt.UUID);

        var zoneId = Guid.NewGuid();
        var zone = new SecurityZone
        {
            UUID = zoneId,
            EventId = evt.UUID,
            EquipmentId = equipment.UUID,
            Quantity = 10,
            InstallationDate = DateTime.Now,
            RemovalDate = DateTime.Now.AddDays(1),
            GeoJson = "{}"
        };
        context.SecurityZones.Add(zone);
        await context.SaveChangesAsync();

        var service = new SecurityZoneService(context);

        // Act
        await service.AssignInstallationTeamAsync(zoneId, team.UUID);
        var result = await service.AssignRemovalTeamAsync(zoneId, team.UUID);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(team.UUID, result.InstallationTeamId);
        Assert.Equal(team.UUID, result.RemovalTeamId);
    }

    #endregion
}
