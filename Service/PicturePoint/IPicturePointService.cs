using t5_back.Models;

namespace t5_back.Services;

public interface IPicturePointService
{
    Task<IEnumerable<PicturePoint>> GetAllAsync();
    Task<IEnumerable<PicturePoint>> GetByPointIdAsync(Guid pointId);
    Task<IEnumerable<PicturePoint>> GetByPictureIdAsync(Guid pictureId);
    Task<PicturePoint?> GetByIdAsync(Guid pictureId, Guid pointId);
    Task<PicturePoint> CreateAsync(PicturePoint picturePoint);
    Task<bool> DeleteAsync(Guid pictureId, Guid pointId);
    Task<int> DeleteAllAsync();
}
