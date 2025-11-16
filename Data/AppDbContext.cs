using Microsoft.EntityFrameworkCore;
using t5_back.Models;

namespace t5_back.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Evenement> Evenements { get; set; }
    public DbSet<Point> Points { get; set; }
    public DbSet<Photo> Photos { get; set; }
    public DbSet<ImagePoint> ImagePoints { get; set; }
    public DbSet<Equipment> Equipments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ImagePoint>()
            .HasKey(ip => new { ip.ImageId, ip.PointId });

        modelBuilder.Entity<Point>()
            .HasOne(p => p.Evenement)
            .WithMany(e => e.Points)
            .HasForeignKey(p => p.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Point>()
            .HasOne(p => p.Equipment)
            .WithMany(e => e.Points)
            .HasForeignKey(p => p.EquipmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ImagePoint>()
            .HasOne(ip => ip.Photo)
            .WithMany(ph => ph.ImagePoints)
            .HasForeignKey(ip => ip.ImageId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ImagePoint>()
            .HasOne(ip => ip.Point)
            .WithMany(p => p.ImagePoints)
            .HasForeignKey(ip => ip.PointId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}