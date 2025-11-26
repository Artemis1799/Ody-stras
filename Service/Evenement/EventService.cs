using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;
public class EventService : IEventService
{
    private readonly AppDbContext _context;

    public EventService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Event>> GetAllAsync()
    {
        return await _context.Events
            .Include(eventItem => eventItem.Points)
            .Include(eventItem => eventItem.EventTeams)
            .ToListAsync();
    }

    public async Task<Event?> GetByIdAsync(Guid id)
    {
        return await _context.Events
            .Include(eventItem => eventItem.Points)
            .Include(eventItem => eventItem.EventTeams)
            .FirstOrDefaultAsync(eventItem => eventItem.UUID == id);
    }

    public async Task<Event> CreateAsync(Event evenement)
    {
        if (evenement.UUID == Guid.Empty)
        {
            evenement.UUID = Guid.NewGuid();
        }

        var eventModel = evenement;

        _context.Events.Add(eventModel);
        await _context.SaveChangesAsync();

        return eventModel;
    }

    public async Task<Event?> UpdateAsync(Guid id, Event eventModel)
    {
        var existingEvent = await _context.Events.FindAsync(id);
        
        if (existingEvent == null)
        {
            return null;
        }

        existingEvent.Name = eventModel.Name;
        existingEvent.Description = eventModel.Description;
        existingEvent.StartDate = eventModel.StartDate;
        existingEvent.Status = eventModel.Status;

        await _context.SaveChangesAsync();

        return existingEvent;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var eventToDelete = await _context.Events.FindAsync(id);
        
        if (eventToDelete == null)
        {
            return false;
        }

        _context.Events.Remove(eventToDelete);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int> DeleteAllAsync()
    {
        var events = await _context.Events.ToListAsync();
        var count = events.Count;
        _context.Events.RemoveRange(events);
        await _context.SaveChangesAsync();
        return count;
    }
}