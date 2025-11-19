using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;
public class PointService : IPointService
{
    private readonly AppDbContext _context;

    public PointService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Point>> GetAllAsync()
    {
        return await _context.Points
            .Include(p => p.ImagePoints)
            .Include(p => p.Equipment)
            .Include(p => p.Event)
            .ToListAsync();
    }

    public async Task<Point?> GetByIdAsync(Guid id)
    {
        return await _context.Points
            .Include(p => p.ImagePoints)
            .Include(p => p.Equipment)
            .Include(p => p.Event)
            .FirstOrDefaultAsync(p => p.UUID == id);
    }

    public async Task<Point> CreateAsync(Point point)
    {
        if (point.UUID == Guid.Empty)
            point.UUID = Guid.NewGuid();

        _context.Points.Add(point);
        await _context.SaveChangesAsync();
        return point;
    }

    public async Task<Point?> UpdateAsync(Guid id, Point point)
    {
        var existing = await _context.Points.FindAsync(id);
        if (existing == null) return null;

        existing.Latitude = point.Latitude;
        existing.Longitude = point.Longitude;
        existing.Comment = point.Comment;
        existing.ImageId = point.ImageId;
        existing.Order = point.Order;
        existing.IsValid = point.IsValid;
        existing.Modified = DateTime.UtcNow;
        existing.EquipmentQuantity = point.EquipmentQuantity;
        existing.EquipmentId = point.EquipmentId;
        existing.EventId = point.EventId;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var existing = await _context.Points.FindAsync(id);
        if (existing == null) return false;

        _context.Points.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }
}
