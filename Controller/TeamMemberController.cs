using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamMemberController : ControllerBase
{
	private readonly ITeamMemberService _teamMemberService;

	public TeamMemberController(ITeamMemberService teamMemberService)
	{
		_teamMemberService = teamMemberService;
	}

	[HttpGet]
	public async Task<ActionResult<IEnumerable<TeamMember>>> GetAll()
	{
		var teamMembers = await _teamMemberService.GetAllAsync();
		return Ok(teamMembers);
	}

	[HttpGet("{teamId}/{memberId}")]
	public async Task<ActionResult<TeamMember>> GetById(Guid teamId, Guid memberId)
	{
		var teamMember = await _teamMemberService.GetByIdAsync(teamId, memberId);

		if (teamMember == null)
			return NotFound();

		return Ok(teamMember);
	}

	[HttpPost]
	public async Task<ActionResult<TeamMember>> Create(TeamMember teamMember)
	{
		var created = await _teamMemberService.CreateAsync(teamMember);
		return CreatedAtAction(nameof(GetById), new { teamId = created.TeamId, memberId = created.MemberId }, created);
	}

	[HttpPut("{teamId}/{memberId}")]
	public async Task<ActionResult<TeamMember>> Update(Guid teamId, Guid memberId, TeamMember teamMember)
	{
		var updated = await _teamMemberService.UpdateAsync(teamId, memberId, teamMember);

		if (updated == null)
			return NotFound();

		return Ok(updated);
	}

	[HttpDelete("{teamId}/{memberId}")]
	public async Task<ActionResult> Delete(Guid teamId, Guid memberId)
	{
		var removed = await _teamMemberService.DeleteAsync(teamId, memberId);

		if (!removed)
			return NotFound();

		return NoContent();
	}

	[HttpDelete]
	public async Task<ActionResult<int>> DeleteAll()
	{
		var count = await _teamMemberService.DeleteAllAsync();
		return Ok(new { deletedCount = count });
	}
}
