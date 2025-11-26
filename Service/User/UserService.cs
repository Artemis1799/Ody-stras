using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;
public class UserService : IUserService
{
	private readonly AppDbContext _context;

	public UserService(AppDbContext context)
	{
		_context = context;
	}

	public async Task<IEnumerable<User>> GetAllAsync()
	{
		return await _context.Users
			.Include(u => u.TeamUsers)
			.ToListAsync();
	}

	public async Task<User?> GetByIdAsync(Guid id)
	{
		return await _context.Users
			.Include(u => u.TeamUsers)
			.FirstOrDefaultAsync(u => u.UUID == id);
	}

	public async Task<User> CreateAsync(User user)
	{
		if (user.UUID == Guid.Empty)
		{
			user.UUID = Guid.NewGuid();
		}

		_context.Users.Add(user);
		await _context.SaveChangesAsync();

		return user;
	}

	public async Task<User?> UpdateAsync(Guid id, User user)
	{
		var existing = await _context.Users.FindAsync(id);

		if (existing == null)
		{
			return null;
		}

		existing.Name = user.Name;
		existing.Password = user.Password;

		await _context.SaveChangesAsync();

		return existing;
	}

	public async Task<bool> DeleteAsync(Guid id)
	{
		var existing = await _context.Users.FindAsync(id);

		if (existing == null)
		{
			return false;
		}

		_context.Users.Remove(existing);
		await _context.SaveChangesAsync();

		return true;
	}

	public async Task<int> DeleteAllAsync()
	{
		var users = await _context.Users.ToListAsync();
		var count = users.Count;
		_context.Users.RemoveRange(users);
		await _context.SaveChangesAsync();
		return count;
	}

	public async Task<(bool Success, string Message)> LoginAsync(string name, string? password)
	{
		var user = await _context.Users.FirstOrDefaultAsync(u => u.Name == name);

		if (user == null)
		{
			return (false, "User does not exist");
		}

		if (user.Password != password)
		{
			return (false, "Incorrect password");
		}

		return (true, "Login successful");
	}
}
