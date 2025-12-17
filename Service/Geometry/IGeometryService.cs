using t5_back.Models;

namespace t5_back.Services;

public interface IGeometryService
{
    Task<IEnumerable<Geometry>> GetAllAsync();
    Task<Geometry?> GetByIdAsync(Guid uuid);
    Task<IEnumerable<Geometry>> GetByEventIdAsync(Guid eventId);
    Task<Geometry> CreateAsync(Geometry geometry);
    Task<Geometry?> UpdateAsync(Guid uuid, Geometry geometry);
    Task<bool> DeleteAsync(Guid uuid);
    Task<int> DeleteAllAsync();
}
