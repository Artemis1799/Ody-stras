using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;
public class MemberService : IMemberService
{
	private readonly AppDbContext _context;

	public MemberService(AppDbContext context)
	{
		_context = context;
	}

	public async Task<IEnumerable<Member>> GetAllAsync()
	{
		return await _context.Members
			.Include(member => member.TeamMembers!)
				.ThenInclude(teamMember => teamMember.Team)
			.ToListAsync();
	}

	public async Task<Member?> GetByIdAsync(Guid id)
	{
		return await _context.Members
			.Include(member => member.TeamMembers!)
				.ThenInclude(teamMember => teamMember.Team)
			.FirstOrDefaultAsync(member => member.UUID == id);
	}

	public async Task<Member> CreateAsync(Member member)
	{
		if (member.UUID == Guid.Empty)
		{
			member.UUID = Guid.NewGuid();
		}

		_context.Members.Add(member);
		await _context.SaveChangesAsync();

		return member;
	}

	public async Task<Member?> UpdateAsync(Guid id, Member member)
	{
		var existing = await _context.Members.FindAsync(id);

		if (existing == null)
		{
			return null;
		}

		existing.Name = member.Name;
		existing.FirstName = member.FirstName;

		await _context.SaveChangesAsync();

		return existing;
	}

	public async Task<bool> DeleteAsync(Guid id)
	{
		var existing = await _context.Members.FindAsync(id);

		if (existing == null)
		{
			return false;
		}

		_context.Members.Remove(existing);
		await _context.SaveChangesAsync();

		return true;
	}

	public async Task<int> DeleteAllAsync()
	{
		var members = await _context.Members.ToListAsync();
		var count = members.Count;
		_context.Members.RemoveRange(members);
		await _context.SaveChangesAsync();
		return count;
	}
}
