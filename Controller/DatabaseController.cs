using Microsoft.AspNetCore.Mvc;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DatabaseController : ControllerBase
{
    private readonly IDatabaseService _databaseService;

    public DatabaseController(IDatabaseService databaseService)
    {
        _databaseService = databaseService;
    }

    [HttpDelete("reset")]
    public async Task<ActionResult<Dictionary<string, int>>> ResetDatabase()
    {
        var result = await _databaseService.ResetDatabaseAsync();
        return Ok(result);
    }

    [HttpPost("seed")]
    public async Task<ActionResult<string>> SeedTestData()
    {
        var result = await _databaseService.SeedTestDataAsync();
        return Ok(result);
    }
}
