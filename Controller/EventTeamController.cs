using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventTeamController : ControllerBase
{
	private readonly IEventTeamService _eventTeamService;

	public EventTeamController(IEventTeamService eventTeamService)
	{
		_eventTeamService = eventTeamService;
	}

	[HttpGet]
	public async Task<ActionResult<IEnumerable<EventTeam>>> GetAll()
	{
		var eventTeams = await _eventTeamService.GetAllAsync();
		return Ok(eventTeams);
	}

	[HttpGet("{eventId}/{teamId}")]
	public async Task<ActionResult<EventTeam>> GetById(Guid eventId, Guid teamId)
	{
		var eventTeam = await _eventTeamService.GetByIdAsync(eventId, teamId);

		if (eventTeam == null)
			return NotFound();

		return Ok(eventTeam);
	}

	[HttpPost]
	public async Task<ActionResult<EventTeam>> Create(EventTeam eventTeam)
	{
		var created = await _eventTeamService.CreateAsync(eventTeam);
		return CreatedAtAction(nameof(GetById), new { eventId = created.EventId, teamId = created.TeamId }, created);
	}

	[HttpPut("{eventId}/{teamId}")]
	public async Task<ActionResult<EventTeam>> Update(Guid eventId, Guid teamId, EventTeam eventTeam)
	{
		var updated = await _eventTeamService.UpdateAsync(eventId, teamId, eventTeam);

		if (updated == null)
			return NotFound();

		return Ok(updated);
	}

	[HttpDelete("{eventId}/{teamId}")]
	public async Task<ActionResult> Delete(Guid eventId, Guid teamId)
	{
		var removed = await _eventTeamService.DeleteAsync(eventId, teamId);

		if (!removed)
			return NotFound();

		return NoContent();
	}

	[HttpDelete]
	public async Task<ActionResult<int>> DeleteAll()
	{
		var count = await _eventTeamService.DeleteAllAsync();
		return Ok(new { deletedCount = count });
	}
}
