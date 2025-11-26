using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;
public class EventTeamService : IEventTeamService
{
	private readonly AppDbContext _context;

	public EventTeamService(AppDbContext context)
	{
		_context = context;
	}

	public async Task<IEnumerable<EventTeam>> GetAllAsync()
	{
		return await _context.EventTeams
			.Include(eventTeam => eventTeam.Event)
			.Include(eventTeam => eventTeam.Team)
			.ToListAsync();
	}

	public async Task<EventTeam?> GetByIdAsync(Guid eventId, Guid teamId)
	{
		return await _context.EventTeams
			.Include(eventTeam => eventTeam.Event)
			.Include(eventTeam => eventTeam.Team)
			.FirstOrDefaultAsync(eventTeam => eventTeam.EventId == eventId && eventTeam.TeamId == teamId);
	}

	public async Task<EventTeam> CreateAsync(EventTeam eventTeam)
	{
		_context.EventTeams.Add(eventTeam);
		await _context.SaveChangesAsync();

		return eventTeam;
	}

	public async Task<EventTeam?> UpdateAsync(Guid eventId, Guid teamId, EventTeam eventTeam)
	{
		var existing = await _context.EventTeams
			.FirstOrDefaultAsync(et => et.EventId == eventId && et.TeamId == teamId);

		if (existing == null)
		{
			return null;
		}

		existing.EventId = eventTeam.EventId;
		existing.TeamId = eventTeam.TeamId;

		await _context.SaveChangesAsync();

		return existing;
	}

	public async Task<bool> DeleteAsync(Guid eventId, Guid teamId)
	{
		var existing = await _context.EventTeams
			.FirstOrDefaultAsync(et => et.EventId == eventId && et.TeamId == teamId);

		if (existing == null)
		{
			return false;
		}

		_context.EventTeams.Remove(existing);
		await _context.SaveChangesAsync();

		return true;
	}

	public async Task<int> DeleteAllAsync()
	{
		var eventTeams = await _context.EventTeams.ToListAsync();
		var count = eventTeams.Count;
		_context.EventTeams.RemoveRange(eventTeams);
		await _context.SaveChangesAsync();
		return count;
	}
}
