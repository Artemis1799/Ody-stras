using t5_back.Models;

namespace t5_back.Services;
public interface IPhotoService
{
    Task<IEnumerable<Photo>> GetAllAsync();
    Task<Photo?> GetByIdAsync(Guid id);
    Task<Photo> CreateAsync(Photo photo);
    Task<Photo?> UpdateAsync(Guid id, Photo photo);
    Task<bool> DeleteAsync(Guid id);
}
