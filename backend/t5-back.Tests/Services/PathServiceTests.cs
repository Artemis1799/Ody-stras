using t5_back.Models;
using t5_back.Services;
using t5_back.Tests.Helpers;

namespace t5_back.Tests.Services;

public class PathServiceTests
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
        var service = new PathService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithPaths_ReturnsAllPaths()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);

        var paths = new List<RoutePath>
        {
            new() { UUID = Guid.NewGuid(), Name = "Path A", ColorHex = "#FF0000", StartDate = DateTime.Now, GeoJson = "{}", EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Path B", ColorHex = "#00FF00", StartDate = DateTime.Now, GeoJson = "{}", EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Path C", ColorHex = "#0000FF", StartDate = DateTime.Now, GeoJson = "{}", EventId = evt.UUID }
        };
        context.Paths.AddRange(paths);
        await context.SaveChangesAsync();

        var service = new PathService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Equal(3, result.Count());
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsPath()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var pathId = Guid.NewGuid();
        var startDate = new DateTime(2026, 1, 15, 10, 0, 0);
        var path = new RoutePath
        {
            UUID = pathId,
            Name = "Test Path",
            Description = "A test path description",
            ColorHex = "#123456",
            StartDate = startDate,
            GeoJson = "{\"type\":\"LineString\",\"coordinates\":[]}",
            EventId = evt.UUID
        };
        context.Paths.Add(path);
        await context.SaveChangesAsync();

        var service = new PathService(context);

        // Act
        var result = await service.GetByIdAsync(pathId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(pathId, result.UUID);
        Assert.Equal("Test Path", result.Name);
        Assert.Equal("A test path description", result.Description);
        Assert.Equal("#123456", result.ColorHex);
        Assert.Equal(startDate, result.StartDate);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PathService(context);

        // Act
        var result = await service.GetByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetByEventIdAsync Tests

    [Fact]
    public async Task GetByEventIdAsync_ReturnsPathsForEvent()
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

        var paths = new List<RoutePath>
        {
            new() { UUID = Guid.NewGuid(), Name = "Path 1 Event 1", ColorHex = "#FF0000", StartDate = DateTime.Now, GeoJson = "{}", EventId = event1.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Path 2 Event 1", ColorHex = "#00FF00", StartDate = DateTime.Now, GeoJson = "{}", EventId = event1.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Path 3 Event 2", ColorHex = "#0000FF", StartDate = DateTime.Now, GeoJson = "{}", EventId = event2.UUID }
        };
        context.Paths.AddRange(paths);
        await context.SaveChangesAsync();

        var service = new PathService(context);

        // Act
        var result = await service.GetByEventIdAsync(event1.UUID);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, p => Assert.Equal(event1.UUID, p.EventId));
    }

    [Fact]
    public async Task GetByEventIdAsync_NoPathsForEvent_ReturnsEmpty()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new PathService(context);

        // Act
        var result = await service.GetByEventIdAsync(evt.UUID);

        // Assert
        Assert.Empty(result);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidPath_ReturnsCreatedPath()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new PathService(context);
        var startDate = new DateTime(2026, 2, 1, 8, 0, 0);
        var path = new RoutePath
        {
            Name = "New Path",
            Description = "A new path",
            ColorHex = "#ABCDEF",
            StartDate = startDate,
            GeoJson = "{\"type\":\"LineString\",\"coordinates\":[[0,0],[1,1]]}",
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(path);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.UUID);
        Assert.Equal("New Path", result.Name);
        Assert.Equal("#ABCDEF", result.ColorHex);
        Assert.Equal(startDate, result.StartDate);
    }

    [Fact]
    public async Task CreateAsync_WithEmptyGuid_GeneratesNewGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new PathService(context);
        var path = new RoutePath
        {
            UUID = Guid.Empty,
            Name = "Test",
            ColorHex = "#000000",
            StartDate = DateTime.Now,
            GeoJson = "{}",
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(path);

        // Assert
        Assert.NotEqual(Guid.Empty, result.UUID);
    }

    [Fact]
    public async Task CreateAsync_WithProvidedGuid_UsesProvidedGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new PathService(context);
        var providedId = Guid.NewGuid();
        var path = new RoutePath
        {
            UUID = providedId,
            Name = "Test",
            ColorHex = "#000000",
            StartDate = DateTime.Now,
            GeoJson = "{}",
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(path);

        // Assert
        Assert.Equal(providedId, result.UUID);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingPath_UpdatesAllFields()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var pathId = Guid.NewGuid();
        var originalPath = new RoutePath
        {
            UUID = pathId,
            Name = "Original Name",
            Description = "Original description",
            ColorHex = "#000000",
            StartDate = new DateTime(2026, 1, 1),
            GeoJson = "{}",
            EventId = evt.UUID
        };
        context.Paths.Add(originalPath);
        await context.SaveChangesAsync();

        var service = new PathService(context);
        var newStartDate = new DateTime(2026, 3, 15);
        var updatedPath = new RoutePath
        {
            Name = "Updated Name",
            Description = "Updated description",
            ColorHex = "#FFFFFF",
            StartDate = newStartDate,
            GeoJson = "{\"type\":\"LineString\"}",
            EventId = evt.UUID
        };

        // Act
        var result = await service.UpdateAsync(pathId, updatedPath);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Name", result.Name);
        Assert.Equal("Updated description", result.Description);
        Assert.Equal("#FFFFFF", result.ColorHex);
        Assert.Equal(newStartDate, result.StartDate);
        Assert.Equal("{\"type\":\"LineString\"}", result.GeoJson);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingPath_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new PathService(context);
        var updatedPath = new RoutePath
        {
            Name = "Test",
            ColorHex = "#000000",
            StartDate = DateTime.Now,
            GeoJson = "{}",
            EventId = evt.UUID
        };

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), updatedPath);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_CanChangeEvent()
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

        var pathId = Guid.NewGuid();
        var path = new RoutePath
        {
            UUID = pathId,
            Name = "Test Path",
            ColorHex = "#000000",
            StartDate = DateTime.Now,
            GeoJson = "{}",
            EventId = event1.UUID
        };
        context.Paths.Add(path);
        await context.SaveChangesAsync();

        var service = new PathService(context);
        var updatedPath = new RoutePath
        {
            Name = "Test Path",
            ColorHex = "#000000",
            StartDate = DateTime.Now,
            GeoJson = "{}",
            EventId = event2.UUID
        };

        // Act
        var result = await service.UpdateAsync(pathId, updatedPath);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(event2.UUID, result.EventId);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingPath_ReturnsTrueAndDeletes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var pathId = Guid.NewGuid();
        var path = new RoutePath
        {
            UUID = pathId,
            Name = "To Delete",
            ColorHex = "#000000",
            StartDate = DateTime.Now,
            GeoJson = "{}",
            EventId = evt.UUID
        };
        context.Paths.Add(path);
        await context.SaveChangesAsync();

        var service = new PathService(context);

        // Act
        var result = await service.DeleteAsync(pathId);

        // Assert
        Assert.True(result);
        Assert.Null(await context.Paths.FindAsync(pathId));
    }

    [Fact]
    public async Task DeleteAsync_NonExistingPath_ReturnsFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PathService(context);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    #endregion

    #region DeleteAllAsync Tests

    [Fact]
    public async Task DeleteAllAsync_WithPaths_DeletesAllAndReturnsCount()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var paths = new List<RoutePath>
        {
            new() { UUID = Guid.NewGuid(), Name = "Path 1", ColorHex = "#FF0000", StartDate = DateTime.Now, GeoJson = "{}", EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Path 2", ColorHex = "#00FF00", StartDate = DateTime.Now, GeoJson = "{}", EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Path 3", ColorHex = "#0000FF", StartDate = DateTime.Now, GeoJson = "{}", EventId = evt.UUID }
        };
        context.Paths.AddRange(paths);
        await context.SaveChangesAsync();

        var service = new PathService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(3, result);
        Assert.Empty(context.Paths);
    }

    [Fact]
    public async Task DeleteAllAsync_EmptyDatabase_ReturnsZero()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PathService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(0, result);
    }

    #endregion

    #region GeoJson Tests

    [Fact]
    public async Task CreateAsync_WithComplexGeoJson_StoresCorrectly()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new PathService(context);
        var complexGeoJson = @"{
            ""type"": ""LineString"",
            ""coordinates"": [
                [2.3522, 48.8566],
                [2.2945, 48.8584],
                [2.3376, 48.8606]
            ]
        }";
        var path = new RoutePath
        {
            Name = "Complex GeoJson Path",
            ColorHex = "#FF0000",
            StartDate = DateTime.Now,
            GeoJson = complexGeoJson,
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(path);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(complexGeoJson, result.GeoJson);

        // Verify it's persisted correctly
        var retrieved = await service.GetByIdAsync(result.UUID);
        Assert.NotNull(retrieved);
        Assert.Equal(complexGeoJson, retrieved.GeoJson);
    }

    #endregion
}
