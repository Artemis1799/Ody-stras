using t5_back.Models;

namespace t5_back.Services;
public class DatabaseService : IDatabaseService
{
    private readonly IEquipmentService _equipmentService;
    private readonly IEventService _eventService;
    private readonly IImagePointService _imagePointService;
    private readonly IPhotoService _photoService;
    private readonly IPointService _pointService;
    private readonly IUserService _userService;
    private readonly ITeamService _teamService;
    private readonly IMemberService _memberService;
    private readonly ITeamUserService _teamUserService;

    public DatabaseService(
        IEquipmentService equipmentService,
        IEventService eventService,
        IImagePointService imagePointService,
        IPhotoService photoService,
        IPointService pointService,
        IUserService userService,
        ITeamService teamService,
        IMemberService memberService,
        ITeamUserService teamUserService)
    {
        _equipmentService = equipmentService;
        _eventService = eventService;
        _imagePointService = imagePointService;
        _photoService = photoService;
        _pointService = pointService;
        _userService = userService;
        _teamService = teamService;
        _memberService = memberService;
        _teamUserService = teamUserService;
    }

    public async Task<Dictionary<string, int>> ResetDatabaseAsync()
    {
        var result = new Dictionary<string, int>();

        result["ImagePoints"] = await _imagePointService.DeleteAllAsync();
        result["Points"] = await _pointService.DeleteAllAsync();
        result["Photos"] = await _photoService.DeleteAllAsync();
        result["Equipments"] = await _equipmentService.DeleteAllAsync();
        result["Events"] = await _eventService.DeleteAllAsync();
        result["TeamUsers"] = await _teamUserService.DeleteAllAsync();
        result["Teams"] = await _teamService.DeleteAllAsync();
        result["Members"] = await _memberService.DeleteAllAsync();
        result["Users"] = await _userService.DeleteAllAsync();

        return result;
    }

    public async Task<string> SeedTestDataAsync()
    {
        // Créer l'utilisateur admin
        var admin = await _userService.CreateAsync(new User
        {
            Name = "admin",
            Password = null
        });

        // Créer l'équipe
        var team = await _teamService.CreateAsync(new Team
        {
            TeamName = "Test Team"
        });

        // Créer deux membres
        var member1 = await _memberService.CreateAsync(new Member
        {
            Name = "Dupont",
            FirstName = "Jean"
        });

        var member2 = await _memberService.CreateAsync(new Member
        {
            Name = "Martin",
            FirstName = "Marie"
        });

        // Créer les relations TeamUser
        await _teamUserService.CreateAsync(new TeamUser
        {
            TeamId = team.UUID,
            UserId = admin.UUID,
            MemberId = member1.UUID
        });

        await _teamUserService.CreateAsync(new TeamUser
        {
            TeamId = team.UUID,
            UserId = admin.UUID,
            MemberId = member2.UUID
        });

        // Créer deux équipements
        var equipment1 = await _equipmentService.CreateAsync(new Equipment
        {
            Type = "Beacon",
            Description = "Test beacon device",
            Unit = "pcs",
            TotalStock = 100,
            RemainingStock = 95
        });

        var equipment2 = await _equipmentService.CreateAsync(new Equipment
        {
            Type = "Cable",
            Description = "Network cable",
            Unit = "m",
            TotalStock = 500,
            RemainingStock = 450
        });

        // Créer un événement
        var eventObj = await _eventService.CreateAsync(new Event
        {
            Name = "Test Event",
            Description = "This is a test event",
            StartDate = DateTime.UtcNow,
            Status = EventStatus.ToOrganize,
            TeamId = team.UUID
        });

        // Créer deux points
        await _pointService.CreateAsync(new Point
        {
            EventId = eventObj.UUID,
            EquipmentId = equipment1.UUID,
            Latitude = 48.8566f,
            Longitude = 2.3522f,
            Comment = "Point 1 - Paris",
            Order = 1,
            IsValid = true,
            EquipmentQuantity = 5
        });

        await _pointService.CreateAsync(new Point
        {
            EventId = eventObj.UUID,
            EquipmentId = equipment2.UUID,
            Latitude = 45.764f,
            Longitude = 4.8357f,
            Comment = "Point 2 - Lyon",
            Order = 2,
            IsValid = false,
            EquipmentQuantity = 10
        });

        return "Test data created successfully: 1 user (admin), 1 team, 2 members, 2 equipments, 1 event, 2 points";
    }
}
