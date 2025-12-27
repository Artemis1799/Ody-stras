using t5_back.Models;

namespace t5_back.Services;

public interface IPictureService
{
    Task<IEnumerable<Picture>> GetAllAsync();
    Task<Picture?> GetByIdAsync(Guid id);
    Task<Picture> CreateAsync(Picture picture);
    Task<Picture?> UpdateAsync(Guid id, Picture picture);
    Task<bool> DeleteAsync(Guid id);
    Task<int> DeleteAllAsync();
}
