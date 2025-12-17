using t5_back.Models;

namespace t5_back.Services;

public interface IActionService
{
    Task<IEnumerable<Models.Action>> GetAllAsync();
    Task<Models.Action?> GetByIdAsync(Guid id);
    Task<IEnumerable<Models.Action>> GetByPlanningIdAsync(Guid planningId);
    Task<IEnumerable<Models.Action>> GetBySecurityZoneIdAsync(Guid securityZoneId);
    Task<Models.Action> CreateAsync(Models.Action action);
    Task<Models.Action?> UpdateAsync(Guid id, Models.Action action);
    Task<bool> DeleteAsync(Guid id);
    Task<int> DeleteAllAsync();
}
