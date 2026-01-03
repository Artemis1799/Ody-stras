using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;

public class SecurityZoneService : ISecurityZoneService
{
    private readonly AppDbContext _context;

    public SecurityZoneService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SecurityZone>> GetAllAsync()
    {
        return await _context.SecurityZones
            .Include(sz => sz.Equipment)
            .ToListAsync();
    }

    public async Task<SecurityZone?> GetByIdAsync(Guid id)
    {
        return await _context.SecurityZones
            .Include(sz => sz.Equipment)
            .FirstOrDefaultAsync(sz => sz.UUID == id);
    }

    public async Task<IEnumerable<SecurityZone>> GetByEventIdAsync(Guid eventId)
    {
        return await _context.SecurityZones
            .Where(sz => sz.EventId == eventId)
            .Include(sz => sz.Equipment)
            .ToListAsync();
    }

    public async Task<SecurityZone> CreateAsync(SecurityZone securityZone)
    {
        if (securityZone.UUID == Guid.Empty)
        {
            securityZone.UUID = Guid.NewGuid();
        }

        _context.SecurityZones.Add(securityZone);
        await _context.SaveChangesAsync();

        // Recharger avec l'équipement inclus
        return await _context.SecurityZones
            .Include(sz => sz.Equipment)
            .FirstAsync(sz => sz.UUID == securityZone.UUID);
    }

    public async Task<SecurityZone?> UpdateAsync(Guid id, SecurityZone securityZone)
    {
        var existing = await _context.SecurityZones.FindAsync(id);

        if (existing == null)
        {
            return null;
        }

        existing.EquipmentId = securityZone.EquipmentId;
        existing.Quantity = securityZone.Quantity;
        existing.Comment = securityZone.Comment;
        existing.InstallationDate = securityZone.InstallationDate;
        existing.RemovalDate = securityZone.RemovalDate;
        existing.GeoJson = securityZone.GeoJson;
        existing.EventId = securityZone.EventId;

        await _context.SaveChangesAsync();

        // Recharger avec l'équipement inclus
        return await _context.SecurityZones
            .Include(sz => sz.Equipment)
            .FirstOrDefaultAsync(sz => sz.UUID == id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var existing = await _context.SecurityZones.FindAsync(id);

        if (existing == null)
        {
            return false;
        }

        _context.SecurityZones.Remove(existing);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int> DeleteAllAsync()
    {
        var securityZones = await _context.SecurityZones.ToListAsync();
        var count = securityZones.Count;
        _context.SecurityZones.RemoveRange(securityZones);
        await _context.SaveChangesAsync();
        return count;
    }
}
