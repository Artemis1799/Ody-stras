using t5_back.Models;

namespace t5_back.Services;
public interface IEquipmentService
{
	Task<IEnumerable<Equipment>> GetAllAsync();
	Task<Equipment?> GetByIdAsync(Guid id);
	Task<Equipment> CreateAsync(Equipment equipment);
	Task<Equipment?> UpdateAsync(Guid id, Equipment equipment);
	Task<bool> DeleteAsync(Guid id);
}

