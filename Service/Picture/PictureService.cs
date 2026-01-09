using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;

public class PictureService : IPictureService
{
    private readonly AppDbContext _context;

    public PictureService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Picture>> GetAllAsync()
    {
        return await _context.Pictures.ToListAsync();
    }

    public async Task<Picture?> GetByIdAsync(Guid id)
    {
        return await _context.Pictures
            .FirstOrDefaultAsync(p => p.UUID == id);
    }

    public async Task<IEnumerable<Picture>> GetByPointIdAsync(Guid pointId)
    {
        return await _context.Pictures
            .Where(p => p.PointId == pointId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Picture>> GetBySecurityZoneIdAsync(Guid securityZoneId)
    {
        return await _context.Pictures
            .Where(p => p.SecurityZoneId == securityZoneId)
            .ToListAsync();
    }

    public async Task<Picture> CreateAsync(Picture picture)
    {
        if (picture.UUID == Guid.Empty)
        {
            picture.UUID = Guid.NewGuid();
        }

        _context.Pictures.Add(picture);
        await _context.SaveChangesAsync();

        return picture;
    }

    public async Task<Picture?> UpdateAsync(Guid id, Picture picture)
    {
        var existing = await _context.Pictures.FindAsync(id);

        if (existing == null)
        {
            return null;
        }

        existing.PictureData = picture.PictureData;

        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var existing = await _context.Pictures.FindAsync(id);

        if (existing == null)
        {
            return false;
        }

        _context.Pictures.Remove(existing);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int> DeleteAllAsync()
    {
        var pictures = await _context.Pictures.ToListAsync();
        var count = pictures.Count;
        _context.Pictures.RemoveRange(pictures);
        await _context.SaveChangesAsync();
        return count;
    }

    public async Task<int> TransferFromPointToSecurityZoneAsync(Guid pointId, Guid securityZoneId)
    {
        var pictures = await _context.Pictures
            .Where(p => p.PointId == pointId)
            .ToListAsync();

        foreach (var picture in pictures)
        {
            picture.SecurityZoneId = securityZoneId;
            // Garder aussi le PointId pour l'éventuel historique
        }

        await _context.SaveChangesAsync();
        return pictures.Count;
    }
}
