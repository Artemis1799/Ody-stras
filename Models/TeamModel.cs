using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Team
{
    [Key]
    public Guid UUID { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string TeamName { get; set; } = string.Empty;

    public int? TeamNumber { get; set; }
    
    [JsonIgnore]
    public ICollection<TeamMember>? TeamMembers { get; set; }
    
    [JsonIgnore]
    public ICollection<EventTeam>? EventTeams { get; set; }
}
