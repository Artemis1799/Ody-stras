using Microsoft.EntityFrameworkCore;
using t5_back.Data;
using t5_back.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddScoped<IEvenementService, EvenementService>();

var app = builder.Build();

app.MapControllers();
app.Run();