using t5_back.Models;

namespace t5_back.Services;

public interface IPlanningService
{
    Task<IEnumerable<Planning>> GetAllAsync();
    Task<Planning?> GetByIdAsync(Guid id);
    Task<Planning?> GetByTeamIdAsync(Guid teamId);
    Task<IEnumerable<Models.Action>> GetItineraryAsync(Guid planningId);
    Task<Planning> CreateAsync(Planning planning);
    Task<Planning?> UpdateAsync(Guid id, Planning planning);
    Task<bool> DeleteAsync(Guid id);
    Task<int> DeleteAllAsync();
}
