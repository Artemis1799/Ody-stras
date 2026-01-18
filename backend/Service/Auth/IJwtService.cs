namespace t5_back.Services;

public interface IJwtService
{
	string GenerateToken(Guid userId, string username);
}
