using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PictureController : ControllerBase
{
    private readonly IPictureService _pictureService;

    public PictureController(IPictureService pictureService)
    {
        _pictureService = pictureService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Picture>>> GetAll()
    {
        var pictures = await _pictureService.GetAllAsync();
        return Ok(pictures);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Picture>> GetById(Guid id)
    {
        var picture = await _pictureService.GetByIdAsync(id);

        if (picture == null)
            return NotFound();

        return Ok(picture);
    }

    [HttpPost]
    public async Task<ActionResult<Picture>> Create(Picture picture)
    {
        var created = await _pictureService.CreateAsync(picture);
        return CreatedAtAction(nameof(GetById), new { id = created.UUID }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Picture>> Update(Guid id, Picture picture)
    {
        var updated = await _pictureService.UpdateAsync(id, picture);

        if (updated == null)
            return NotFound();

        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var removed = await _pictureService.DeleteAsync(id);

        if (!removed)
            return NotFound();

        return NoContent();
    }

    [HttpDelete]
    public async Task<ActionResult<int>> DeleteAll()
    {
        var count = await _pictureService.DeleteAllAsync();
        return Ok(new { deletedCount = count });
    }
}
