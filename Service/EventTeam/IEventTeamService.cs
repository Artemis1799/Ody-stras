using t5_back.Models;

namespace t5_back.Services;
public interface IEventTeamService
{
	Task<IEnumerable<EventTeam>> GetAllAsync();
	Task<EventTeam?> GetByIdAsync(Guid eventId, Guid teamId);
	Task<EventTeam> CreateAsync(EventTeam eventTeam);
	Task<EventTeam?> UpdateAsync(Guid eventId, Guid teamId, EventTeam eventTeam);
	Task<bool> DeleteAsync(Guid eventId, Guid teamId);
	Task<int> DeleteAllAsync();
}
