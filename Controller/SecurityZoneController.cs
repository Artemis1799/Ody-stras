using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SecurityZoneController : ControllerBase
{
    private readonly ISecurityZoneService _securityZoneService;

    public SecurityZoneController(ISecurityZoneService securityZoneService)
    {
        _securityZoneService = securityZoneService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SecurityZone>>> GetAll()
    {
        var securityZones = await _securityZoneService.GetAllAsync();
        return Ok(securityZones);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SecurityZone>> GetById(Guid id)
    {
        var securityZone = await _securityZoneService.GetByIdAsync(id);

        if (securityZone == null)
            return NotFound();

        return Ok(securityZone);
    }

    [HttpGet("event/{eventId}")]
    public async Task<ActionResult<IEnumerable<SecurityZone>>> GetByEventId(Guid eventId)
    {
        var securityZones = await _securityZoneService.GetByEventIdAsync(eventId);
        return Ok(securityZones);
    }

    [HttpPost]
    public async Task<ActionResult<SecurityZone>> Create(SecurityZone securityZone)
    {
        var created = await _securityZoneService.CreateAsync(securityZone);
        return CreatedAtAction(nameof(GetById), new { id = created.UUID }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SecurityZone>> Update(Guid id, SecurityZone securityZone)
    {
        var updated = await _securityZoneService.UpdateAsync(id, securityZone);

        if (updated == null)
            return NotFound();

        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var removed = await _securityZoneService.DeleteAsync(id);

        if (!removed)
            return NotFound();

        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult<int>> DeleteAll()
    {
        var count = await _securityZoneService.DeleteAllAsync();
        return Ok(new { deletedCount = count });
    }

    [HttpPut("{id}/assign-installation-team")]
    public async Task<ActionResult<SecurityZone>> AssignInstallationTeam(Guid id, [FromBody] AssignTeamRequest request)
    {
        var updated = await _securityZoneService.AssignInstallationTeamAsync(id, request.TeamId);

        if (updated == null)
            return NotFound();

        return Ok(updated);
    }

    [HttpPut("{id}/unassign-installation-team")]
    public async Task<ActionResult<SecurityZone>> UnassignInstallationTeam(Guid id)
    {
        var updated = await _securityZoneService.UnassignInstallationTeamAsync(id);

        if (updated == null)
            return NotFound();

        return Ok(updated);
    }

    [HttpPut("{id}/assign-removal-team")]
    public async Task<ActionResult<SecurityZone>> AssignRemovalTeam(Guid id, [FromBody] AssignTeamRequest request)
    {
        var updated = await _securityZoneService.AssignRemovalTeamAsync(id, request.TeamId);

        if (updated == null)
            return NotFound();

        return Ok(updated);
    }

    [HttpPut("{id}/unassign-removal-team")]
    public async Task<ActionResult<SecurityZone>> UnassignRemovalTeam(Guid id)
    {
        var updated = await _securityZoneService.UnassignRemovalTeamAsync(id);

        if (updated == null)
            return NotFound();

        return Ok(updated);
    }
}

public class AssignTeamRequest
{
    public Guid TeamId { get; set; }
}
