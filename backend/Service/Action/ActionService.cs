using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;

public class ActionService : IActionService
{
    private readonly AppDbContext _context;

    public ActionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Models.Action>> GetAllAsync()
    {
        return await _context.Actions
            .Include(a => a.SecurityZone)
            .OrderBy(a => a.Date)
            .ToListAsync();
    }

    public async Task<Models.Action?> GetByIdAsync(Guid id)
    {
        return await _context.Actions
            .Include(a => a.SecurityZone)
            .FirstOrDefaultAsync(a => a.UUID == id);
    }

    public async Task<IEnumerable<Models.Action>> GetByPlanningIdAsync(Guid planningId)
    {
        return await _context.Actions
            .Where(a => a.PlanningId == planningId)
            .Include(a => a.SecurityZone)
            .OrderBy(a => a.Date)
            .ToListAsync();
    }

    public async Task<IEnumerable<Models.Action>> GetBySecurityZoneIdAsync(Guid securityZoneId)
    {
        return await _context.Actions
            .Where(a => a.SecurityZoneId == securityZoneId)
            .Include(a => a.Planning)
            .OrderBy(a => a.Date)
            .ToListAsync();
    }

    public async Task<Models.Action> CreateAsync(Models.Action action)
    {
        if (action.UUID == Guid.Empty)
        {
            action.UUID = Guid.NewGuid();
        }

        _context.Actions.Add(action);
        await _context.SaveChangesAsync();

        return action;
    }

    public async Task<Models.Action?> UpdateAsync(Guid id, Models.Action action)
    {
        var existing = await _context.Actions.FindAsync(id);

        if (existing == null)
        {
            return null;
        }

        existing.PlanningId = action.PlanningId;
        existing.SecurityZoneId = action.SecurityZoneId;
        existing.Type = action.Type;
        existing.Date = action.Date;
        existing.Longitude = action.Longitude;
        existing.Latitude = action.Latitude;

        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var existing = await _context.Actions.FindAsync(id);

        if (existing == null)
        {
            return false;
        }

        _context.Actions.Remove(existing);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int> DeleteAllAsync()
    {
        var actions = await _context.Actions.ToListAsync();
        var count = actions.Count;
        _context.Actions.RemoveRange(actions);
        await _context.SaveChangesAsync();
        return count;
    }
}
