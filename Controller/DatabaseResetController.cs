using Microsoft.AspNetCore.Mvc;
using t5_back.Services;

namespace t5_back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DatabaseResetController : ControllerBase
{
    private readonly IDatabaseResetService _databaseResetService;

    public DatabaseResetController(IDatabaseResetService databaseResetService)
    {
        _databaseResetService = databaseResetService;
    }

    [HttpDelete("reset")]
    public async Task<ActionResult<Dictionary<string, int>>> ResetDatabase()
    {
        var result = await _databaseResetService.ResetDatabaseAsync();
        return Ok(result);
    }
}
