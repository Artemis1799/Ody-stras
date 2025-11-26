using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EquipmentController : ControllerBase
{
	private readonly IEquipmentService _equipmentService;

	public EquipmentController(IEquipmentService equipmentService)
	{
		_equipmentService = equipmentService;
	}

	[HttpGet]
	public async Task<ActionResult<IEnumerable<Equipment>>> GetAll()
	{
		var equipments = await _equipmentService.GetAllAsync();
		return Ok(equipments);
	}

	[HttpGet("{id}")]
	public async Task<ActionResult<Equipment>> GetById(Guid id)
	{
		var equipment = await _equipmentService.GetByIdAsync(id);

		if (equipment == null)
			return NotFound();

		return Ok(equipment);
	}

	[HttpPost]
	public async Task<ActionResult<Equipment>> Create(Equipment equipment)
	{
		var created = await _equipmentService.CreateAsync(equipment);
		return CreatedAtAction(nameof(GetById), new { id = created.UUID }, created);
	}

	[HttpPut("{id}")]
	public async Task<ActionResult<Equipment>> Update(Guid id, Equipment equipment)
	{
		var updated = await _equipmentService.UpdateAsync(id, equipment);

		if (updated == null)
			return NotFound();

		return Ok(updated);
	}

	[HttpDelete("{id}")]
	public async Task<ActionResult> Delete(Guid id)
	{
		var removed = await _equipmentService.DeleteAsync(id);

		if (!removed)
			return NotFound();

		return NoContent();
	}

	[HttpDelete]
	public async Task<ActionResult<int>> DeleteAll()
	{
		var count = await _equipmentService.DeleteAllAsync();
		return Ok(new { deletedCount = count });
	}
}
