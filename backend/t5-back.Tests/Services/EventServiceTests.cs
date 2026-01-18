using t5_back.Models;
using t5_back.Services;
using t5_back.Tests.Helpers;

namespace t5_back.Tests.Services;

public class EventServiceTests
{
    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_EmptyDatabase_ReturnsEmptyList()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EventService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithEvents_ReturnsAllEvents()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var events = new List<Event>
        {
            new() { UUID = Guid.NewGuid(), Title = "Event 1", StartDate = DateTime.Now, EndDate = DateTime.Now.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 120 },
            new() { UUID = Guid.NewGuid(), Title = "Event 2", StartDate = DateTime.Now, EndDate = DateTime.Now.AddDays(2), Status = EventStatus.InProgress, MinDurationMinutes = 60, MaxDurationMinutes = 180 }
        };
        context.Events.AddRange(events);
        await context.SaveChangesAsync();

        var service = new EventService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Equal(2, result.Count());
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsEvent()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var eventId = Guid.NewGuid();
        var evt = new Event
        {
            UUID = eventId,
            Title = "Test Event",
            StartDate = new DateTime(2026, 1, 15),
            EndDate = new DateTime(2026, 1, 20),
            Status = EventStatus.ToOrganize,
            MinDurationMinutes = 30,
            MaxDurationMinutes = 120
        };
        context.Events.Add(evt);
        await context.SaveChangesAsync();

        var service = new EventService(context);

        // Act
        var result = await service.GetByIdAsync(eventId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(eventId, result.UUID);
        Assert.Equal("Test Event", result.Title);
        Assert.Equal(EventStatus.ToOrganize, result.Status);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EventService(context);

        // Act
        var result = await service.GetByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidEvent_ReturnsCreatedEvent()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EventService(context);
        var evt = new Event
        {
            Title = "New Event",
            StartDate = new DateTime(2026, 2, 1),
            EndDate = new DateTime(2026, 2, 5),
            Status = EventStatus.ToOrganize,
            MinDurationMinutes = 45,
            MaxDurationMinutes = 90
        };

        // Act
        var result = await service.CreateAsync(evt);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.UUID);
        Assert.Equal("New Event", result.Title);
    }

    [Fact]
    public async Task CreateAsync_WithProvidedId_UsesProvidedId()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EventService(context);
        var providedId = Guid.NewGuid();
        var evt = new Event
        {
            UUID = providedId,
            Title = "Event With ID",
            StartDate = DateTime.Now,
            EndDate = DateTime.Now.AddDays(1),
            Status = EventStatus.InProgress,
            MinDurationMinutes = 30,
            MaxDurationMinutes = 60
        };

        // Act
        var result = await service.CreateAsync(evt);

        // Assert
        Assert.Equal(providedId, result.UUID);
    }

    [Fact]
    public async Task CreateAsync_AllEventStatuses_CreatesSuccessfully()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EventService(context);
        var statuses = Enum.GetValues<EventStatus>();

        foreach (var status in statuses)
        {
            // Act
            var evt = new Event
            {
                Title = $"Event {status}",
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(1),
                Status = status,
                MinDurationMinutes = 30,
                MaxDurationMinutes = 60
            };
            var result = await service.CreateAsync(evt);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(status, result.Status);
        }
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingEvent_UpdatesAllFields()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var eventId = Guid.NewGuid();
        var originalEvent = new Event
        {
            UUID = eventId,
            Title = "Original Title",
            StartDate = new DateTime(2026, 1, 1),
            EndDate = new DateTime(2026, 1, 5),
            Status = EventStatus.ToOrganize,
            MinDurationMinutes = 30,
            MaxDurationMinutes = 60
        };
        context.Events.Add(originalEvent);
        await context.SaveChangesAsync();

        var service = new EventService(context);
        var updatedEvent = new Event
        {
            Title = "Updated Title",
            StartDate = new DateTime(2026, 2, 1),
            EndDate = new DateTime(2026, 2, 10),
            Status = EventStatus.Completed,
            MinDurationMinutes = 45,
            MaxDurationMinutes = 120
        };

        // Act
        var result = await service.UpdateAsync(eventId, updatedEvent);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Title", result.Title);
        Assert.Equal(new DateTime(2026, 2, 1), result.StartDate);
        Assert.Equal(new DateTime(2026, 2, 10), result.EndDate);
        Assert.Equal(EventStatus.Completed, result.Status);
        Assert.Equal(45, result.MinDurationMinutes);
        Assert.Equal(120, result.MaxDurationMinutes);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingEvent_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EventService(context);
        var updatedEvent = new Event
        {
            Title = "Test",
            StartDate = DateTime.Now,
            EndDate = DateTime.Now.AddDays(1),
            Status = EventStatus.ToOrganize,
            MinDurationMinutes = 30,
            MaxDurationMinutes = 60
        };

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), updatedEvent);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingEvent_ReturnsTrueAndDeletes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var eventId = Guid.NewGuid();
        var evt = new Event
        {
            UUID = eventId,
            Title = "To Delete",
            StartDate = DateTime.Now,
            EndDate = DateTime.Now.AddDays(1),
            Status = EventStatus.ToOrganize,
            MinDurationMinutes = 30,
            MaxDurationMinutes = 60
        };
        context.Events.Add(evt);
        await context.SaveChangesAsync();

        var service = new EventService(context);

        // Act
        var result = await service.DeleteAsync(eventId);

        // Assert
        Assert.True(result);
        Assert.Null(await context.Events.FindAsync(eventId));
    }

    [Fact]
    public async Task DeleteAsync_NonExistingEvent_ReturnsFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EventService(context);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    #endregion

    #region DeleteAllAsync Tests

    [Fact]
    public async Task DeleteAllAsync_WithEvents_DeletesAllAndReturnsCount()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var events = new List<Event>
        {
            new() { UUID = Guid.NewGuid(), Title = "Event 1", StartDate = DateTime.Now, EndDate = DateTime.Now.AddDays(1), Status = EventStatus.ToOrganize, MinDurationMinutes = 30, MaxDurationMinutes = 60 },
            new() { UUID = Guid.NewGuid(), Title = "Event 2", StartDate = DateTime.Now, EndDate = DateTime.Now.AddDays(2), Status = EventStatus.InProgress, MinDurationMinutes = 30, MaxDurationMinutes = 60 }
        };
        context.Events.AddRange(events);
        await context.SaveChangesAsync();

        var service = new EventService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(2, result);
        Assert.Empty(context.Events);
    }

    [Fact]
    public async Task DeleteAllAsync_EmptyDatabase_ReturnsZero()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EventService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(0, result);
    }

    #endregion
}
