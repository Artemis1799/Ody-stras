using t5_back.Models;

namespace t5_back.Services;
public interface IPointService
{
    Task<IEnumerable<Point>> GetAllAsync();
    Task<Point?> GetByIdAsync(Guid id);
    Task<Point> CreateAsync(Point point);
    Task<Point?> UpdateAsync(Guid id, Point point);
    Task<bool> DeleteAsync(Guid id);
    Task<int> DeleteAllAsync();
}
