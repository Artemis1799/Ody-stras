namespace t5_back.Services;
public interface IDatabaseService
{
    Task<Dictionary<string, int>> ResetDatabaseAsync();
    Task<string> SeedTestDataAsync();
}
