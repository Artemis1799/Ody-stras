using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/geometries")]
public class GeometryController : ControllerBase
{
    private readonly IGeometryService _geometryService;

    public GeometryController(IGeometryService geometryService)
    {
        _geometryService = geometryService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Geometry>>> GetAll()
    {
        var geometries = await _geometryService.GetAllAsync();
        return Ok(geometries);
    }

    [HttpGet("{uuid}")]
    public async Task<ActionResult<Geometry>> GetById(Guid uuid)
    {
        var geometry = await _geometryService.GetByIdAsync(uuid);
        
        if (geometry == null)
        {
            return NotFound();
        }
        
        return Ok(geometry);
    }

    [HttpGet("event/{eventId}")]
    public async Task<ActionResult<IEnumerable<Geometry>>> GetByEventId(Guid eventId)
    {
        var geometries = await _geometryService.GetByEventIdAsync(eventId);
        return Ok(geometries);
    }

    [HttpPost]
    public async Task<ActionResult<Geometry>> Create(Geometry geometry)
    {
        try
        {
            var created = await _geometryService.CreateAsync(geometry);
            return CreatedAtAction(nameof(GetById), new { uuid = created.UUID }, created);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPut("{uuid}")]
    public async Task<ActionResult<Geometry>> Update(Guid uuid, Geometry geometry)
    {
        var updated = await _geometryService.UpdateAsync(uuid, geometry);
        
        if (updated == null)
        {
            return NotFound();
        }
        
        return Ok(updated);
    }

    [HttpDelete("{uuid}")]
    public async Task<ActionResult> Delete(Guid uuid)
    {
        var result = await _geometryService.DeleteAsync(uuid);
        
        if (!result)
        {
            return NotFound();
        }
        
        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult<int>> DeleteAll()
    {
        var count = await _geometryService.DeleteAllAsync();
        return Ok(new { deletedCount = count });
    }
}
