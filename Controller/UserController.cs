using Microsoft.AspNetCore.Mvc;
using t5_back.Models;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
	private readonly IUserService _userService;

	public UserController(IUserService userService)
	{
		_userService = userService;
	}

	[HttpGet]
	public async Task<ActionResult<IEnumerable<User>>> GetAll()
	{
		var users = await _userService.GetAllAsync();
		return Ok(users);
	}

	[HttpGet("{id}")]
	public async Task<ActionResult<User>> GetById(Guid id)
	{
		var user = await _userService.GetByIdAsync(id);

		if (user == null)
			return NotFound();

		return Ok(user);
	}

	[HttpPost]
	public async Task<ActionResult<User>> Create(User user)
	{
		var created = await _userService.CreateAsync(user);
		return CreatedAtAction(nameof(GetById), new { id = created.UUID }, created);
	}

	[HttpPut("{id}")]
	public async Task<ActionResult<User>> Update(Guid id, User user)
	{
		var updated = await _userService.UpdateAsync(id, user);

		if (updated == null)
			return NotFound();

		return Ok(updated);
	}

	[HttpDelete("{id}")]
	public async Task<ActionResult> Delete(Guid id)
	{
		var removed = await _userService.DeleteAsync(id);

		if (!removed)
			return NotFound();

		return NoContent();
	}

	[HttpDelete]
	public async Task<ActionResult<int>> DeleteAll()
	{
		var count = await _userService.DeleteAllAsync();
		return Ok(new { deletedCount = count });
	}

	[HttpPost("login")]
	public async Task<ActionResult> Login([FromBody] LoginRequest request)
	{
		var (success, message, token) = await _userService.LoginAsync(request.Name, request.Password);

		if (!success)
		{
			return BadRequest(new { message });
		}

		// Créer un cookie HttpOnly avec le token
		var cookieOptions = new CookieOptions
		{
			HttpOnly = true,
			Secure = true, // HTTPS uniquement en production
			SameSite = SameSiteMode.None, // Nécessaire pour les requêtes cross-origin
			Expires = DateTimeOffset.UtcNow.AddHours(2)
		};

		Response.Cookies.Append("auth_token", token!, cookieOptions);

		return Ok(new { message });
	}

	[HttpPost("logout")]
	public ActionResult Logout()
	{
		Response.Cookies.Delete("auth_token");
		return Ok(new { message = "Logged out successfully" });
	}

	[HttpGet("verify")]
	public ActionResult VerifyAuth()
	{
		var token = Request.Cookies["auth_token"];
		
		if (string.IsNullOrEmpty(token))
		{
			return Unauthorized(new { authenticated = false });
		}
		
		return Ok(new { authenticated = true });
	}
}

public class LoginRequest
{
	public string Name { get; set; } = string.Empty;
	public string? Password { get; set; }
}
