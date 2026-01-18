using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ActionController : ControllerBase
{
    private readonly IActionService _actionService;

    public ActionController(IActionService actionService)
    {
        _actionService = actionService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Models.Action>>> GetAll()
    {
        var actions = await _actionService.GetAllAsync();
        return Ok(actions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Models.Action>> GetById(Guid id)
    {
        var action = await _actionService.GetByIdAsync(id);

        if (action == null)
            return NotFound();

        return Ok(action);
    }

    [HttpGet("planning/{planningId}")]
    public async Task<ActionResult<IEnumerable<Models.Action>>> GetByPlanningId(Guid planningId)
    {
        var actions = await _actionService.GetByPlanningIdAsync(planningId);
        return Ok(actions);
    }

    [HttpGet("securityzone/{securityZoneId}")]
    public async Task<ActionResult<IEnumerable<Models.Action>>> GetBySecurityZoneId(Guid securityZoneId)
    {
        var actions = await _actionService.GetBySecurityZoneIdAsync(securityZoneId);
        return Ok(actions);
    }

    [HttpPost]
    public async Task<ActionResult<Models.Action>> Create(Models.Action action)
    {
        var created = await _actionService.CreateAsync(action);
        return CreatedAtAction(nameof(GetById), new { id = created.UUID }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Models.Action>> Update(Guid id, Models.Action action)
    {
        var updated = await _actionService.UpdateAsync(id, action);

        if (updated == null)
            return NotFound();

        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var removed = await _actionService.DeleteAsync(id);

        if (!removed)
            return NotFound();

        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult<int>> DeleteAll()
    {
        var count = await _actionService.DeleteAllAsync();
        return Ok(new { deletedCount = count });
    }
}
