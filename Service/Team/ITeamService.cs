using t5_back.Models;

namespace t5_back.Services;
public interface ITeamService
{
	Task<IEnumerable<Team>> GetAllAsync();
	Task<Team?> GetByIdAsync(Guid id);
	Task<Team> CreateAsync(Team team);
	Task<Team?> UpdateAsync(Guid id, Team team);
	Task<bool> DeleteAsync(Guid id);
	Task<int> DeleteAllAsync();
}
