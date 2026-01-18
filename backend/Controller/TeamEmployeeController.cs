using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamEmployeeController : ControllerBase
{
    private readonly ITeamEmployeeService _teamEmployeeService;

    public TeamEmployeeController(ITeamEmployeeService teamEmployeeService)
    {
        _teamEmployeeService = teamEmployeeService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TeamEmployee>>> GetAll()
    {
        var teamEmployees = await _teamEmployeeService.GetAllAsync();
        return Ok(teamEmployees);
    }

    [HttpGet("team/{teamId}")]
    public async Task<ActionResult<IEnumerable<TeamEmployee>>> GetByTeamId(Guid teamId)
    {
        var teamEmployees = await _teamEmployeeService.GetByTeamIdAsync(teamId);
        return Ok(teamEmployees);
    }

    [HttpGet("employee/{employeeId}")]
    public async Task<ActionResult<IEnumerable<TeamEmployee>>> GetByEmployeeId(Guid employeeId)
    {
        var teamEmployees = await _teamEmployeeService.GetByEmployeeIdAsync(employeeId);
        return Ok(teamEmployees);
    }

    [HttpGet("{teamId}/{employeeId}")]
    public async Task<ActionResult<TeamEmployee>> GetById(Guid teamId, Guid employeeId)
    {
        var teamEmployee = await _teamEmployeeService.GetByIdAsync(teamId, employeeId);

        if (teamEmployee == null)
            return NotFound();

        return Ok(teamEmployee);
    }

    [HttpPost]
    public async Task<ActionResult<TeamEmployee>> Create(TeamEmployee teamEmployee)
    {
        var created = await _teamEmployeeService.CreateAsync(teamEmployee);
        return CreatedAtAction(nameof(GetById), new { teamId = created.TeamId, employeeId = created.EmployeeId }, created);
    }

    [HttpDelete("{teamId}/{employeeId}")]
    public async Task<ActionResult> Delete(Guid teamId, Guid employeeId)
    {
        var removed = await _teamEmployeeService.DeleteAsync(teamId, employeeId);

        if (!removed)
            return NotFound();

        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult<int>> DeleteAll()
    {
        var count = await _teamEmployeeService.DeleteAllAsync();
        return Ok(new { deletedCount = count });
    }
}
