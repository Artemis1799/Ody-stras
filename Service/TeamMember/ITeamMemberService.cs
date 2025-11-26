using t5_back.Models;

namespace t5_back.Services;
public interface ITeamMemberService
{
	Task<IEnumerable<TeamMember>> GetAllAsync();
	Task<TeamMember?> GetByIdAsync(Guid teamId, Guid memberId);
	Task<TeamMember> CreateAsync(TeamMember teamMember);
	Task<TeamMember?> UpdateAsync(Guid teamId, Guid memberId, TeamMember teamMember);
	Task<bool> DeleteAsync(Guid teamId, Guid memberId);
	Task<int> DeleteAllAsync();
}
