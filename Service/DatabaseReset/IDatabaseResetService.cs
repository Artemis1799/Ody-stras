namespace t5_back.Services;
public interface IDatabaseResetService
{
    Task<Dictionary<string, int>> ResetDatabaseAsync();
}
