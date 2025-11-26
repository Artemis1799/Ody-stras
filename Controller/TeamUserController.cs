using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamUserController : ControllerBase
{
	private readonly ITeamUserService _teamUserService;

	public TeamUserController(ITeamUserService teamUserService)
	{
		_teamUserService = teamUserService;
	}

	[HttpGet]
	public async Task<ActionResult<IEnumerable<TeamUser>>> GetAll()
	{
		var teamUsers = await _teamUserService.GetAllAsync();
		return Ok(teamUsers);
	}

	[HttpGet("{teamId}/{userId}/{memberId}")]
	public async Task<ActionResult<TeamUser>> GetById(Guid teamId, Guid userId, Guid memberId)
	{
		var teamUser = await _teamUserService.GetByIdAsync(teamId, userId, memberId);

		if (teamUser == null)
			return NotFound();

		return Ok(teamUser);
	}

	[HttpPost]
	public async Task<ActionResult<TeamUser>> Create(TeamUser teamUser)
	{
		var created = await _teamUserService.CreateAsync(teamUser);
		return CreatedAtAction(nameof(GetById), new { teamId = created.TeamId, userId = created.UserId, memberId = created.MemberId }, created);
	}

	[HttpPut("{teamId}/{userId}/{memberId}")]
	public async Task<ActionResult<TeamUser>> Update(Guid teamId, Guid userId, Guid memberId, TeamUser teamUser)
	{
		var updated = await _teamUserService.UpdateAsync(teamId, userId, memberId, teamUser);

		if (updated == null)
			return NotFound();

		return Ok(updated);
	}

	[HttpDelete("{teamId}/{userId}/{memberId}")]
	public async Task<ActionResult> Delete(Guid teamId, Guid userId, Guid memberId)
	{
		var removed = await _teamUserService.DeleteAsync(teamId, userId, memberId);

		if (!removed)
			return NotFound();

		return NoContent();
	}

	[HttpDelete]
	public async Task<ActionResult<int>> DeleteAll()
	{
		var count = await _teamUserService.DeleteAllAsync();
		return Ok(new { deletedCount = count });
	}
}
