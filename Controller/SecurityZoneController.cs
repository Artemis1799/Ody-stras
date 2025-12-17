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
}
