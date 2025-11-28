using t5_back.Models;

namespace t5_back.Services;
public interface IUserService
{
	Task<IEnumerable<User>> GetAllAsync();
	Task<User?> GetByIdAsync(Guid id);
	Task<User> CreateAsync(User user);
	Task<User?> UpdateAsync(Guid id, User user);
	Task<bool> DeleteAsync(Guid id);
	Task<int> DeleteAllAsync();
	Task<(bool Success, string Message, string? Token)> LoginAsync(string name, string? password);
}
