using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Member
{
    [Key]
    public Guid UUID { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string FirstName { get; set; } = string.Empty;
    
    [MaxLength(60)]
    public string? Email { get; set; }
    
    [MaxLength(50)]
    public string? PhoneNumber { get; set; }
    
    [JsonIgnore]
    public ICollection<TeamMember>? TeamMembers { get; set; }
}
