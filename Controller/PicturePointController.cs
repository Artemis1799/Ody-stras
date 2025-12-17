using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PicturePointController : ControllerBase
{
    private readonly IPicturePointService _picturePointService;

    public PicturePointController(IPicturePointService picturePointService)
    {
        _picturePointService = picturePointService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PicturePoint>>> GetAll()
    {
        var picturePoints = await _picturePointService.GetAllAsync();
        return Ok(picturePoints);
    }

    [HttpGet("point/{pointId}")]
    public async Task<ActionResult<IEnumerable<PicturePoint>>> GetByPointId(Guid pointId)
    {
        var picturePoints = await _picturePointService.GetByPointIdAsync(pointId);
        return Ok(picturePoints);
    }

    [HttpGet("picture/{pictureId}")]
    public async Task<ActionResult<IEnumerable<PicturePoint>>> GetByPictureId(Guid pictureId)
    {
        var picturePoints = await _picturePointService.GetByPictureIdAsync(pictureId);
        return Ok(picturePoints);
    }

    [HttpGet("{pictureId}/{pointId}")]
    public async Task<ActionResult<PicturePoint>> GetById(Guid pictureId, Guid pointId)
    {
        var picturePoint = await _picturePointService.GetByIdAsync(pictureId, pointId);

        if (picturePoint == null)
            return NotFound();

        return Ok(picturePoint);
    }

    [HttpPost]
    public async Task<ActionResult<PicturePoint>> Create(PicturePoint picturePoint)
    {
        var created = await _picturePointService.CreateAsync(picturePoint);
        return CreatedAtAction(nameof(GetById), new { pictureId = created.PictureId, pointId = created.PointId }, created);
    }

    [HttpDelete("{pictureId}/{pointId}")]
    public async Task<ActionResult> Delete(Guid pictureId, Guid pointId)
    {
        var removed = await _picturePointService.DeleteAsync(pictureId, pointId);

        if (!removed)
            return NotFound();

        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult<int>> DeleteAll()
    {
        var count = await _picturePointService.DeleteAllAsync();
        return Ok(new { deletedCount = count });
    }
}
