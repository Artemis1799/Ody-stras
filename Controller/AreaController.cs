using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AreaController : ControllerBase
{
    private readonly IAreaService _areaService;

    public AreaController(IAreaService areaService)
    {
        _areaService = areaService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Area>>> GetAll()
    {
        var areas = await _areaService.GetAllAsync();
        return Ok(areas);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Area>> GetById(Guid id)
    {
        var area = await _areaService.GetByIdAsync(id);

        if (area == null)
            return NotFound();

        return Ok(area);
    }

    [HttpGet("event/{eventId}")]
    public async Task<ActionResult<IEnumerable<Area>>> GetByEventId(Guid eventId)
    {
        var areas = await _areaService.GetByEventIdAsync(eventId);
        return Ok(areas);
    }

    [HttpPost]
    public async Task<ActionResult<Area>> Create(Area area)
    {
        var created = await _areaService.CreateAsync(area);
        return CreatedAtAction(nameof(GetById), new { id = created.UUID }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Area>> Update(Guid id, Area area)
    {
        var updated = await _areaService.UpdateAsync(id, area);

        if (updated == null)
            return NotFound();

        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var removed = await _areaService.DeleteAsync(id);

        if (!removed)
            return NotFound();

        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult<int>> DeleteAll()
    {
        var count = await _areaService.DeleteAllAsync();
        return Ok(new { deletedCount = count });
    }
}
