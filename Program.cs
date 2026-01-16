using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// CORS: allow the Angular dev server at http://localhost:4200
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",
                "http://localhost:4000",
                "http://nidhoggr-front:4000"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IEquipmentService, EquipmentService>();
builder.Services.AddScoped<IPointService, PointService>();
builder.Services.AddScoped<IDatabaseService, DatabaseService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<ITeamEmployeeService, TeamEmployeeService>();
builder.Services.AddScoped<IPictureService, PictureService>();
builder.Services.AddScoped<IAreaService, AreaService>();
builder.Services.AddScoped<IPathService, PathService>();
builder.Services.AddScoped<ISecurityZoneService, SecurityZoneService>();
builder.Services.AddScoped<IPlanningService, PlanningService>();
builder.Services.AddScoped<IActionService, ActionService>();
builder.Services.AddScoped<IJwtService, JwtService>();

var app = builder.Build();
// enable CORS
app.UseCors("AllowAngularDev");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    
    // Seed des données initiales
    SeedData(db);
}

app.MapControllers();
app.Run();

static void SeedData(AppDbContext db)
{
    // Seed des équipements prédéfinis
    SeedEquipments(db);
    
    // Vérifier si des utilisateurs existent déjà
    if (db.Users.Any())
    {
        return; // Les données existent déjà
    }
    
    // Créer un utilisateur par défaut (sans mot de passe)
    var user = new t5_back.Models.User
    {
        UUID = Guid.NewGuid(),
        Name = "admin",
        Password = null
    };
    db.Users.Add(user);
    
    db.SaveChanges();
}

static void SeedEquipments(AppDbContext db)
{
    var equipments = new List<t5_back.Models.Equipment>
    {
        // Glissières béton armé (GBA)
        new() { UUID = Guid.Parse("00000001-0001-0001-0001-000000000001"), Type = "Glissière béton armé (GBA) 2m", Length = 2.0f, Description = "60 cm de large – Longueur de 2 mètres", StorageType = t5_back.Models.StorageType.Multiple },
        new() { UUID = Guid.Parse("00000001-0001-0001-0001-000000000002"), Type = "Glissière béton armé (GBA) 1m", Length = 1.0f, Description = "60 cm de large – Longueur de 1 mètre", StorageType = t5_back.Models.StorageType.Multiple },
        
        // Blocs de béton
        new() { UUID = Guid.Parse("00000002-0002-0002-0002-000000000001"), Type = "Bloc de béton 1m", Length = 1.0f, Description = "Bloc de taille 0,6m x 0,6m x 1m", StorageType = t5_back.Models.StorageType.Multiple },
        new() { UUID = Guid.Parse("00000002-0002-0002-0002-000000000002"), Type = "Bloc de béton 2,5m", Length = 2.5f, Description = "Bloc de taille 0,6m x 0,6m x 2,5m", StorageType = t5_back.Models.StorageType.Multiple },
        
        // Barrières Vauban
        new() { UUID = Guid.Parse("00000003-0003-0003-0003-000000000001"), Type = "Barrière Vauban 2m", Length = 2.0f, Description = "Barrières de 2 mètres", StorageType = t5_back.Models.StorageType.Multiple },
        
        // Barrières Héras
        new() { UUID = Guid.Parse("00000004-0004-0004-0004-000000000001"), Type = "Barrière Héras 3,5m", Length = 3.5f, Description = "Barrières de 3,5 mètres – Délimitation de surface d'accueil de personnes", StorageType = t5_back.Models.StorageType.Multiple },
        new() { UUID = Guid.Parse("00000004-0004-0004-0004-000000000002"), Type = "Barrière Héras 3,5m avec voile", Length = 3.5f, Description = "Barrières de 3,5 mètres avec voile d'occultation", StorageType = t5_back.Models.StorageType.Multiple },
        
        // Obstacles
        new() { UUID = Guid.Parse("00000005-0005-0005-0005-000000000001"), Type = "Obstacle 0,95m", Length = 0.95f, Description = "Module obstacle – Largeur de 0,95m", StorageType = t5_back.Models.StorageType.Multiple },
        new() { UUID = Guid.Parse("00000005-0005-0005-0005-000000000002"), Type = "Obstacle 1,05m (extrémité)", Length = 1.05f, Description = "Module obstacle extrémité – Largeur de 1,05m", StorageType = t5_back.Models.StorageType.Multiple },
        
        // Engins de blocage
        new() { UUID = Guid.Parse("00000006-0006-0006-0006-000000000001"), Type = "Engin de blocage 8m", Length = 8.0f, Description = "Engin routier pour bloquer les rues – Permet le passage des secours", StorageType = t5_back.Models.StorageType.Single },
        new() { UUID = Guid.Parse("00000006-0006-0006-0006-000000000002"), Type = "Engin de blocage 9,35m", Length = 9.35f, Description = "Engin routier pour bloquer les rues – Permet le passage des secours", StorageType = t5_back.Models.StorageType.Single },
        new() { UUID = Guid.Parse("00000006-0006-0006-0006-000000000003"), Type = "Engin de blocage 9,5m", Length = 9.5f, Description = "Engin routier pour bloquer les rues – Permet le passage des secours", StorageType = t5_back.Models.StorageType.Single },
        new() { UUID = Guid.Parse("00000006-0006-0006-0006-000000000004"), Type = "Engin de blocage 11m", Length = 11.0f, Description = "Engin routier pour bloquer les rues – Permet le passage des secours", StorageType = t5_back.Models.StorageType.Single },
        new() { UUID = Guid.Parse("00000006-0006-0006-0006-000000000005"), Type = "Engin de blocage 16m", Length = 16.0f, Description = "Engin routier pour bloquer les rues – Permet le passage des secours", StorageType = t5_back.Models.StorageType.Single },
    };

    foreach (var equipment in equipments)
    {
        if (!db.Equipments.Any(e => e.UUID == equipment.UUID))
        {
            db.Equipments.Add(equipment);
        }
    }
    
    db.SaveChanges();
}