using t5_back.Models;

namespace t5_back.Services;

public interface IPictureService
{
    Task<IEnumerable<Picture>> GetAllAsync();
    Task<Picture?> GetByIdAsync(Guid id);
    Task<IEnumerable<Picture>> GetByPointIdAsync(Guid pointId);
    Task<IEnumerable<Picture>> GetBySecurityZoneIdAsync(Guid securityZoneId);
    Task<Picture> CreateAsync(Picture picture);
    Task<Picture?> UpdateAsync(Guid id, Picture picture);
    Task<bool> DeleteAsync(Guid id);
    Task<int> DeleteAllAsync();
    Task<int> TransferFromPointToSecurityZoneAsync(Guid pointId, Guid securityZoneId);
}
