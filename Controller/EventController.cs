using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;


namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventController : ControllerBase
{
    private readonly IEventService _eventService;

    public EventController(IEventService eventService)
    {
        _eventService = eventService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Event>>> GetAll()
    {
        var events = await _eventService.GetAllAsync();
        return Ok(events);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Event>> GetById(Guid id)
    {
        var eventModel = await _eventService.GetByIdAsync(id);

        if (eventModel == null)
        {
            return NotFound();
        }

        return Ok(eventModel);
    }

    [HttpPost]
    public async Task<ActionResult<Event>> Create(Event eventModel)
    {
        var createdEvent = await _eventService.CreateAsync(eventModel);
        return CreatedAtAction(nameof(GetById), new { id = createdEvent.UUID }, createdEvent);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Event>> Update(Guid id, Event eventModel)
    {
        var updatedEvent = await _eventService.UpdateAsync(id, eventModel);
        
        if (updatedEvent == null)
        {
            return NotFound();
        }
        
        return Ok(updatedEvent);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var result = await _eventService.DeleteAsync(id);
        
        if (!result)
        {
            return NotFound();
        }
        
        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult<int>> DeleteAll()
    {
        var count = await _eventService.DeleteAllAsync();
        return Ok(new { deletedCount = count });
    }
}