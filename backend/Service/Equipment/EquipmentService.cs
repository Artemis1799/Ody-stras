using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;

public class EquipmentService : IEquipmentService
{
    private readonly AppDbContext _context;

    public EquipmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Equipment>> GetAllAsync()
    {
        return await _context.Equipments.ToListAsync();
    }

    public async Task<Equipment?> GetByIdAsync(Guid id)
    {
        return await _context.Equipments
            .FirstOrDefaultAsync(e => e.UUID == id);
    }

    public async Task<Equipment> CreateAsync(Equipment equipment)
    {
        if (equipment.UUID == Guid.Empty)
        {
            equipment.UUID = Guid.NewGuid();
        }

        _context.Equipments.Add(equipment);
        await _context.SaveChangesAsync();

        return equipment;
    }

    public async Task<Equipment?> UpdateAsync(Guid id, Equipment equipment)
    {
        var existing = await _context.Equipments.FindAsync(id);

        if (existing == null)
        {
            return null;
        }

        existing.Type = equipment.Type;
        existing.Length = equipment.Length;
        existing.Description = equipment.Description;
        existing.StorageType = equipment.StorageType;

        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var existing = await _context.Equipments.FindAsync(id);

        if (existing == null)
        {
            return false;
        }

        _context.Equipments.Remove(existing);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int> DeleteAllAsync()
    {
        var equipments = await _context.Equipments.ToListAsync();
        var count = equipments.Count;
        _context.Equipments.RemoveRange(equipments);
        await _context.SaveChangesAsync();
        return count;
    }
}

