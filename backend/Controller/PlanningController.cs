using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanningController : ControllerBase
{
    private readonly IPlanningService _planningService;

    public PlanningController(IPlanningService planningService)
    {
        _planningService = planningService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Planning>>> GetAll()
    {
        var plannings = await _planningService.GetAllAsync();
        return Ok(plannings);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Planning>> GetById(Guid id)
    {
        var planning = await _planningService.GetByIdAsync(id);

        if (planning == null)
            return NotFound();

        return Ok(planning);
    }

    [HttpGet("team/{teamId}")]
    public async Task<ActionResult<Planning>> GetByTeamId(Guid teamId)
    {
        var planning = await _planningService.GetByTeamIdAsync(teamId);

        if (planning == null)
            return NotFound();

        return Ok(planning);
    }

    [HttpGet("{id}/itinerary")]
    public async Task<ActionResult<IEnumerable<Models.Action>>> GetItinerary(Guid id)
    {
        var planning = await _planningService.GetByIdAsync(id);
        
        if (planning == null)
            return NotFound();

        var itinerary = await _planningService.GetItineraryAsync(id);
        return Ok(itinerary);
    }

    [HttpPost]
    public async Task<ActionResult<Planning>> Create(Planning planning)
    {
        var created = await _planningService.CreateAsync(planning);
        return CreatedAtAction(nameof(GetById), new { id = created.UUID }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Planning>> Update(Guid id, Planning planning)
    {
        var updated = await _planningService.UpdateAsync(id, planning);

        if (updated == null)
            return NotFound();

        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var removed = await _planningService.DeleteAsync(id);

        if (!removed)
            return NotFound();

        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult<int>> DeleteAll()
    {
        var count = await _planningService.DeleteAllAsync();
        return Ok(new { deletedCount = count });
    }
}
