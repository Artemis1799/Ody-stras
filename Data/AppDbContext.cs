using Microsoft.EntityFrameworkCore;
using t5_back.Models;

namespace t5_back.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Evenement> Evenements { get; set; }
        public DbSet<Point> Points { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // relation Evenement -> Points (one-to-many)
            modelBuilder.Entity<Point>()
                .HasOne(p => p.Evenement)
                .WithMany(e => e.Points)
                .HasForeignKey(p => p.Event_ID)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}