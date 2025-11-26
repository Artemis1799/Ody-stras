using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;
public class PhotoService : IPhotoService
{
    private readonly AppDbContext _context;

    public PhotoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Photo>> GetAllAsync()
    {
        return await _context.Photos
            .Include(p => p.ImagePoints)
            .ToListAsync();
    }

    public async Task<Photo?> GetByIdAsync(Guid id)
    {
        return await _context.Photos
            .Include(p => p.ImagePoints)
            .FirstOrDefaultAsync(p => p.UUID == id);
    }

    public async Task<Photo> CreateAsync(Photo photo)
    {
        if (photo.UUID == Guid.Empty)
            photo.UUID = Guid.NewGuid();

        _context.Photos.Add(photo);
        await _context.SaveChangesAsync();

        return photo;
    }

    public async Task<Photo?> UpdateAsync(Guid id, Photo photo)
    {
        var existing = await _context.Photos.FindAsync(id);
        if (existing == null)
            return null;

        existing.Picture = photo.Picture;
        existing.PictureName = photo.PictureName;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var existing = await _context.Photos.FindAsync(id);
        if (existing == null)
            return false;

        _context.Photos.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> DeleteAllAsync()
    {
        var photos = await _context.Photos.ToListAsync();
        var count = photos.Count;
        _context.Photos.RemoveRange(photos);
        await _context.SaveChangesAsync();
        return count;
    }
}
