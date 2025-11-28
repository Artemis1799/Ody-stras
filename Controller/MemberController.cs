using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MemberController : ControllerBase
{
	private readonly IMemberService _memberService;

	public MemberController(IMemberService memberService)
	{
		_memberService = memberService;
	}

	[HttpGet]
	public async Task<ActionResult<IEnumerable<Member>>> GetAll()
	{
		var members = await _memberService.GetAllAsync();
		return Ok(members);
	}

	[HttpGet("{id}")]
	public async Task<ActionResult<Member>> GetById(Guid id)
	{
		var member = await _memberService.GetByIdAsync(id);

		if (member == null)
			return NotFound();

		return Ok(member);
	}

	[HttpPost]
	public async Task<ActionResult<Member>> Create(Member member)
	{
		var created = await _memberService.CreateAsync(member);
		return CreatedAtAction(nameof(GetById), new { id = created.UUID }, created);
	}

	[HttpPut("{id}")]
	public async Task<ActionResult<Member>> Update(Guid id, Member member)
	{
		var updated = await _memberService.UpdateAsync(id, member);

		if (updated == null)
			return NotFound();

		return Ok(updated);
	}

	[HttpDelete("{id}")]
	public async Task<ActionResult> Delete(Guid id)
	{
		var removed = await _memberService.DeleteAsync(id);

		if (!removed)
			return NotFound();

		return NoContent();
	}

	[HttpDelete]
	public async Task<ActionResult<int>> DeleteAll()
	{
		var count = await _memberService.DeleteAllAsync();
		return Ok(new { deletedCount = count });
	}
}
