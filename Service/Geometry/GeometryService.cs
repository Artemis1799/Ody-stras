using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;

public class GeometryService : IGeometryService
{
    private readonly AppDbContext _context;

    public GeometryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Geometry>> GetAllAsync()
    {
        return await _context.Geometries
            .Include(geometryItem => geometryItem.Event)
            .ToListAsync();
    }

    public async Task<Geometry?> GetByIdAsync(Guid uuid)
    {
        return await _context.Geometries
            .Include(geometryItem => geometryItem.Event)
            .FirstOrDefaultAsync(geometrieItem => geometrieItem.UUID == uuid);
    }

    public async Task<IEnumerable<Geometry>> GetByEventIdAsync(Guid eventId)
    {
        return await _context.Geometries
            .Where(geometryItem => geometryItem.EventId == eventId)
            .Include(geometryItem => geometryItem.Event)
            .ToListAsync();
    }

    public async Task<Geometry> CreateAsync(Geometry geometry)
    {
        if (geometry.UUID == Guid.Empty)
        {
            geometry.UUID = Guid.NewGuid();
        }

        geometry.Created = DateTime.UtcNow;
        geometry.Modified = DateTime.UtcNow;

        _context.Geometries.Add(geometry);
        await _context.SaveChangesAsync();

        return geometry;
    }

    public async Task<Geometry?> UpdateAsync(Guid uuid, Geometry geometry)
    {
        var existingGeometry = await _context.Geometries.FindAsync(uuid);
        
        if (existingGeometry == null)
        {
            return null;
        }

        existingGeometry.Type = geometry.Type;
        existingGeometry.GeoJsonString = geometry.GeoJsonString;
        existingGeometry.PropertiesString = geometry.PropertiesString;
        existingGeometry.Modified = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return existingGeometry;
    }

    public async Task<bool> DeleteAsync(Guid uuid)
    {
        var geometry = await _context.Geometries.FindAsync(uuid);
        
        if (geometry == null)
        {
            return false;
        }

        _context.Geometries.Remove(geometry);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int> DeleteAllAsync()
    {
        var geometries = await _context.Geometries.ToListAsync();
        var count = geometries.Count;
        _context.Geometries.RemoveRange(geometries);
        await _context.SaveChangesAsync();
        return count;
    }
}
