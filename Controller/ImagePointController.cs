using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImagePointController : ControllerBase
{
    private readonly IImagePointService _imagePointService;

    public ImagePointController(IImagePointService imagePointService)
    {
        _imagePointService = imagePointService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ImagePoint>>> GetAll([FromQuery] Guid? pointId)
    {
        if (pointId.HasValue)
        {
            var list = await _imagePointService.GetByPointIdAsync(pointId.Value);
            return Ok(list);
        }
        var allList = await _imagePointService.GetAllAsync();
        return Ok(allList);
    }

    [HttpGet("{imageId}/{pointId}")]
    public async Task<ActionResult<ImagePoint>> GetByIds(Guid imageId, Guid pointId)
    {
        var ip = await _imagePointService.GetByIdsAsync(imageId, pointId);
        if (ip == null) return NotFound();
        return Ok(ip);
    }

    [HttpPost]
    public async Task<ActionResult<ImagePoint>> Create(ImagePoint imagePoint)
    {
        var created = await _imagePointService.CreateAsync(imagePoint);
        return CreatedAtAction(nameof(GetByIds), new { imageId = created.ImageId, pointId = created.PointId }, created);
    }

    [HttpPut("{imageId}/{pointId}")]
    public async Task<ActionResult<ImagePoint>> Update(Guid imageId, Guid pointId, ImagePoint imagePoint)
    {
        var updated = await _imagePointService.UpdateAsync(imageId, pointId, imagePoint);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{imageId}/{pointId}")]
    public async Task<ActionResult> Delete(Guid imageId, Guid pointId)
    {
        var ok = await _imagePointService.DeleteAsync(imageId, pointId);
        if (!ok) return NotFound();
        return NoContent();
    }
}
