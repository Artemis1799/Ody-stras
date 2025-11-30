using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class EventTeam
{
    [Required]
    public Guid EventId { get; set; }
    
    [Required]
    public Guid TeamId { get; set; }
    
    [ForeignKey("EventId")]
    [NotMapped]
    [JsonIgnore]
    public Event? Event { get; set; }
    
    [ForeignKey("TeamId")]
    [NotMapped]
    [JsonIgnore]
    public Team? Team { get; set; }
}
