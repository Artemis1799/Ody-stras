using t5_back.Models;

namespace t5_back.Services;
public interface IEventService
{
    Task<IEnumerable<Event>> GetAllAsync();
    Task<Event?> GetByIdAsync(Guid id);
    Task<Event> CreateAsync(Event eventModel);
    Task<Event?> UpdateAsync(Guid id, Event eventModel);
    Task<bool> DeleteAsync(Guid id);
}