using t5_back.Models;

namespace t5_back.Services;

public class DatabaseService : IDatabaseService
{
    private readonly IEquipmentService _equipmentService;
    private readonly IEventService _eventService;
    private readonly IPointService _pointService;
    private readonly IUserService _userService;
    private readonly ITeamService _teamService;
    private readonly IEmployeeService _employeeService;
    private readonly ITeamEmployeeService _teamEmployeeService;
    private readonly IPictureService _pictureService;
    private readonly IAreaService _areaService;
    private readonly IPathService _pathService;
    private readonly ISecurityZoneService _securityZoneService;
    private readonly IPlanningService _planningService;
    private readonly IActionService _actionService;

    public DatabaseService(
        IEquipmentService equipmentService,
        IEventService eventService,
        IPointService pointService,
        IUserService userService,
        ITeamService teamService,
        IEmployeeService employeeService,
        ITeamEmployeeService teamEmployeeService,
        IPictureService pictureService,
        IAreaService areaService,
        IPathService pathService,
        ISecurityZoneService securityZoneService,
        IPlanningService planningService,
        IActionService actionService)
    {
        _equipmentService = equipmentService;
        _eventService = eventService;
        _pointService = pointService;
        _userService = userService;
        _teamService = teamService;
        _employeeService = employeeService;
        _teamEmployeeService = teamEmployeeService;
        _pictureService = pictureService;
        _areaService = areaService;
        _pathService = pathService;
        _securityZoneService = securityZoneService;
        _planningService = planningService;
        _actionService = actionService;
    }

    public async Task<Dictionary<string, int>> ResetDatabaseAsync()
    {
        var result = new Dictionary<string, int>();

        result["Actions"] = await _actionService.DeleteAllAsync();
        result["Plannings"] = await _planningService.DeleteAllAsync();
        result["SecurityZones"] = await _securityZoneService.DeleteAllAsync();
        result["Paths"] = await _pathService.DeleteAllAsync();
        result["Areas"] = await _areaService.DeleteAllAsync();
        result["Pictures"] = await _pictureService.DeleteAllAsync();
        result["Points"] = await _pointService.DeleteAllAsync();
        result["TeamEmployees"] = await _teamEmployeeService.DeleteAllAsync();
        result["Teams"] = await _teamService.DeleteAllAsync();
        result["Employees"] = await _employeeService.DeleteAllAsync();
        result["Equipments"] = await _equipmentService.DeleteAllAsync();
        result["Events"] = await _eventService.DeleteAllAsync();
        result["Users"] = await _userService.DeleteAllAsync();

        return result;
    }

    public async Task<string> SeedTestDataAsync()
    {
        // Create an event
        var eventObj = await _eventService.CreateAsync(new Event
        {
            Title = "Courses de Strasbourg",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(1),
            Status = EventStatus.ToOrganize
        });

        // Create employees
        var employee1 = await _employeeService.CreateAsync(new Employee
        {
            LastName = "Dupont",
            FirstName = "Jean",
            Email = "jean.dupont@example.com",
            Phone = "0612345678"
        });

        var employee2 = await _employeeService.CreateAsync(new Employee
        {
            LastName = "Martin",
            FirstName = "Marie",
            Email = "marie.martin@example.com"
        });

        // Create a team linked to the event
        var team = await _teamService.CreateAsync(new Team
        {
            EventId = eventObj.UUID,
            TeamName = "Equipe Alpha"
        });

        // Create team-employee relationships
        await _teamEmployeeService.CreateAsync(new TeamEmployee
        {
            TeamId = team.UUID,
            EmployeeId = employee1.UUID
        });

        await _teamEmployeeService.CreateAsync(new TeamEmployee
        {
            TeamId = team.UUID,
            EmployeeId = employee2.UUID
        });

        // Create equipments
        var equipment1 = await _equipmentService.CreateAsync(new Equipment
        {
            Type = "Barrière Vauban",
            Length = 2.0f,
            Description = "Barrière de sécurité standard",
            StorageType = StorageType.Multiple
        });

        var equipment2 = await _equipmentService.CreateAsync(new Equipment
        {
            Type = "Bloc béton",
            Length = 1.5f,
            Description = "Bloc de béton anti-véhicule",
            StorageType = StorageType.Multiple
        });

        // Create points
        await _pointService.CreateAsync(new Point
        {
            EventId = eventObj.UUID,
            Name = "Point de contrôle A",
            Latitude = 48.5734f,
            Longitude = 7.7521f,
            Comment = "Entrée principale",
            Order = 1,
            Validated = false,
            EquipmentId = equipment1.UUID
        });

        await _pointService.CreateAsync(new Point
        {
            EventId = eventObj.UUID,
            Name = "Point de contrôle B",
            Latitude = 48.5745f,
            Longitude = 7.7535f,
            Comment = "Sortie de secours",
            Order = 2,
            Validated = true
        });

        // Create an area
        await _areaService.CreateAsync(new Area
        {
            EventId = eventObj.UUID,
            Name = "Zone VIP",
            ColorHex = "#FF5733",
            GeoJson = "{\"type\":\"Polygon\",\"coordinates\":[[[7.75,48.57],[7.76,48.57],[7.76,48.58],[7.75,48.58],[7.75,48.57]]]}"
        });

        // Create a path
        await _pathService.CreateAsync(new RoutePath
        {
            EventId = eventObj.UUID,
            Name = "Course 5km",
            ColorHex = "#33FF57",
            StartDate = DateTime.UtcNow.AddHours(2),
            FastestEstimatedSpeed = 15.0f,
            SlowestEstimatedSpeed = 5.0f,
            GeoJson = "{\"type\":\"LineString\",\"coordinates\":[[7.75,48.57],[7.76,48.575],[7.755,48.58]]}"
        });

        // Create a security zone
        var securityZone = await _securityZoneService.CreateAsync(new SecurityZone
        {
            EventId = eventObj.UUID,
            EquipmentId = equipment2.UUID,
            Quantity = 10,
            InstallationDate = DateTime.UtcNow.AddHours(-2),
            RemovalDate = DateTime.UtcNow.AddDays(1),
            GeoJson = "{\"type\":\"LineString\",\"coordinates\":[[7.752,48.572],[7.758,48.572]]}"
        });

        // Create a planning for the team
        var planning = await _planningService.CreateAsync(new Planning
        {
            TeamId = team.UUID
        });

        // Create actions
        await _actionService.CreateAsync(new Models.Action
        {
            PlanningId = planning.UUID,
            SecurityZoneId = securityZone.UUID,
            Type = ActionType.Setup,
            Date = DateTime.UtcNow.AddHours(-1),
            Latitude = 48.572f,
            Longitude = 7.752f
        });

        await _actionService.CreateAsync(new Models.Action
        {
            PlanningId = planning.UUID,
            SecurityZoneId = securityZone.UUID,
            Type = ActionType.Removal,
            Date = DateTime.UtcNow.AddDays(1),
            Latitude = 48.572f,
            Longitude = 7.758f
        });

        return "Test data created successfully: 1 event, 1 team, 2 employees, 2 equipments, 2 points, 1 area, 1 path, 1 security zone, 1 planning, 2 actions";
    }
}

