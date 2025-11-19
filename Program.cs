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

var app = builder.Build();
// enable CORS
app.UseCors("AllowAngularDev");

app.MapControllers();
app.Run();