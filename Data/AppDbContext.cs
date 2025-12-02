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
    public DbSet<TeamMember> TeamMembers { get; set; }
    public DbSet<Member> Members { get; set; }
    public DbSet<EventTeam> EventTeams { get; set; }
    public DbSet<Geometry> Geometries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ImagePoint>()
            .HasKey(ip => new { ip.ImageId, ip.PointId });

        modelBuilder.Entity<TeamMember>()
            .HasKey(tm => new { tm.TeamId, tm.MemberId });

        modelBuilder.Entity<EventTeam>()
            .HasKey(et => new { et.EventId, et.TeamId });

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

        modelBuilder.Entity<TeamMember>()
            .HasOne(tm => tm.Team)
            .WithMany(t => t.TeamMembers)
            .HasForeignKey(tm => tm.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TeamMember>()
            .HasOne(tm => tm.Member)
            .WithMany(m => m.TeamMembers)
            .HasForeignKey(tm => tm.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EventTeam>()
            .HasOne(et => et.Event)
            .WithMany(e => e.EventTeams)
            .HasForeignKey(et => et.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EventTeam>()
            .HasOne(et => et.Team)
            .WithMany(t => t.EventTeams)
            .HasForeignKey(et => et.TeamId)
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

        modelBuilder.Entity<Geometry>()
            .HasOne(g => g.Event)
            .WithMany()
            .HasForeignKey(g => g.EventId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}