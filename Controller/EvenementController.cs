using Microsoft.AspNetCore.Mvc;
using t5_back.Data;
using t5_back.Models;
using Microsoft.EntityFrameworkCore;

namespace t5_back.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EvenementController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EvenementController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Evenement>>> GetAll()
        {
            return await _context.Evenements.ToListAsync();
        }

		[HttpGet("{id}")]
        public async Task<ActionResult<Evenement>> GetById(Guid id)
        {
            var evenement = await _context.Evenements.FindAsync(id);
            
            if (evenement == null)
            {
                return NotFound();
            }
            
            return evenement;
        }

		[HttpPost]
        public async Task<ActionResult<Evenement>> Create(Evenement evenement)
        {
            if (evenement.UUID == Guid.Empty)
            {
                evenement.UUID = Guid.NewGuid();
            }

            _context.Evenements.Add(evenement);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = evenement.UUID }, evenement);
        }
    }
}