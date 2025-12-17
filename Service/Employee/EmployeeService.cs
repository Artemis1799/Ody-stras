using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;

public class EmployeeService : IEmployeeService
{
    private readonly AppDbContext _context;

    public EmployeeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Employee>> GetAllAsync()
    {
        return await _context.Employees.ToListAsync();
    }

    public async Task<Employee?> GetByIdAsync(Guid id)
    {
        return await _context.Employees
            .FirstOrDefaultAsync(e => e.UUID == id);
    }

    public async Task<Employee> CreateAsync(Employee employee)
    {
        if (employee.UUID == Guid.Empty)
        {
            employee.UUID = Guid.NewGuid();
        }

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        return employee;
    }

    public async Task<Employee?> UpdateAsync(Guid id, Employee employee)
    {
        var existing = await _context.Employees.FindAsync(id);

        if (existing == null)
        {
            return null;
        }

        existing.LastName = employee.LastName;
        existing.FirstName = employee.FirstName;
        existing.Email = employee.Email;
        existing.Phone = employee.Phone;

        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var existing = await _context.Employees.FindAsync(id);

        if (existing == null)
        {
            return false;
        }

        _context.Employees.Remove(existing);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int> DeleteAllAsync()
    {
        var employees = await _context.Employees.ToListAsync();
        var count = employees.Count;
        _context.Employees.RemoveRange(employees);
        await _context.SaveChangesAsync();
        return count;
    }
}
