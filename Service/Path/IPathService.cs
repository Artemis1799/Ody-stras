using t5_back.Models;

namespace t5_back.Services;

public interface IPathService
{
    Task<IEnumerable<RoutePath>> GetAllAsync();
    Task<RoutePath?> GetByIdAsync(Guid id);
    Task<IEnumerable<RoutePath>> GetByEventIdAsync(Guid eventId);
    Task<RoutePath> CreateAsync(RoutePath path);
    Task<RoutePath?> UpdateAsync(Guid id, RoutePath path);
    Task<bool> DeleteAsync(Guid id);
    Task<int> DeleteAllAsync();
}
