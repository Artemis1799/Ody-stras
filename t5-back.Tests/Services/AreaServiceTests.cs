using t5_back.Models;
using t5_back.Services;
using t5_back.Tests.Helpers;

namespace t5_back.Tests.Services;

public class AreaServiceTests
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
        var service = new AreaService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithAreas_ReturnsAllAreas()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);

        var areas = new List<Area>
        {
            new() { UUID = Guid.NewGuid(), Name = "Zone A", ColorHex = "#FF0000", GeoJson = "{}", EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Zone B", ColorHex = "#00FF00", GeoJson = "{}", EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Zone C", ColorHex = "#0000FF", GeoJson = "{}", EventId = evt.UUID }
        };
        context.Areas.AddRange(areas);
        await context.SaveChangesAsync();

        var service = new AreaService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Equal(3, result.Count());
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsArea()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var areaId = Guid.NewGuid();
        var area = new Area
        {
            UUID = areaId,
            Name = "Test Area",
            Description = "Description of test area",
            ColorHex = "#FFFFFF",
            GeoJson = "{\"type\":\"Polygon\"}",
            EventId = evt.UUID
        };
        context.Areas.Add(area);
        await context.SaveChangesAsync();

        var service = new AreaService(context);

        // Act
        var result = await service.GetByIdAsync(areaId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(areaId, result.UUID);
        Assert.Equal("Test Area", result.Name);
        Assert.Equal("#FFFFFF", result.ColorHex);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new AreaService(context);

        // Act
        var result = await service.GetByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetByEventIdAsync Tests

    [Fact]
    public async Task GetByEventIdAsync_ReturnsAreasForEvent()
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

        var areas = new List<Area>
        {
            new() { UUID = Guid.NewGuid(), Name = "Area 1 Event 1", ColorHex = "#FF0000", GeoJson = "{}", EventId = event1.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Area 2 Event 1", ColorHex = "#00FF00", GeoJson = "{}", EventId = event1.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Area 3 Event 2", ColorHex = "#0000FF", GeoJson = "{}", EventId = event2.UUID }
        };
        context.Areas.AddRange(areas);
        await context.SaveChangesAsync();

        var service = new AreaService(context);

        // Act
        var result = await service.GetByEventIdAsync(event1.UUID);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, a => Assert.Equal(event1.UUID, a.EventId));
    }

    [Fact]
    public async Task GetByEventIdAsync_NoAreasForEvent_ReturnsEmpty()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new AreaService(context);

        // Act
        var result = await service.GetByEventIdAsync(evt.UUID);

        // Assert
        Assert.Empty(result);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidArea_ReturnsCreatedArea()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new AreaService(context);
        var area = new Area
        {
            Name = "New Area",
            Description = "A new area",
            ColorHex = "#123456",
            GeoJson = "{\"type\":\"Polygon\",\"coordinates\":[]}",
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(area);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.UUID);
        Assert.Equal("New Area", result.Name);
        Assert.Equal("#123456", result.ColorHex);
    }

    [Fact]
    public async Task CreateAsync_WithEmptyGuid_GeneratesNewGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new AreaService(context);
        var area = new Area
        {
            UUID = Guid.Empty,
            Name = "Test",
            ColorHex = "#000000",
            GeoJson = "{}",
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(area);

        // Assert
        Assert.NotEqual(Guid.Empty, result.UUID);
    }

    [Fact]
    public async Task CreateAsync_WithProvidedGuid_UsesProvidedGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new AreaService(context);
        var providedId = Guid.NewGuid();
        var area = new Area
        {
            UUID = providedId,
            Name = "Test",
            ColorHex = "#000000",
            GeoJson = "{}",
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(area);

        // Assert
        Assert.Equal(providedId, result.UUID);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingArea_UpdatesAllFields()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var areaId = Guid.NewGuid();
        var originalArea = new Area
        {
            UUID = areaId,
            Name = "Original Name",
            Description = "Original description",
            ColorHex = "#000000",
            GeoJson = "{}",
            EventId = evt.UUID
        };
        context.Areas.Add(originalArea);
        await context.SaveChangesAsync();

        var service = new AreaService(context);
        var updatedArea = new Area
        {
            Name = "Updated Name",
            Description = "Updated description",
            ColorHex = "#FFFFFF",
            GeoJson = "{\"type\":\"Polygon\"}",
            EventId = evt.UUID
        };

        // Act
        var result = await service.UpdateAsync(areaId, updatedArea);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Name", result.Name);
        Assert.Equal("Updated description", result.Description);
        Assert.Equal("#FFFFFF", result.ColorHex);
        Assert.Equal("{\"type\":\"Polygon\"}", result.GeoJson);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingArea_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new AreaService(context);
        var updatedArea = new Area
        {
            Name = "Test",
            ColorHex = "#000000",
            GeoJson = "{}",
            EventId = evt.UUID
        };

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), updatedArea);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingArea_ReturnsTrueAndDeletes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var areaId = Guid.NewGuid();
        var area = new Area
        {
            UUID = areaId,
            Name = "To Delete",
            ColorHex = "#000000",
            GeoJson = "{}",
            EventId = evt.UUID
        };
        context.Areas.Add(area);
        await context.SaveChangesAsync();

        var service = new AreaService(context);

        // Act
        var result = await service.DeleteAsync(areaId);

        // Assert
        Assert.True(result);
        Assert.Null(await context.Areas.FindAsync(areaId));
    }

    [Fact]
    public async Task DeleteAsync_NonExistingArea_ReturnsFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new AreaService(context);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    #endregion

    #region DeleteAllAsync Tests

    [Fact]
    public async Task DeleteAllAsync_WithAreas_DeletesAllAndReturnsCount()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var areas = new List<Area>
        {
            new() { UUID = Guid.NewGuid(), Name = "Area 1", ColorHex = "#FF0000", GeoJson = "{}", EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Area 2", ColorHex = "#00FF00", GeoJson = "{}", EventId = evt.UUID }
        };
        context.Areas.AddRange(areas);
        await context.SaveChangesAsync();

        var service = new AreaService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(2, result);
        Assert.Empty(context.Areas);
    }

    [Fact]
    public async Task DeleteAllAsync_EmptyDatabase_ReturnsZero()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new AreaService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(0, result);
    }

    #endregion

    #region Validation Tests

    [Fact]
    public async Task CreateAsync_ValidatesColorHexFormat()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new AreaService(context);

        // Test with valid hex colors
        var validColors = new[] { "#FF0000", "#00ff00", "#123ABC", "#000000", "#FFFFFF" };
        foreach (var color in validColors)
        {
            var area = new Area
            {
                Name = $"Area with color {color}",
                ColorHex = color,
                GeoJson = "{}",
                EventId = evt.UUID
            };

            // Act
            var result = await service.CreateAsync(area);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(color, result.ColorHex);
        }
    }

    #endregion
}
