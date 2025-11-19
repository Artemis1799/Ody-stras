using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;
public class ImagePointService : IImagePointService
{
    private readonly AppDbContext _context;

    public ImagePointService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ImagePoint>> GetAllAsync()
    {
        return await _context.ImagePoints
            .Include(ip => ip.Photo)
            .Include(ip => ip.Point)
            .ToListAsync();
    }

    public async Task<ImagePoint?> GetByIdsAsync(Guid imageId, Guid pointId)
    {
        return await _context.ImagePoints
            .Include(ip => ip.Photo)
            .Include(ip => ip.Point)
            .FirstOrDefaultAsync(ip => ip.ImageId == imageId && ip.PointId == pointId);
    }

    public async Task<ImagePoint> CreateAsync(ImagePoint imagePoint)
    {
        _context.ImagePoints.Add(imagePoint);
        await _context.SaveChangesAsync();
        return imagePoint;
    }

    public async Task<ImagePoint?> UpdateAsync(Guid imageId, Guid pointId, ImagePoint imagePoint)
    {
        var existing = await _context.ImagePoints.FindAsync(imageId, pointId);
        if (existing == null) return null;

        // For this join entity there are no additional payload fields, but if there were, update them here.
        // Keep navigation properties in sync if provided
        existing.ImageId = imagePoint.ImageId;
        existing.PointId = imagePoint.PointId;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(Guid imageId, Guid pointId)
    {
        var existing = await _context.ImagePoints.FindAsync(imageId, pointId);
        if (existing == null) return false;

        _context.ImagePoints.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}
