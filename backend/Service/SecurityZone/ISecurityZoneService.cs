using t5_back.Models;

namespace t5_back.Services;

public interface ISecurityZoneService
{
    Task<IEnumerable<SecurityZone>> GetAllAsync();
    Task<SecurityZone?> GetByIdAsync(Guid id);
    Task<IEnumerable<SecurityZone>> GetByEventIdAsync(Guid eventId);
    Task<SecurityZone> CreateAsync(SecurityZone securityZone);
    Task<SecurityZone?> UpdateAsync(Guid id, SecurityZone securityZone);
    Task<bool> DeleteAsync(Guid id);
    Task<int> DeleteAllAsync();
    Task<SecurityZone?> AssignInstallationTeamAsync(Guid id, Guid teamId);
    Task<SecurityZone?> UnassignInstallationTeamAsync(Guid id);
    Task<SecurityZone?> AssignRemovalTeamAsync(Guid id, Guid teamId);
    Task<SecurityZone?> UnassignRemovalTeamAsync(Guid id);
}
