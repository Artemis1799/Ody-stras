using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PathController : ControllerBase
{
    private readonly IPathService _pathService;

    public PathController(IPathService pathService)
    {
        _pathService = pathService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoutePath>>> GetAll()
    {
        var paths = await _pathService.GetAllAsync();
        return Ok(paths);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RoutePath>> GetById(Guid id)
    {
        var path = await _pathService.GetByIdAsync(id);

        if (path == null)
            return NotFound();

        return Ok(path);
    }

    [HttpGet("event/{eventId}")]
    public async Task<ActionResult<IEnumerable<RoutePath>>> GetByEventId(Guid eventId)
    {
        var paths = await _pathService.GetByEventIdAsync(eventId);
        return Ok(paths);
    }

    [HttpPost]
    public async Task<ActionResult<RoutePath>> Create(RoutePath path)
    {
        var created = await _pathService.CreateAsync(path);
        return CreatedAtAction(nameof(GetById), new { id = created.UUID }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RoutePath>> Update(Guid id, RoutePath path)
    {
        var updated = await _pathService.UpdateAsync(id, path);

        if (updated == null)
            return NotFound();

        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var removed = await _pathService.DeleteAsync(id);

        if (!removed)
            return NotFound();

        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult<int>> DeleteAll()
    {
        var count = await _pathService.DeleteAllAsync();
        return Ok(new { deletedCount = count });
    }
}
