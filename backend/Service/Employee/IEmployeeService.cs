using t5_back.Models;

namespace t5_back.Services;

public interface IEmployeeService
{
    Task<IEnumerable<Employee>> GetAllAsync();
    Task<Employee?> GetByIdAsync(Guid id);
    Task<Employee> CreateAsync(Employee employee);
    Task<Employee?> UpdateAsync(Guid id, Employee employee);
    Task<bool> DeleteAsync(Guid id);
    Task<int> DeleteAllAsync();
}
