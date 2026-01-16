using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamController : ControllerBase
{
    private readonly ITeamService _teamService;

    public TeamController(ITeamService teamService)
    {
        _teamService = teamService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Team>>> GetAll()
    {
        var teams = await _teamService.GetAllAsync();
        return Ok(teams);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Team>> GetById(Guid id)
    {
        var team = await _teamService.GetByIdAsync(id);

        if (team == null)
            return NotFound();

        return Ok(team);
    }

    [HttpGet("event/{eventId}")]
    public async Task<ActionResult<IEnumerable<Team>>> GetByEventId(Guid eventId)
    {
        var teams = await _teamService.GetByEventIdAsync(eventId);
        return Ok(teams);
    }

    [HttpPost]
    public async Task<ActionResult<Team>> Create(Team team)
    {
        var created = await _teamService.CreateAsync(team);
        return CreatedAtAction(nameof(GetById), new { id = created.UUID }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Team>> Update(Guid id, Team team)
    {
        var updated = await _teamService.UpdateAsync(id, team);

        if (updated == null)
            return NotFound();

        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var removed = await _teamService.DeleteAsync(id);

        if (!removed)
            return NotFound();

        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult<int>> DeleteAll()
    {
        var count = await _teamService.DeleteAllAsync();
        return Ok(new { deletedCount = count });
    }
}

