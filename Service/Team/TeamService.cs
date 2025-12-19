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
            .Include(t => t.TeamEmployees)
            .ToListAsync();
    }

    public async Task<Team?> GetByIdAsync(Guid id)
    {
        return await _context.Teams
            .Include(t => t.TeamEmployees)
            .FirstOrDefaultAsync(t => t.UUID == id);
    }

    public async Task<IEnumerable<Team>> GetByEventIdAsync(Guid eventId)
    {
        return await _context.Teams
            .Where(t => t.EventId == eventId)
            .Include(t => t.TeamEmployees)
            .ToListAsync();
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
        existing.EventId = team.EventId;

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

