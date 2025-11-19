using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PhotoController : ControllerBase
{
    private readonly IPhotoService _photoService;

    public PhotoController(IPhotoService photoService)
    {
        _photoService = photoService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Photo>>> GetAll()
    {
        var photos = await _photoService.GetAllAsync();
        return Ok(photos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Photo>> GetById(Guid id)
    {
        var photo = await _photoService.GetByIdAsync(id);
        if (photo == null) return NotFound();
        return Ok(photo);
    }

    [HttpPost]
    public async Task<ActionResult<Photo>> Create(Photo photo)
    {
        var created = await _photoService.CreateAsync(photo);
        return CreatedAtAction(nameof(GetById), new { id = created.UUID }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Photo>> Update(Guid id, Photo photo)
    {
        var updated = await _photoService.UpdateAsync(id, photo);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var ok = await _photoService.DeleteAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}
