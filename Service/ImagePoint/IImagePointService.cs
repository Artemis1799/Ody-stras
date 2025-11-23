using t5_back.Models;

namespace t5_back.Services;
public interface IImagePointService
{
    Task<IEnumerable<ImagePoint>> GetAllAsync();
    Task<ImagePoint?> GetByIdsAsync(Guid imageId, Guid pointId);
    Task<IEnumerable<ImagePoint>> GetByPointIdAsync(Guid pointId);
    Task<ImagePoint> CreateAsync(ImagePoint imagePoint);
    Task<ImagePoint?> UpdateAsync(Guid imageId, Guid pointId, ImagePoint imagePoint);
    Task<bool> DeleteAsync(Guid imageId, Guid pointId);
    Task<int> DeleteAllAsync();
}
