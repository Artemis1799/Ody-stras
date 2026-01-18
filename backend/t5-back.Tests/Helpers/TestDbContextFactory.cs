using Microsoft.EntityFrameworkCore;
using t5_back.Data;

namespace t5_back.Tests.Helpers;

/// <summary>
/// Factory pour créer des contextes de base de données en mémoire pour les tests
/// </summary>
public static class TestDbContextFactory
{
    /// <summary>
    /// Crée un nouveau AppDbContext avec une base de données en mémoire unique
    /// </summary>
    public static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    /// <summary>
    /// Crée un nouveau AppDbContext avec un nom de base de données spécifique
    /// Utile pour partager la même base entre plusieurs contextes
    /// </summary>
    public static AppDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: databaseName)
            .Options;

        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}
