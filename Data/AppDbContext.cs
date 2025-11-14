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
        public DbSet<Photo> Photos { get; set; }
        public DbSet<Image_Point> ImagePoints { get; set; }
        public DbSet<Equipement> Equipements { get; set; }
        public DbSet<Point_Equipement> PointEquipements { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Image_Point>()
                .HasKey(ip => new { ip.Image_ID, ip.Point_ID });

            modelBuilder.Entity<Point_Equipement>()
                .HasKey(pe => new { pe.Point_ID, pe.Equipement_ID });

            modelBuilder.Entity<Point>()
                .HasOne(p => p.Evenement)
                .WithMany(e => e.Points)
                .HasForeignKey(p => p.Event_ID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Image_Point>()
                .HasOne(ip => ip.Photo)
                .WithMany(p => p.ImagePoints)
                .HasForeignKey(ip => ip.Image_ID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Image_Point>()
                .HasOne(ip => ip.Point)
                .WithMany(p => p.ImagePoints)
                .HasForeignKey(ip => ip.Point_ID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Point_Equipement>()
                .HasOne(pe => pe.Point)
                .WithMany(p => p.PointEquipements)
                .HasForeignKey(pe => pe.Point_ID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Point_Equipement>()
                .HasOne(pe => pe.Equipement)
                .WithMany(e => e.PointEquipements)
                .HasForeignKey(pe => pe.Equipement_ID)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}