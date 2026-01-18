using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;

public class TeamEmployeeService : ITeamEmployeeService
{
    private readonly AppDbContext _context;

    public TeamEmployeeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TeamEmployee>> GetAllAsync()
    {
        return await _context.TeamEmployees
            .Include(te => te.Team)
            .Include(te => te.Employee)
            .ToListAsync();
    }

    public async Task<IEnumerable<TeamEmployee>> GetByTeamIdAsync(Guid teamId)
    {
        return await _context.TeamEmployees
            .Where(te => te.TeamId == teamId)
            .Include(te => te.Employee)
            .ToListAsync();
    }

    public async Task<IEnumerable<TeamEmployee>> GetByEmployeeIdAsync(Guid employeeId)
    {
        return await _context.TeamEmployees
            .Where(te => te.EmployeeId == employeeId)
            .Include(te => te.Team)
            .ToListAsync();
    }

    public async Task<TeamEmployee?> GetByIdAsync(Guid teamId, Guid employeeId)
    {
        return await _context.TeamEmployees
            .Include(te => te.Team)
            .Include(te => te.Employee)
            .FirstOrDefaultAsync(te => te.TeamId == teamId && te.EmployeeId == employeeId);
    }

    public async Task<TeamEmployee> CreateAsync(TeamEmployee teamEmployee)
    {
        _context.TeamEmployees.Add(teamEmployee);
        await _context.SaveChangesAsync();
        return teamEmployee;
    }

    public async Task<bool> DeleteAsync(Guid teamId, Guid employeeId)
    {
        var existing = await _context.TeamEmployees
            .FirstOrDefaultAsync(te => te.TeamId == teamId && te.EmployeeId == employeeId);

        if (existing == null)
        {
            return false;
        }

        _context.TeamEmployees.Remove(existing);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int> DeleteAllAsync()
    {
        var teamEmployees = await _context.TeamEmployees.ToListAsync();
        var count = teamEmployees.Count;
        _context.TeamEmployees.RemoveRange(teamEmployees);
        await _context.SaveChangesAsync();
        return count;
    }
}
