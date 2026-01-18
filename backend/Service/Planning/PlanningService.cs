using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;

public class PlanningService : IPlanningService
{
    private readonly AppDbContext _context;

    public PlanningService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Planning>> GetAllAsync()
    {
        return await _context.Plannings
            .Include(p => p.Actions)
            .ToListAsync();
    }

    public async Task<Planning?> GetByIdAsync(Guid id)
    {
        return await _context.Plannings
            .Include(p => p.Actions)
            .FirstOrDefaultAsync(p => p.UUID == id);
    }

    public async Task<Planning?> GetByTeamIdAsync(Guid teamId)
    {
        return await _context.Plannings
            .Include(p => p.Actions)
            .FirstOrDefaultAsync(p => p.TeamId == teamId);
    }

    public async Task<IEnumerable<Models.Action>> GetItineraryAsync(Guid planningId)
    {
        return await _context.Actions
            .Where(a => a.PlanningId == planningId)
            .Include(a => a.SecurityZone)
                .ThenInclude(sz => sz!.Equipment)
            .OrderBy(a => a.Date)
            .ToListAsync();
    }

    public async Task<Planning> CreateAsync(Planning planning)
    {
        if (planning.UUID == Guid.Empty)
        {
            planning.UUID = Guid.NewGuid();
        }

        _context.Plannings.Add(planning);
        await _context.SaveChangesAsync();

        return planning;
    }

    public async Task<Planning?> UpdateAsync(Guid id, Planning planning)
    {
        var existing = await _context.Plannings.FindAsync(id);

        if (existing == null)
        {
            return null;
        }

        existing.TeamId = planning.TeamId;

        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var existing = await _context.Plannings.FindAsync(id);

        if (existing == null)
        {
            return false;
        }

        _context.Plannings.Remove(existing);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int> DeleteAllAsync()
    {
        var plannings = await _context.Plannings.ToListAsync();
        var count = plannings.Count;
        _context.Plannings.RemoveRange(plannings);
        await _context.SaveChangesAsync();
        return count;
    }
}
