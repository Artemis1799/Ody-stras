using t5_back.Models;
using t5_back.Services;
using t5_back.Tests.Helpers;

namespace t5_back.Tests.Services;

public class EquipmentServiceTests
{
    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_EmptyDatabase_ReturnsEmptyList()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EquipmentService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithEquipments_ReturnsAllEquipments()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var equipments = new List<Equipment>
        {
            new() { UUID = Guid.NewGuid(), Type = "Barrier", Length = 2.5f, StorageType = StorageType.Single },
            new() { UUID = Guid.NewGuid(), Type = "Fence", Length = 3.0f, StorageType = StorageType.Multiple },
            new() { UUID = Guid.NewGuid(), Type = "Cone", Description = "Traffic cone" }
        };
        context.Equipments.AddRange(equipments);
        await context.SaveChangesAsync();

        var service = new EquipmentService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Equal(3, result.Count());
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsEquipment()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var equipmentId = Guid.NewGuid();
        var equipment = new Equipment
        {
            UUID = equipmentId,
            Type = "Barrier",
            Length = 2.5f,
            Description = "Safety barrier",
            StorageType = StorageType.Single
        };
        context.Equipments.Add(equipment);
        await context.SaveChangesAsync();

        var service = new EquipmentService(context);

        // Act
        var result = await service.GetByIdAsync(equipmentId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(equipmentId, result.UUID);
        Assert.Equal("Barrier", result.Type);
        Assert.Equal(2.5f, result.Length);
        Assert.Equal("Safety barrier", result.Description);
        Assert.Equal(StorageType.Single, result.StorageType);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EquipmentService(context);

        // Act
        var result = await service.GetByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidEquipment_ReturnsCreatedEquipment()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EquipmentService(context);
        var equipment = new Equipment
        {
            Type = "New Equipment",
            Length = 5.0f,
            Description = "Brand new equipment",
            StorageType = StorageType.Multiple
        };

        // Act
        var result = await service.CreateAsync(equipment);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.UUID);
        Assert.Equal("New Equipment", result.Type);
        Assert.Equal(5.0f, result.Length);
    }

    [Fact]
    public async Task CreateAsync_WithEmptyGuid_GeneratesNewGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EquipmentService(context);
        var equipment = new Equipment
        {
            UUID = Guid.Empty,
            Type = "Test"
        };

        // Act
        var result = await service.CreateAsync(equipment);

        // Assert
        Assert.NotEqual(Guid.Empty, result.UUID);
    }

    [Fact]
    public async Task CreateAsync_WithAllStorageTypes_CreatesSuccessfully()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EquipmentService(context);

        // Act & Assert for Single
        var singleEquipment = new Equipment { Type = "Single Storage", StorageType = StorageType.Single };
        var singleResult = await service.CreateAsync(singleEquipment);
        Assert.Equal(StorageType.Single, singleResult.StorageType);

        // Act & Assert for Multiple
        var multipleEquipment = new Equipment { Type = "Multiple Storage", StorageType = StorageType.Multiple };
        var multipleResult = await service.CreateAsync(multipleEquipment);
        Assert.Equal(StorageType.Multiple, multipleResult.StorageType);
    }

    [Fact]
    public async Task CreateAsync_WithNullStorageType_CreatesSuccessfully()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EquipmentService(context);
        var equipment = new Equipment { Type = "No Storage Type" };

        // Act
        var result = await service.CreateAsync(equipment);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.StorageType);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingEquipment_UpdatesAllFields()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var equipmentId = Guid.NewGuid();
        var originalEquipment = new Equipment
        {
            UUID = equipmentId,
            Type = "Original Type",
            Length = 1.0f,
            Description = "Original description",
            StorageType = StorageType.Single
        };
        context.Equipments.Add(originalEquipment);
        await context.SaveChangesAsync();

        var service = new EquipmentService(context);
        var updatedEquipment = new Equipment
        {
            Type = "Updated Type",
            Length = 10.0f,
            Description = "Updated description",
            StorageType = StorageType.Multiple
        };

        // Act
        var result = await service.UpdateAsync(equipmentId, updatedEquipment);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated Type", result.Type);
        Assert.Equal(10.0f, result.Length);
        Assert.Equal("Updated description", result.Description);
        Assert.Equal(StorageType.Multiple, result.StorageType);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingEquipment_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EquipmentService(context);
        var updatedEquipment = new Equipment { Type = "Test" };

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), updatedEquipment);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_PartialUpdate_UpdatesOnlyProvidedFields()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var equipmentId = Guid.NewGuid();
        var originalEquipment = new Equipment
        {
            UUID = equipmentId,
            Type = "Original Type",
            Length = 5.0f,
            Description = "Original description",
            StorageType = StorageType.Single
        };
        context.Equipments.Add(originalEquipment);
        await context.SaveChangesAsync();

        var service = new EquipmentService(context);
        var updatedEquipment = new Equipment
        {
            Type = "New Type",
            Length = null,
            Description = null,
            StorageType = null
        };

        // Act
        var result = await service.UpdateAsync(equipmentId, updatedEquipment);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("New Type", result.Type);
        Assert.Null(result.Length);
        Assert.Null(result.Description);
        Assert.Null(result.StorageType);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingEquipment_ReturnsTrueAndDeletes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var equipmentId = Guid.NewGuid();
        var equipment = new Equipment
        {
            UUID = equipmentId,
            Type = "To Delete"
        };
        context.Equipments.Add(equipment);
        await context.SaveChangesAsync();

        var service = new EquipmentService(context);

        // Act
        var result = await service.DeleteAsync(equipmentId);

        // Assert
        Assert.True(result);
        Assert.Null(await context.Equipments.FindAsync(equipmentId));
    }

    [Fact]
    public async Task DeleteAsync_NonExistingEquipment_ReturnsFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EquipmentService(context);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    #endregion

    #region DeleteAllAsync Tests

    [Fact]
    public async Task DeleteAllAsync_WithEquipments_DeletesAllAndReturnsCount()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var equipments = new List<Equipment>
        {
            new() { UUID = Guid.NewGuid(), Type = "Equipment 1" },
            new() { UUID = Guid.NewGuid(), Type = "Equipment 2" },
            new() { UUID = Guid.NewGuid(), Type = "Equipment 3" },
            new() { UUID = Guid.NewGuid(), Type = "Equipment 4" }
        };
        context.Equipments.AddRange(equipments);
        await context.SaveChangesAsync();

        var service = new EquipmentService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(4, result);
        Assert.Empty(context.Equipments);
    }

    [Fact]
    public async Task DeleteAllAsync_EmptyDatabase_ReturnsZero()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new EquipmentService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(0, result);
    }

    #endregion
}
