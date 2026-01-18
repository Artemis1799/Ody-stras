using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Team
{
    [Key]
    public Guid UUID { get; set; }
    
    [Required]
    public Guid EventId { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string TeamName { get; set; } = string.Empty;
    
    public int? TeamNumber { get; set; }
    
    [ForeignKey("EventId")]
    [JsonIgnore]
    public Event? Event { get; set; }
    
    [JsonIgnore]
    public ICollection<TeamEmployee>? TeamEmployees { get; set; }
    
    [JsonIgnore]
    public Planning? Planning { get; set; }
}

