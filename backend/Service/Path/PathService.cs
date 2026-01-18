using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;

public class PathService : IPathService
{
    private readonly AppDbContext _context;

    public PathService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<RoutePath>> GetAllAsync()
    {
        return await _context.Paths.ToListAsync();
    }

    public async Task<RoutePath?> GetByIdAsync(Guid id)
    {
        return await _context.Paths
            .FirstOrDefaultAsync(p => p.UUID == id);
    }

    public async Task<IEnumerable<RoutePath>> GetByEventIdAsync(Guid eventId)
    {
        return await _context.Paths
            .Where(p => p.EventId == eventId)
            .ToListAsync();
    }

    public async Task<RoutePath> CreateAsync(RoutePath path)
    {
        if (path.UUID == Guid.Empty)
        {
            path.UUID = Guid.NewGuid();
        }

        _context.Paths.Add(path);
        await _context.SaveChangesAsync();

        return path;
    }

    public async Task<RoutePath?> UpdateAsync(Guid id, RoutePath path)
    {
        var existing = await _context.Paths.FindAsync(id);

        if (existing == null)
        {
            return null;
        }

        existing.Name = path.Name;
        existing.Description = path.Description;
        existing.ColorHex = path.ColorHex;
        existing.StartDate = path.StartDate;
        existing.GeoJson = path.GeoJson;
        existing.EventId = path.EventId;

        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var existing = await _context.Paths.FindAsync(id);

        if (existing == null)
        {
            return false;
        }

        _context.Paths.Remove(existing);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int> DeleteAllAsync()
    {
        var paths = await _context.Paths.ToListAsync();
        var count = paths.Count;
        _context.Paths.RemoveRange(paths);
        await _context.SaveChangesAsync();
        return count;
    }
}
