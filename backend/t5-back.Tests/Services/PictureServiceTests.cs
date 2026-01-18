using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;
using t5_back.Services;
using t5_back.Tests.Helpers;

namespace t5_back.Tests.Services;

public class PictureServiceTests
{
    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_EmptyDatabase_ReturnsEmptyList()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WithPictures_ReturnsAllPictures()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        var picture1 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 1, 2, 3 } };
        var picture2 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 4, 5, 6 } };
        context.Pictures.AddRange(picture1, picture2);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetAllAsync();

        // Assert
        Assert.Equal(2, result.Count());
    }

    #endregion

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsPicture()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        var pictureId = Guid.NewGuid();
        var pictureData = new byte[] { 1, 2, 3, 4, 5 };
        var picture = new Picture { UUID = pictureId, PictureData = pictureData };
        context.Pictures.Add(picture);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetByIdAsync(pictureId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(pictureId, result.UUID);
        Assert.Equal(pictureData, result.PictureData);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        // Act
        var result = await service.GetByIdAsync(Guid.NewGuid());

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region GetByPointIdAsync Tests

    [Fact]
    public async Task GetByPointIdAsync_ReturnsPicturesForPoint()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        var pointId = Guid.NewGuid();
        var picture1 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 1 }, PointId = pointId };
        var picture2 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 2 }, PointId = pointId };
        var picture3 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 3 }, PointId = Guid.NewGuid() };
        context.Pictures.AddRange(picture1, picture2, picture3);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetByPointIdAsync(pointId);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, p => Assert.Equal(pointId, p.PointId));
    }

    [Fact]
    public async Task GetByPointIdAsync_NoPicturesForPoint_ReturnsEmpty()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        // Act
        var result = await service.GetByPointIdAsync(Guid.NewGuid());

        // Assert
        Assert.Empty(result);
    }

    #endregion

    #region GetBySecurityZoneIdAsync Tests

    [Fact]
    public async Task GetBySecurityZoneIdAsync_ReturnsPicturesForSecurityZone()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        var securityZoneId = Guid.NewGuid();
        var picture1 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 1 }, SecurityZoneId = securityZoneId };
        var picture2 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 2 }, SecurityZoneId = securityZoneId };
        var picture3 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 3 }, SecurityZoneId = Guid.NewGuid() };
        context.Pictures.AddRange(picture1, picture2, picture3);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetBySecurityZoneIdAsync(securityZoneId);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, p => Assert.Equal(securityZoneId, p.SecurityZoneId));
    }

    [Fact]
    public async Task GetBySecurityZoneIdAsync_NoPicturesForSecurityZone_ReturnsEmpty()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        // Act
        var result = await service.GetBySecurityZoneIdAsync(Guid.NewGuid());

        // Assert
        Assert.Empty(result);
    }

    #endregion

    #region CreateAsync Tests

    [Fact]
    public async Task CreateAsync_ValidPicture_ReturnsCreatedPicture()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        var pictureId = Guid.NewGuid();
        var pictureData = new byte[] { 1, 2, 3 };
        var picture = new Picture { UUID = pictureId, PictureData = pictureData };

        // Act
        var result = await service.CreateAsync(picture);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(pictureId, result.UUID);
        Assert.Equal(pictureData, result.PictureData);

        var dbPicture = await context.Pictures.FindAsync(pictureId);
        Assert.NotNull(dbPicture);
    }

    [Fact]
    public async Task CreateAsync_WithEmptyGuid_GeneratesNewGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        var pictureData = new byte[] { 7, 8, 9 };
        var picture = new Picture { UUID = Guid.Empty, PictureData = pictureData };

        // Act
        var result = await service.CreateAsync(picture);

        // Assert
        Assert.NotEqual(Guid.Empty, result.UUID);
        Assert.Equal(pictureData, result.PictureData);
    }

    [Fact]
    public async Task CreateAsync_WithProvidedGuid_UsesProvidedGuid()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        var customId = Guid.NewGuid();
        var picture = new Picture { UUID = customId, PictureData = new byte[] { 10, 11 } };

        // Act
        var result = await service.CreateAsync(picture);

        // Assert
        Assert.Equal(customId, result.UUID);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ExistingPicture_UpdatesPictureData()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        var pictureId = Guid.NewGuid();
        var originalData = new byte[] { 1, 2, 3 };
        var updatedData = new byte[] { 4, 5, 6, 7 };
        var picture = new Picture { UUID = pictureId, PictureData = originalData };
        context.Pictures.Add(picture);
        await context.SaveChangesAsync();

        var updatedPicture = new Picture { PictureData = updatedData };

        // Act
        var result = await service.UpdateAsync(pictureId, updatedPicture);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(updatedData, result.PictureData);

        var dbPicture = await context.Pictures.FindAsync(pictureId);
        Assert.Equal(updatedData, dbPicture!.PictureData);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingPicture_ReturnsNull()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        var updatedPicture = new Picture { PictureData = new byte[] { 99 } };

        // Act
        var result = await service.UpdateAsync(Guid.NewGuid(), updatedPicture);

        // Assert
        Assert.Null(result);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingPicture_ReturnsTrueAndDeletes()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        var pictureId = Guid.NewGuid();
        var picture = new Picture { UUID = pictureId, PictureData = new byte[] { 1, 2 } };
        context.Pictures.Add(picture);
        await context.SaveChangesAsync();

        // Act
        var result = await service.DeleteAsync(pictureId);

        // Assert
        Assert.True(result);

        var dbPicture = await context.Pictures.FindAsync(pictureId);
        Assert.Null(dbPicture);
    }

    [Fact]
    public async Task DeleteAsync_NonExistingPicture_ReturnsFalse()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        // Act
        var result = await service.DeleteAsync(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    #endregion

    #region DeleteAllAsync Tests

    [Fact]
    public async Task DeleteAllAsync_WithPictures_DeletesAllAndReturnsCount()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        var picture1 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 1 } };
        var picture2 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 2 } };
        var picture3 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 3 } };
        context.Pictures.AddRange(picture1, picture2, picture3);
        await context.SaveChangesAsync();

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(3, result);
        Assert.Empty(await context.Pictures.ToListAsync());
    }

    [Fact]
    public async Task DeleteAllAsync_EmptyDatabase_ReturnsZero()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        // Act
        var result = await service.DeleteAllAsync();

        // Assert
        Assert.Equal(0, result);
    }

    #endregion

    #region TransferFromPointToSecurityZoneAsync Tests

    [Fact]
    public async Task TransferFromPointToSecurityZoneAsync_TransfersPicturesAndReturnsCount()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        var pointId = Guid.NewGuid();
        var securityZoneId = Guid.NewGuid();

        var picture1 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 1 }, PointId = pointId };
        var picture2 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 2 }, PointId = pointId };
        var picture3 = new Picture { UUID = Guid.NewGuid(), PictureData = new byte[] { 3 }, PointId = Guid.NewGuid() };
        context.Pictures.AddRange(picture1, picture2, picture3);
        await context.SaveChangesAsync();

        // Act
        var result = await service.TransferFromPointToSecurityZoneAsync(pointId, securityZoneId);

        // Assert
        Assert.Equal(2, result);

        var transferredPictures = await context.Pictures
            .Where(p => p.SecurityZoneId == securityZoneId)
            .ToListAsync();
        Assert.Equal(2, transferredPictures.Count);
        Assert.All(transferredPictures, p =>
        {
            Assert.Null(p.PointId);
            Assert.Equal(securityZoneId, p.SecurityZoneId);
        });
    }

    [Fact]
    public async Task TransferFromPointToSecurityZoneAsync_NoPicturesForPoint_ReturnsZero()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        // Act
        var result = await service.TransferFromPointToSecurityZoneAsync(Guid.NewGuid(), Guid.NewGuid());

        // Assert
        Assert.Equal(0, result);
    }

    [Fact]
    public async Task TransferFromPointToSecurityZoneAsync_UpdatesExistingPictures()
    {
        // Arrange
        using var context = TestDbContextFactory.CreateContext();
        var service = new PictureService(context);

        var pointId = Guid.NewGuid();
        var securityZoneId = Guid.NewGuid();

        var picture = new Picture
        {
            UUID = Guid.NewGuid(),
            PictureData = new byte[] { 1 },
            PointId = pointId,
            SecurityZoneId = null
        };
        context.Pictures.Add(picture);
        await context.SaveChangesAsync();

        // Act
        await service.TransferFromPointToSecurityZoneAsync(pointId, securityZoneId);

        // Assert
        var updatedPicture = await context.Pictures.FindAsync(picture.UUID);
        Assert.NotNull(updatedPicture);
        Assert.Null(updatedPicture.PointId);
        Assert.Equal(securityZoneId, updatedPicture.SecurityZoneId);
    }

    #endregion
}
