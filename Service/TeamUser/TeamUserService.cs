using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;
public class TeamUserService : ITeamUserService
{
	private readonly AppDbContext _context;

	public TeamUserService(AppDbContext context)
	{
		_context = context;
	}

	public async Task<IEnumerable<TeamUser>> GetAllAsync()
	{
		return await _context.TeamUsers
			.Include(eu => eu.Team)
			.Include(eu => eu.User)
			.Include(eu => eu.Member)
			.ToListAsync();
	}

	public async Task<TeamUser?> GetByIdAsync(Guid teamId, Guid userId, Guid memberId)
	{
		return await _context.TeamUsers
			.Include(eu => eu.Team)
			.Include(eu => eu.User)
			.Include(eu => eu.Member)
			.FirstOrDefaultAsync(eu => eu.TeamId == teamId && eu.UserId == userId && eu.MemberId == memberId);
	}

	public async Task<TeamUser> CreateAsync(TeamUser teamUser)
	{
		_context.TeamUsers.Add(teamUser);
		await _context.SaveChangesAsync();

		return teamUser;
	}

	public async Task<TeamUser?> UpdateAsync(Guid teamId, Guid userId, Guid memberId, TeamUser teamUser)
	{
		var existing = await _context.TeamUsers
			.FirstOrDefaultAsync(eu => eu.TeamId == teamId && eu.UserId == userId && eu.MemberId == memberId);

		if (existing == null)
		{
			return null;
		}

		existing.TeamId = teamUser.TeamId;
		existing.UserId = teamUser.UserId;
		existing.MemberId = teamUser.MemberId;

		await _context.SaveChangesAsync();

		return existing;
	}

	public async Task<bool> DeleteAsync(Guid teamId, Guid userId, Guid memberId)
	{
		var existing = await _context.TeamUsers
			.FirstOrDefaultAsync(eu => eu.TeamId == teamId && eu.UserId == userId && eu.MemberId == memberId);

		if (existing == null)
		{
			return false;
		}

		_context.TeamUsers.Remove(existing);
		await _context.SaveChangesAsync();

		return true;
	}

	public async Task<int> DeleteAllAsync()
	{
		var teamUsers = await _context.TeamUsers.ToListAsync();
		var count = teamUsers.Count;
		_context.TeamUsers.RemoveRange(teamUsers);
		await _context.SaveChangesAsync();
		return count;
	}
}
