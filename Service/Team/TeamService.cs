using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;
public class TeamService : ITeamService
{
	private readonly AppDbContext _context;

	public TeamService(AppDbContext context)
	{
		_context = context;
	}

	public async Task<IEnumerable<Team>> GetAllAsync()
	{
		return await _context.Teams
			.Include(team => team.TeamMembers)
			.Include(team => team.EventTeams)
			.ToListAsync();
	}

	public async Task<Team?> GetByIdAsync(Guid id)
	{
		return await _context.Teams
			.Include(team => team.TeamMembers)
			.Include(team => team.EventTeams)
			.FirstOrDefaultAsync(team => team.UUID == id);
	}

	public async Task<Team> CreateAsync(Team team)
	{
		if (team.UUID == Guid.Empty)
		{
			team.UUID = Guid.NewGuid();
		}

		_context.Teams.Add(team);
		await _context.SaveChangesAsync();

		return team;
	}

	public async Task<Team?> UpdateAsync(Guid id, Team team)
	{
		var existing = await _context.Teams.FindAsync(id);

		if (existing == null)
		{
			return null;
		}

		existing.TeamName = team.TeamName;

		await _context.SaveChangesAsync();

		return existing;
	}

	public async Task<bool> DeleteAsync(Guid id)
	{
		var existing = await _context.Teams.FindAsync(id);

		if (existing == null)
		{
			return false;
		}

		_context.Teams.Remove(existing);
		await _context.SaveChangesAsync();

		return true;
	}

	public async Task<int> DeleteAllAsync()
	{
		var teams = await _context.Teams.ToListAsync();
		var count = teams.Count;
		_context.Teams.RemoveRange(teams);
		await _context.SaveChangesAsync();
		return count;
	}
}
