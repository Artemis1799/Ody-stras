using t5_back.Models;

namespace t5_back.Services;

public interface ITeamEmployeeService
{
    Task<IEnumerable<TeamEmployee>> GetAllAsync();
    Task<IEnumerable<TeamEmployee>> GetByTeamIdAsync(Guid teamId);
    Task<IEnumerable<TeamEmployee>> GetByEmployeeIdAsync(Guid employeeId);
    Task<TeamEmployee?> GetByIdAsync(Guid teamId, Guid employeeId);
    Task<TeamEmployee> CreateAsync(TeamEmployee teamEmployee);
    Task<bool> DeleteAsync(Guid teamId, Guid employeeId);
    Task<int> DeleteAllAsync();
}
