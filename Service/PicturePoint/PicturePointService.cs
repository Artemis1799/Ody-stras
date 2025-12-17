using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;

public class PicturePointService : IPicturePointService
{
    private readonly AppDbContext _context;

    public PicturePointService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PicturePoint>> GetAllAsync()
    {
        return await _context.PicturePoints
            .Include(pp => pp.Picture)
            .Include(pp => pp.Point)
            .ToListAsync();
    }

    public async Task<IEnumerable<PicturePoint>> GetByPointIdAsync(Guid pointId)
    {
        return await _context.PicturePoints
            .Where(pp => pp.PointId == pointId)
            .Include(pp => pp.Picture)
            .ToListAsync();
    }

    public async Task<IEnumerable<PicturePoint>> GetByPictureIdAsync(Guid pictureId)
    {
        return await _context.PicturePoints
            .Where(pp => pp.PictureId == pictureId)
            .Include(pp => pp.Point)
            .ToListAsync();
    }

    public async Task<PicturePoint?> GetByIdAsync(Guid pictureId, Guid pointId)
    {
        return await _context.PicturePoints
            .Include(pp => pp.Picture)
            .Include(pp => pp.Point)
            .FirstOrDefaultAsync(pp => pp.PictureId == pictureId && pp.PointId == pointId);
    }

    public async Task<PicturePoint> CreateAsync(PicturePoint picturePoint)
    {
        _context.PicturePoints.Add(picturePoint);
        await _context.SaveChangesAsync();
        return picturePoint;
    }

    public async Task<bool> DeleteAsync(Guid pictureId, Guid pointId)
    {
        var existing = await _context.PicturePoints
            .FirstOrDefaultAsync(pp => pp.PictureId == pictureId && pp.PointId == pointId);

        if (existing == null)
        {
            return false;
        }

        _context.PicturePoints.Remove(existing);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int> DeleteAllAsync()
    {
        var picturePoints = await _context.PicturePoints.ToListAsync();
        var count = picturePoints.Count;
        _context.PicturePoints.RemoveRange(picturePoints);
        await _context.SaveChangesAsync();
        return count;
    }
}
