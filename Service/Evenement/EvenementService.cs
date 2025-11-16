using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Models;

namespace t5_back.Services;
public class EvenementService : IEvenementService
{
    private readonly AppDbContext _context;

    public EvenementService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Evenement>> GetAllAsync()
    {
        return await _context.Evenements
            .Include(e => e.Points)
            .ToListAsync();
    }

    public async Task<Evenement?> GetByIdAsync(Guid id)
    {
        return await _context.Evenements
            .Include(e => e.Points)
            .FirstOrDefaultAsync(e => e.UUID == id);
    }

    public async Task<Evenement> CreateAsync(Evenement evenement)
    {
        if (evenement.UUID == Guid.Empty)
        {
            evenement.UUID = Guid.NewGuid();
        }

        _context.Evenements.Add(evenement);
        await _context.SaveChangesAsync();

        return evenement;
    }

    public async Task<Evenement?> UpdateAsync(Guid id, Evenement evenement)
    {
        var existingEvenement = await _context.Evenements.FindAsync(id);
        
        if (existingEvenement == null)
        {
            return null;
        }

        existingEvenement.Nom = evenement.Nom;
        existingEvenement.Description = evenement.Description;
        existingEvenement.DateDebut = evenement.DateDebut;
        existingEvenement.Status = evenement.Status;
        existingEvenement.Responsable = evenement.Responsable;

        await _context.SaveChangesAsync();

        return existingEvenement;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var evenement = await _context.Evenements.FindAsync(id);
        
        if (evenement == null)
        {
            return false;
        }

        _context.Evenements.Remove(evenement);
        await _context.SaveChangesAsync();

        return true;
    }
}