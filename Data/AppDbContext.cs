using Microsoft.EntityFrameworkCore;
using t5_back.Models;

namespace t5_back.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Event> Events { get; set; }
    public DbSet<Point> Points { get; set; }
    public DbSet<Picture> Pictures { get; set; }
    public DbSet<PicturePoint> PicturePoints { get; set; }
    public DbSet<Equipment> Equipments { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Team> Teams { get; set; }
    public DbSet<TeamEmployee> TeamEmployees { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Area> Areas { get; set; }
    public DbSet<RoutePath> Paths { get; set; }
    public DbSet<SecurityZone> SecurityZones { get; set; }
    public DbSet<Planning> Plannings { get; set; }
    public DbSet<Models.Action> Actions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // PicturePoint composite key
        modelBuilder.Entity<PicturePoint>()
            .HasKey(pp => new { pp.PictureId, pp.PointId });

        // TeamEmployee composite key
        modelBuilder.Entity<TeamEmployee>()
            .HasKey(te => new { te.TeamId, te.EmployeeId });

        // Point -> Event relationship
        modelBuilder.Entity<Point>()
            .HasOne(p => p.Event)
            .WithMany(e => e.Points)
            .HasForeignKey(p => p.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        // Point -> Equipment relationship
        modelBuilder.Entity<Point>()
            .HasOne(p => p.Equipment)
            .WithMany(e => e.Points)
            .HasForeignKey(p => p.EquipmentId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        // PicturePoint -> Picture relationship
        modelBuilder.Entity<PicturePoint>()
            .HasOne(pp => pp.Picture)
            .WithMany(p => p.PicturePoints)
            .HasForeignKey(pp => pp.PictureId)
            .OnDelete(DeleteBehavior.Cascade);

        // PicturePoint -> Point relationship
        modelBuilder.Entity<PicturePoint>()
            .HasOne(pp => pp.Point)
            .WithMany(p => p.PicturePoints)
            .HasForeignKey(pp => pp.PointId)
            .OnDelete(DeleteBehavior.Cascade);

        // Team -> Event relationship
        modelBuilder.Entity<Team>()
            .HasOne(t => t.Event)
            .WithMany(e => e.Teams)
            .HasForeignKey(t => t.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        // TeamEmployee -> Team relationship
        modelBuilder.Entity<TeamEmployee>()
            .HasOne(te => te.Team)
            .WithMany(t => t.TeamEmployees)
            .HasForeignKey(te => te.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        // TeamEmployee -> Employee relationship
        modelBuilder.Entity<TeamEmployee>()
            .HasOne(te => te.Employee)
            .WithMany(e => e.TeamEmployees)
            .HasForeignKey(te => te.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        // Area -> Event relationship
        modelBuilder.Entity<Area>()
            .HasOne(a => a.Event)
            .WithMany(e => e.Areas)
            .HasForeignKey(a => a.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        // RoutePath -> Event relationship
        modelBuilder.Entity<RoutePath>()
            .HasOne(p => p.Event)
            .WithMany(e => e.Paths)
            .HasForeignKey(p => p.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        // SecurityZone -> Event relationship
        modelBuilder.Entity<SecurityZone>()
            .HasOne(sz => sz.Event)
            .WithMany(e => e.SecurityZones)
            .HasForeignKey(sz => sz.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        // SecurityZone -> Equipment relationship
        modelBuilder.Entity<SecurityZone>()
            .HasOne(sz => sz.Equipment)
            .WithMany(e => e.SecurityZones)
            .HasForeignKey(sz => sz.EquipmentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Planning -> Team relationship (one-to-one)
        modelBuilder.Entity<Planning>()
            .HasOne(p => p.Team)
            .WithOne(t => t.Planning)
            .HasForeignKey<Planning>(p => p.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        // Action -> Planning relationship
        modelBuilder.Entity<Models.Action>()
            .HasOne(a => a.Planning)
            .WithMany(p => p.Actions)
            .HasForeignKey(a => a.PlanningId)
            .OnDelete(DeleteBehavior.Cascade);

        // Action -> SecurityZone relationship
        modelBuilder.Entity<Models.Action>()
            .HasOne(a => a.SecurityZone)
            .WithMany(sz => sz.Actions)
            .HasForeignKey(a => a.SecurityZoneId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
