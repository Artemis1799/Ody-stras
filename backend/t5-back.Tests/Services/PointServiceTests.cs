using t5_back.Models;
using t5_back.Services;
using t5_back.Tests.Helpers;

namespace t5_back.Tests.Services;

public class PointServiceTests
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
            Type = "Test Equipment",
            Length = 2.0f
        };
        context.Equipments.Add(equipment);
        await context.SaveChangesAsync();
        return equipment;
    }

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_EmptyDatabase_ReturnsEmptyList()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PointService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithPoints_ReturnsAllPoints()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);

        var points = new List<Point>
        {
            new() { UUID = Guid.NewGuid(), Name = "Point A", Latitude = 48.8566f, Longitude = 2.3522f, EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Point B", Latitude = 48.8584f, Longitude = 2.2945f, EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Point C", Latitude = 48.8606f, Longitude = 2.3376f, EventId = evt.UUID }
        };
        context.Points.AddRange(points);
        await context.SaveChangesAsync();

        var service = new PointService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Equal(3, result.Count());
    }

    [Fact]
    public async Task GetAllAsync_IncludesEquipment()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);

        var point = new Point
        {
            UUID = Guid.NewGuid(),
            Name = "Point with Equipment",
            Latitude = 48.8566f,
            Longitude = 2.3522f,
            EventId = evt.UUID,
            EquipmentId = equipment.UUID
        };
        context.Points.Add(point);
        await context.SaveChangesAsync();

        var service = new PointService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        var resultPoint = result.First();
        Assert.NotNull(resultPoint.Equipment);
        Assert.Equal(equipment.UUID, resultPoint.Equipment!.UUID);
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsPoint()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var pointId = Guid.NewGuid();
        var point = new Point
        {
            UUID = pointId,
            Name = "Test Point",
            Latitude = 48.8566f,
            Longitude = 2.3522f,
            Comment = "A test comment",
            Order = 1,
            Validated = true,
            IsPointOfInterest = true,
            EventId = evt.UUID
        };
        context.Points.Add(point);
        await context.SaveChangesAsync();

        var service = new PointService(context);

        // Act
        var result = await service.GetByIdAsync(pointId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(pointId, result.UUID);
        Assert.Equal("Test Point", result.Name);
        Assert.Equal(48.8566f, result.Latitude);
        Assert.Equal(2.3522f, result.Longitude);
        Assert.Equal("A test comment", result.Comment);
        Assert.Equal(1, result.Order);
        Assert.True(result.Validated);
        Assert.True(result.IsPointOfInterest);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PointService(context);

        // Act
        var result = await service.GetByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_IncludesEquipment()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var pointId = Guid.NewGuid();

        var point = new Point
        {
            UUID = pointId,
            Name = "Point with Equipment",
            Latitude = 48.8566f,
            Longitude = 2.3522f,
            EventId = evt.UUID,
            EquipmentId = equipment.UUID
        };
        context.Points.Add(point);
        await context.SaveChangesAsync();

        var service = new PointService(context);

        // Act
        var result = await service.GetByIdAsync(pointId);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Equipment);
        Assert.Equal(equipment.UUID, result.Equipment!.UUID);
    }

    #endregion

    #region GetByEventIdAsync Tests

    [Fact]
    public async Task GetByEventIdAsync_ReturnsPointsForEvent()
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

        var points = new List<Point>
        {
            new() { UUID = Guid.NewGuid(), Name = "Point 1 Event 1", Latitude = 48.8f, Longitude = 2.3f, Order = 2, EventId = event1.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Point 2 Event 1", Latitude = 48.9f, Longitude = 2.4f, Order = 1, EventId = event1.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Point 3 Event 2", Latitude = 49.0f, Longitude = 2.5f, Order = 1, EventId = event2.UUID }
        };
        context.Points.AddRange(points);
        await context.SaveChangesAsync();

        var service = new PointService(context);

        // Act
        var result = await service.GetByEventIdAsync(event1.UUID);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, p => Assert.Equal(event1.UUID, p.EventId));
    }

    [Fact]
    public async Task GetByEventIdAsync_ReturnsOrderedByOrder()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);

        var points = new List<Point>
        {
            new() { UUID = Guid.NewGuid(), Name = "Point C", Latitude = 48.8f, Longitude = 2.3f, Order = 3, EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Point A", Latitude = 48.9f, Longitude = 2.4f, Order = 1, EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Point B", Latitude = 49.0f, Longitude = 2.5f, Order = 2, EventId = evt.UUID }
        };
        context.Points.AddRange(points);
        await context.SaveChangesAsync();

        var service = new PointService(context);

        // Act
        var result = await service.GetByEventIdAsync(evt.UUID);

        // Assert
        var resultList = result.ToList();
        Assert.Equal("Point A", resultList[0].Name);
        Assert.Equal("Point B", resultList[1].Name);
        Assert.Equal("Point C", resultList[2].Name);
    }

    [Fact]
    public async Task GetByEventIdAsync_NoPointsForEvent_ReturnsEmpty()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new PointService(context);

        // Act
        var result = await service.GetByEventIdAsync(evt.UUID);

        // Assert
        Assert.Empty(result);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidPoint_ReturnsCreatedPoint()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new PointService(context);
        var point = new Point
        {
            Name = "New Point",
            Latitude = 48.8566f,
            Longitude = 2.3522f,
            Comment = "New comment",
            Order = 5,
            Validated = false,
            IsPointOfInterest = true,
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(point);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.UUID);
        Assert.Equal("New Point", result.Name);
        Assert.Equal(48.8566f, result.Latitude);
        Assert.Equal(2.3522f, result.Longitude);
    }

    [Fact]
    public async Task CreateAsync_WithEmptyGuid_GeneratesNewGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new PointService(context);
        var point = new Point
        {
            UUID = Guid.Empty,
            Name = "Test",
            Latitude = 0f,
            Longitude = 0f,
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(point);

        // Assert
        Assert.NotEqual(Guid.Empty, result.UUID);
    }

    [Fact]
    public async Task CreateAsync_WithProvidedGuid_UsesProvidedGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new PointService(context);
        var providedId = Guid.NewGuid();
        var point = new Point
        {
            UUID = providedId,
            Name = "Test",
            Latitude = 0f,
            Longitude = 0f,
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(point);

        // Assert
        Assert.Equal(providedId, result.UUID);
    }

    [Fact]
    public async Task CreateAsync_DuplicateGuid_ThrowsException()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new PointService(context);
        var duplicateId = Guid.NewGuid();

        var point1 = new Point
        {
            UUID = duplicateId,
            Name = "First Point",
            Latitude = 0f,
            Longitude = 0f,
            EventId = evt.UUID
        };
        await service.CreateAsync(point1);

        var point2 = new Point
        {
            UUID = duplicateId,
            Name = "Second Point",
            Latitude = 0f,
            Longitude = 0f,
            EventId = evt.UUID
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(point2));
    }

    [Fact]
    public async Task CreateAsync_WithEquipment_LinksEquipment()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var service = new PointService(context);

        var point = new Point
        {
            Name = "Point with Equipment",
            Latitude = 48.8566f,
            Longitude = 2.3522f,
            EventId = evt.UUID,
            EquipmentId = equipment.UUID
        };

        // Act
        var result = await service.CreateAsync(point);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(equipment.UUID, result.EquipmentId);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingPoint_UpdatesAllFields()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var equipment = await CreateTestEquipment(context);
        var pointId = Guid.NewGuid();

        var originalPoint = new Point
        {
            UUID = pointId,
            Name = "Original Name",
            Latitude = 0f,
            Longitude = 0f,
            Comment = "Original comment",
            Order = 1,
            Validated = false,
            IsPointOfInterest = false,
            EventId = evt.UUID
        };
        context.Points.Add(originalPoint);
        await context.SaveChangesAsync();

        var service = new PointService(context);
        var updatedPoint = new Point
        {
            Name = "Updated Name",
            Latitude = 48.8566f,
            Longitude = 2.3522f,
            Comment = "Updated comment",
            Order = 10,
            Validated = true,
            EquipmentId = equipment.UUID,
            EventId = evt.UUID
        };

        // Act
        var result = await service.UpdateAsync(pointId, updatedPoint);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Name", result.Name);
        Assert.Equal(48.8566f, result.Latitude);
        Assert.Equal(2.3522f, result.Longitude);
        Assert.Equal("Updated comment", result.Comment);
        Assert.Equal(10, result.Order);
        Assert.True(result.Validated);
        Assert.Equal(equipment.UUID, result.EquipmentId);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingPoint_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new PointService(context);
        var updatedPoint = new Point
        {
            Name = "Test",
            Latitude = 0f,
            Longitude = 0f,
            EventId = evt.UUID
        };

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), updatedPoint);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingPoint_ReturnsTrueAndDeletes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var pointId = Guid.NewGuid();
        var point = new Point
        {
            UUID = pointId,
            Name = "To Delete",
            Latitude = 0f,
            Longitude = 0f,
            EventId = evt.UUID
        };
        context.Points.Add(point);
        await context.SaveChangesAsync();

        var service = new PointService(context);

        // Act
        var result = await service.DeleteAsync(pointId);

        // Assert
        Assert.True(result);
        Assert.Null(await context.Points.FindAsync(pointId));
    }

    [Fact]
    public async Task DeleteAsync_NonExistingPoint_ReturnsFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PointService(context);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    #endregion

    #region DeleteAllAsync Tests

    [Fact]
    public async Task DeleteAllAsync_WithPoints_DeletesAllAndReturnsCount()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var points = new List<Point>
        {
            new() { UUID = Guid.NewGuid(), Name = "Point 1", Latitude = 0f, Longitude = 0f, EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Point 2", Latitude = 0f, Longitude = 0f, EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Point 3", Latitude = 0f, Longitude = 0f, EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Point 4", Latitude = 0f, Longitude = 0f, EventId = evt.UUID },
            new() { UUID = Guid.NewGuid(), Name = "Point 5", Latitude = 0f, Longitude = 0f, EventId = evt.UUID }
        };
        context.Points.AddRange(points);
        await context.SaveChangesAsync();

        var service = new PointService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(5, result);
        Assert.Empty(context.Points);
    }

    [Fact]
    public async Task DeleteAllAsync_EmptyDatabase_ReturnsZero()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PointService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(0, result);
    }

    #endregion

    #region Coordinate Validation Tests

    [Theory]
    [InlineData(90f, 180f)]    // Max valid
    [InlineData(-90f, -180f)]  // Min valid
    [InlineData(0f, 0f)]       // Origin
    [InlineData(48.8566f, 2.3522f)] // Paris
    [InlineData(-33.8688f, 151.2093f)] // Sydney
    public async Task CreateAsync_ValidCoordinates_CreatesSuccessfully(float latitude, float longitude)
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var evt = await CreateTestEvent(context);
        var service = new PointService(context);
        var point = new Point
        {
            Name = $"Point at {latitude}, {longitude}",
            Latitude = latitude,
            Longitude = longitude,
            EventId = evt.UUID
        };

        // Act
        var result = await service.CreateAsync(point);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(latitude, result.Latitude);
        Assert.Equal(longitude, result.Longitude);
    }

    #endregion
}
