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
            .Include(p => p.Equipment)
            .ToListAsync();
    }

    public async Task<Point?> GetByIdAsync(Guid id)
    {
        return await _context.Points
            .Include(p => p.Equipment)
            .FirstOrDefaultAsync(p => p.UUID == id);
    }

    public async Task<IEnumerable<Point>> GetByEventIdAsync(Guid eventId)
    {
        return await _context.Points
            .Where(p => p.EventId == eventId)
            .Include(p => p.Equipment)
            .OrderBy(p => p.Order)
            .ToListAsync();
    }

    public async Task<Point> CreateAsync(Point point)
    {
        if (point.UUID == Guid.Empty)
        {
            point.UUID = Guid.NewGuid();
        }
        else
        {
            var exists = await _context.Points.AnyAsync(p => p.UUID == point.UUID);
            if (exists)
            {
                throw new InvalidOperationException($"A Point with UUID {point.UUID} already exists.");
            }
        }

        _context.Points.Add(point);
        await _context.SaveChangesAsync();
        return point;
    }

    public async Task<Point?> UpdateAsync(Guid id, Point point)
    {
        var existing = await _context.Points.FindAsync(id);
        if (existing == null) return null;

        existing.Name = point.Name;
        existing.Latitude = point.Latitude;
        existing.Longitude = point.Longitude;
        existing.Comment = point.Comment;
        existing.Order = point.Order;
        existing.Validated = point.Validated;
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

    public async Task<int> DeleteAllAsync()
    {
        var points = await _context.Points.ToListAsync();
        var count = points.Count;
        _context.Points.RemoveRange(points);
        await _context.SaveChangesAsync();
        return count;
    }
}

