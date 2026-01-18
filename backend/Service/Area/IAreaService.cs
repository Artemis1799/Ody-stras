using t5_back.Models;

namespace t5_back.Services;

public interface IAreaService
{
    Task<IEnumerable<Area>> GetAllAsync();
    Task<Area?> GetByIdAsync(Guid id);
    Task<IEnumerable<Area>> GetByEventIdAsync(Guid eventId);
    Task<Area> CreateAsync(Area area);
    Task<Area?> UpdateAsync(Guid id, Area area);
    Task<bool> DeleteAsync(Guid id);
    Task<int> DeleteAllAsync();
}
