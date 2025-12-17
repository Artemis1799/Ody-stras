using t5_back.Models;

namespace t5_back.Services;
public interface IMemberService
{
	Task<IEnumerable<Member>> GetAllAsync();
	Task<Member?> GetByIdAsync(Guid id);
	Task<Member> CreateAsync(Member member);
	Task<Member?> UpdateAsync(Guid id, Member member);
	Task<bool> DeleteAsync(Guid id);
	Task<int> DeleteAllAsync();
}
