using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;
public class TeamMemberService : ITeamMemberService
{
	private readonly AppDbContext _context;

	public TeamMemberService(AppDbContext context)
	{
		_context = context;
	}

	public async Task<IEnumerable<TeamMember>> GetAllAsync()
	{
		return await _context.TeamMembers
			.Include(teamMember => teamMember.Team)
			.Include(teamMember => teamMember.Member)
			.ToListAsync();
	}

	public async Task<TeamMember?> GetByIdAsync(Guid teamId, Guid memberId)
	{
		return await _context.TeamMembers
			.Include(teamMember => teamMember.Team)
			.Include(teamMember => teamMember.Member)
			.FirstOrDefaultAsync(teamMember => teamMember.TeamId == teamId && teamMember.MemberId == memberId);
	}

	public async Task<TeamMember> CreateAsync(TeamMember teamMember)
	{
		_context.TeamMembers.Add(teamMember);
		await _context.SaveChangesAsync();

		return teamMember;
	}

	public async Task<TeamMember?> UpdateAsync(Guid teamId, Guid memberId, TeamMember teamMember)
	{
		var existing = await _context.TeamMembers
			.FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.MemberId == memberId);

		if (existing == null)
		{
			return null;
		}

		existing.TeamId = teamMember.TeamId;
		existing.MemberId = teamMember.MemberId;

		await _context.SaveChangesAsync();

		return existing;
	}

	public async Task<bool> DeleteAsync(Guid teamId, Guid memberId)
	{
		var existing = await _context.TeamMembers
			.FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.MemberId == memberId);

		if (existing == null)
		{
			return false;
		}

		_context.TeamMembers.Remove(existing);
		await _context.SaveChangesAsync();

		return true;
	}

	public async Task<int> DeleteAllAsync()
	{
		var teamMembers = await _context.TeamMembers.ToListAsync();
		var count = teamMembers.Count;
		_context.TeamMembers.RemoveRange(teamMembers);
		await _context.SaveChangesAsync();
		return count;
	}
}
