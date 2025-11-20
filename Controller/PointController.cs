using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PointController : ControllerBase
{
    private readonly IPointService _pointService;

    public PointController(IPointService pointService)
    {
        _pointService = pointService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Point>>> GetAll()
    {
        var points = await _pointService.GetAllAsync();
        return Ok(points);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Point>> GetById(Guid id)
    {
        var point = await _pointService.GetByIdAsync(id);
        if (point == null) return NotFound();
        return Ok(point);
    }

    [HttpPost]
    public async Task<ActionResult<Point>> Create(Point point)
    {
        try
        {
            var created = await _pointService.CreateAsync(point);
            return CreatedAtAction(nameof(GetById), new { id = created.UUID }, created);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Point>> Update(Guid id, Point point)
    {
        var updated = await _pointService.UpdateAsync(id, point);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var ok = await _pointService.DeleteAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}
