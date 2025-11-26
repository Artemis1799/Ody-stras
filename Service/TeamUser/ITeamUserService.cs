using t5_back.Models;

namespace t5_back.Services;
public interface ITeamUserService
{
	Task<IEnumerable<TeamUser>> GetAllAsync();
	Task<TeamUser?> GetByIdAsync(Guid teamId, Guid userId, Guid memberId);
	Task<TeamUser> CreateAsync(TeamUser teamUser);
	Task<TeamUser?> UpdateAsync(Guid teamId, Guid userId, Guid memberId, TeamUser teamUser);
	Task<bool> DeleteAsync(Guid teamId, Guid userId, Guid memberId);
	Task<int> DeleteAllAsync();
}
