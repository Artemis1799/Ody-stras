using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

// CORS: allow the Angular dev server at http://localhost:4200
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IEquipmentService, EquipmentService>();
builder.Services.AddScoped<IPhotoService, PhotoService>();
builder.Services.AddScoped<IPointService, PointService>();
builder.Services.AddScoped<IImagePointService, ImagePointService>();
builder.Services.AddScoped<IDatabaseService, DatabaseService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<ITeamMemberService, TeamMemberService>();
builder.Services.AddScoped<IMemberService, MemberService>();
builder.Services.AddScoped<IEventTeamService, EventTeamService>();
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
    // Vérifier si des données existent déjà
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
    
    // Vous pouvez ajouter d'autres données ici
    // Exemple: des événements, équipements, etc.
    
    db.SaveChanges();
}