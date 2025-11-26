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
    public DbSet<Photo> Photos { get; set; }
    public DbSet<ImagePoint> ImagePoints { get; set; }
    public DbSet<Equipment> Equipments { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Team> Teams { get; set; }
    public DbSet<TeamUser> TeamUsers { get; set; }
    public DbSet<Member> Members { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ImagePoint>()
            .HasKey(ip => new { ip.ImageId, ip.PointId });

        modelBuilder.Entity<TeamUser>()
            .HasKey(eu => new { eu.TeamId, eu.UserId, eu.MemberId });

        modelBuilder.Entity<Point>()
            .HasOne(p => p.Event)
            .WithMany(e => e.Points)
            .HasForeignKey(p => p.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Point>()
            .HasOne(p => p.Equipment)
            .WithMany(e => e.Points)
            .HasForeignKey(p => p.EquipmentId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        modelBuilder.Entity<Event>()
            .HasOne(e => e.Team)
            .WithMany(eq => eq.Events)
            .HasForeignKey(e => e.TeamId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        modelBuilder.Entity<TeamUser>()
            .HasOne(eu => eu.Team)
            .WithMany(eq => eq.TeamUsers)
            .HasForeignKey(eu => eu.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TeamUser>()
            .HasOne(eu => eu.User)
            .WithMany(u => u.TeamUsers)
            .HasForeignKey(eu => eu.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TeamUser>()
            .HasOne(eu => eu.Member)
            .WithMany(m => m.TeamUsers)
            .HasForeignKey(eu => eu.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

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