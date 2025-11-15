using t5_back.Models;

namespace t5_back.Services
{
    public interface IEvenementService
    {
        Task<IEnumerable<Evenement>> GetAllAsync();
        Task<Evenement?> GetByIdAsync(Guid id);
        Task<Evenement> CreateAsync(Evenement evenement);
        Task<Evenement?> UpdateAsync(Guid id, Evenement evenement);
        Task<bool> DeleteAsync(Guid id);
    }
}