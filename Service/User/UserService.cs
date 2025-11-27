using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;
public class UserService : IUserService
{
	private readonly AppDbContext _context;
	private readonly IJwtService _jwtService;

	public UserService(AppDbContext context, IJwtService jwtService)
	{
		_context = context;
		_jwtService = jwtService;
	}

	public async Task<IEnumerable<User>> GetAllAsync()
	{
		return await _context.Users.ToListAsync();
	}

	public async Task<User?> GetByIdAsync(Guid id)
	{
		return await _context.Users.FirstOrDefaultAsync(u => u.UUID == id);
	}

	public async Task<User> CreateAsync(User user)
	{
		if (user.UUID == Guid.Empty)
		{
			user.UUID = Guid.NewGuid();
		}

		// Hasher le mot de passe si fourni
		if (!string.IsNullOrEmpty(user.Password))
		{
			user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
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
		
		// Si le mot de passe est fourni et non vide, on le hashe
		if (!string.IsNullOrEmpty(user.Password))
		{
			existing.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
		}
		else
		{
			// Si le mot de passe est null ou vide, on le met à null
			existing.Password = null;
		}

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

	public async Task<(bool Success, string Message, string? Token)> LoginAsync(string name, string? password)
	{
		var user = await _context.Users.FirstOrDefaultAsync(u => u.Name == name);

		if (user == null)
		{
			return (false, "User does not exist", null);
		}

		if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(user.Password))
		{
			return (false, "Empty password", null);
		}

		if (!BCrypt.Net.BCrypt.Verify(password, user.Password))
		{
			return (false, "Incorrect password", null);
		}

		// Générer le token JWT
		var token = _jwtService.GenerateToken(user.UUID, user.Name);

		return (true, "Login successful", token);
	}
}
