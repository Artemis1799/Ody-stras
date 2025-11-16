using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;


namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EvenementController : ControllerBase
{
    private readonly IEvenementService _evenementService;

    public EvenementController(IEvenementService evenementService)
    {
        _evenementService = evenementService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Evenement>>> GetAll()
    {
        var evenements = await _evenementService.GetAllAsync();
        return Ok(evenements);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Evenement>> GetById(Guid id)
    {
        var evenement = await _evenementService.GetByIdAsync(id);
        
        if (evenement == null)
        {
            return NotFound();
        }
        
        return Ok(evenement);
    }

    [HttpPost]
    public async Task<ActionResult<Evenement>> Create(Evenement evenement)
    {
        var createdEvenement = await _evenementService.CreateAsync(evenement);
        return CreatedAtAction(nameof(GetById), new { id = createdEvenement.UUID }, createdEvenement);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Evenement>> Update(Guid id, Evenement evenement)
    {
        var updatedEvenement = await _evenementService.UpdateAsync(id, evenement);
        
        if (updatedEvenement == null)
        {
            return NotFound();
        }
        
        return Ok(updatedEvenement);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var result = await _evenementService.DeleteAsync(id);
        
        if (!result)
        {
            return NotFound();
        }
        
        return NoContent();
    }
}