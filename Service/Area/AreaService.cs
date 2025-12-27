using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;

public class AreaService : IAreaService
{
    private readonly AppDbContext _context;

    public AreaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Area>> GetAllAsync()
    {
        return await _context.Areas.ToListAsync();
    }

    public async Task<Area?> GetByIdAsync(Guid id)
    {
        return await _context.Areas
            .FirstOrDefaultAsync(a => a.UUID == id);
    }

    public async Task<IEnumerable<Area>> GetByEventIdAsync(Guid eventId)
    {
        return await _context.Areas
            .Where(a => a.EventId == eventId)
            .ToListAsync();
    }

    public async Task<Area> CreateAsync(Area area)
    {
        if (area.UUID == Guid.Empty)
        {
            area.UUID = Guid.NewGuid();
        }

        _context.Areas.Add(area);
        await _context.SaveChangesAsync();

        return area;
    }

    public async Task<Area?> UpdateAsync(Guid id, Area area)
    {
        var existing = await _context.Areas.FindAsync(id);

        if (existing == null)
        {
            return null;
        }

        existing.Name = area.Name;
        existing.ColorHex = area.ColorHex;
        existing.GeoJson = area.GeoJson;
        existing.EventId = area.EventId;

        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var existing = await _context.Areas.FindAsync(id);

        if (existing == null)
        {
            return false;
        }

        _context.Areas.Remove(existing);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int> DeleteAllAsync()
    {
        var areas = await _context.Areas.ToListAsync();
        var count = areas.Count;
        _context.Areas.RemoveRange(areas);
        await _context.SaveChangesAsync();
        return count;
    }
}
