namespace t5_back.Services;
public class DatabaseResetService : IDatabaseResetService
{
    private readonly IEquipmentService _equipmentService;
    private readonly IEventService _eventService;
    private readonly IImagePointService _imagePointService;
    private readonly IPhotoService _photoService;
    private readonly IPointService _pointService;

    public DatabaseResetService(
        IEquipmentService equipmentService,
        IEventService eventService,
        IImagePointService imagePointService,
        IPhotoService photoService,
        IPointService pointService)
    {
        _equipmentService = equipmentService;
        _eventService = eventService;
        _imagePointService = imagePointService;
        _photoService = photoService;
        _pointService = pointService;
    }

    public async Task<Dictionary<string, int>> ResetDatabaseAsync()
    {
        var result = new Dictionary<string, int>();

        result["ImagePoints"] = await _imagePointService.DeleteAllAsync();
        result["Points"] = await _pointService.DeleteAllAsync();
        result["Photos"] = await _photoService.DeleteAllAsync();
        result["Equipments"] = await _equipmentService.DeleteAllAsync();
        result["Events"] = await _eventService.DeleteAllAsync();

        return result;
    }
}
